"""Federation provisioning orchestration for the CSE operator console.

This module is the OPERATOR-ONLY engine behind the `CSE Federation` setup
wizard. Given a fully-filled `CSE Federation` document it stands up a brand new,
fully isolated Frappe site end to end by reusing the existing, already-verified
platform scripts — it introduces no new site logic of its own, it only sequences
the tooling the runbook already documents (see
`platform/runbook/federation-provisioning.md`).

IMPORTANT — where this runs:
    Every step here shells out to `bench` and to `run_on_site.py <script>` on the
    bench host. It therefore MUST execute on the machine that hosts frappe-bench,
    as the OS user that owns the bench (conventionally `frappe`) — `bench`
    refuses to run as root, and the site scripts need the bench's virtualenv
    python. In production the `provision_federation` entry point enqueues the
    work onto the `long` background queue, so the worker process (running as the
    frappe user on the bench host) is what actually performs these calls.

Sealed-box rule: nothing in here edits frappe/lms source. Site behaviour
(certificate rule, branding, roles, content, payments, admin) is applied purely
through the existing scripts, which themselves only write site DATA.

Idempotency: the underlying scripts are all safe to re-run (they match existing
rows before inserting). `bench new-site` is the one non-idempotent call, so step
1 skips creation when the site directory already exists — making a re-run of a
partially-failed provision safe to kick off again.
"""

import os
import subprocess

import frappe
from frappe.utils import now_datetime

# ---------------------------------------------------------------------------
# Static configuration
# ---------------------------------------------------------------------------

# Every federation's default hostname is <subdomain>.combatsportseducation.com
# (see the domain scheme in milestone-1-runbook.md). The full site name is
# derived here from the doc's `subdomain` field so the operator never types the
# suffix.
DOMAIN_SUFFIX = "combatsportseducation.com"

# The Role Profile the federation's first admin user is given. "Federation
# Admin" can create/edit all content and manage users through the LMS UI without
# being a full System Manager (see configure_branding_roles.py).
ADMIN_ROLE_PROFILE = "Federation Admin"


def _conf(key, default=None):
    """Resolve a host/deploy setting from site config first, then the process
    environment, then a fallback.

    Secrets and host paths (the MariaDB root password, the new-site admin
    password, where the CSE scripts and bench live) deliberately live OUTSIDE
    the CSE Federation document — they are host configuration, not per-federation
    data — so they are read from common_site_config.json / site config or the
    worker's environment rather than from the doc.
    """
    val = frappe.conf.get(key)
    if val:
        return val
    return os.environ.get(key, default)


def _bench_path():
    """Absolute path to the frappe-bench directory (cwd for `bench` calls)."""
    return _conf("cse_bench_path", "/home/frappe/frappe-bench")


def _bench_env_python():
    """The bench virtualenv python used to run the site scripts."""
    return os.path.join(_bench_path(), "env", "bin", "python")


def _scripts_dir():
    """Where the platform/scripts/ tooling is deployed on the bench host.

    run_on_site.py, the *.py site scripts and smoke_test.sh are expected here.
    Matches the LOGO_PATH default baked into configure_branding_roles.py
    (/home/frappe/cse-scripts/...).
    """
    return _conf("cse_scripts_dir", "/home/frappe/cse-scripts")


def _sites_dir():
    """The bench's sites/ directory — used to test whether a site already
    exists (idempotency guard for step 1)."""
    return os.path.join(_bench_path(), "sites")


# ---------------------------------------------------------------------------
# Whitelisted entry point (operator-only)
# ---------------------------------------------------------------------------


@frappe.whitelist()
def provision_federation(federation_name):
    """Kick off provisioning for a `CSE Federation` and return immediately.

    Operator-only: guarded to System Manager (the console is an internal
    operator tool, never exposed to federation end users). The heavy lifting —
    `bench new-site`, installing apps, running every site script, wiring the
    custom domain, and the smoke-test gate — can take minutes, so it is pushed
    onto the `long` background queue with a generous timeout; the caller (the
    Desk form) then polls the doc's `status` and `provisioning_steps` table for
    live progress.

    Args:
        federation_name: `name` of the CSE Federation doc to provision.

    Returns:
        A small dict the client uses to start polling.
    """
    # Console is operator-only. Refuse anyone who is not a System Manager.
    frappe.only_for("System Manager")

    doc = frappe.get_doc("CSE Federation", federation_name)

    # Flip to Provisioning and clear any prior run's step log so the table shows
    # a clean, in-progress run. Commit before enqueuing so the worker (a
    # separate process) reads the updated state.
    doc.status = "Provisioning"
    doc.set("provisioning_steps", [])
    doc.save(ignore_permissions=True)
    frappe.db.commit()

    frappe.enqueue(
        "cse_console.provisioning._run_provisioning",
        queue="long",
        timeout=3600,
        federation_name=federation_name,
        # Enqueue only after the above commit lands, so the job never starts
        # against stale/uncommitted state.
        enqueue_after_commit=True,
    )

    return {
        "federation": federation_name,
        "status": "Provisioning",
        "message": "Provisioning enqueued on the long queue.",
    }


# ---------------------------------------------------------------------------
# Shell helper
# ---------------------------------------------------------------------------


def _redact(text, secrets=None):
    """Replace each secret value with '***' in `text`.

    Used so passwords that must be passed as CLI args (e.g. bench new-site's
    --mariadb-root-password / --admin-password) never reach the step log or a
    raised exception, both of which get persisted into the CSE Federation doc.
    """
    if not text or not secrets:
        return text
    for s in secrets:
        if s:
            text = text.replace(str(s), "***")
    return text


def _run(cmd, env=None, cwd=None, redact=None):
    """Run a subprocess, capture stdout+stderr, raise on non-zero exit.

    Args:
        cmd: command as an argv list (never a shell string — no shell parsing,
             so federation-supplied values can't inject extra commands).
        env: optional dict of EXTRA environment variables layered on top of the
             worker's own environment. None values are dropped.
        cwd: working directory for the command.
        redact: optional list of secret strings to scrub (replace with '***')
             from BOTH the returned log and the raised exception — for commands
             that must take secrets as argv (bench new-site). Everything _run
             emits is persisted into the federation record, so secrets in argv
             would otherwise leak in plaintext.

    Returns:
        The combined stdout+stderr as a single string (the step log), redacted.

    Raises:
        RuntimeError: if the command exits non-zero — message includes the exit
        code, the (redacted) command, and the captured output so the failing
        step's log is self-explanatory without exposing secrets.
    """
    run_env = os.environ.copy()
    if env:
        run_env.update({k: str(v) for k, v in env.items() if v is not None})

    proc = subprocess.run(
        cmd,
        env=run_env,
        cwd=cwd,
        capture_output=True,
        text=True,
    )
    log = _redact((proc.stdout or "") + (proc.stderr or ""), redact)
    if proc.returncode != 0:
        raise RuntimeError(
            _redact(
                "command failed (exit {code}): {cmd}\n{log}".format(
                    code=proc.returncode, cmd=" ".join(cmd), log=log
                ),
                redact,
            )
        )
    return log


def _run_site_script(site, script, env=None):
    """Run one of the platform site scripts against `site` via run_on_site.py.

    Mirrors the documented invocation exactly:
        SITE=<site> ~/frappe-bench/env/bin/python run_on_site.py <script>
    with any extra per-script env (FEDERATION_NAME, PRIMARY_COLOR, EXPORT_DIR,
    ADMIN_EMAIL, ...) layered on. run_on_site.py chdirs into the bench sites dir
    and execs the script, so the script path is passed absolute.
    """
    script_env = {"SITE": site}
    if env:
        script_env.update(env)
    cmd = [
        _bench_env_python(),
        os.path.join(_scripts_dir(), "run_on_site.py"),
        os.path.join(_scripts_dir(), script),
    ]
    return _run(cmd, env=script_env, cwd=_scripts_dir())


def _attach_local_path(file_url):
    """Resolve a `CSE Federation.logo` Attach URL to an absolute file path.

    The branding script's LOGO_PATH wants a real filesystem path, but the doc
    stores a File URL (e.g. /files/logo.png). Look up the backing File doc and
    ask it for its full path. Returns "" when there is no logo, letting the
    branding script fall back to its own default.
    """
    if not file_url:
        return ""
    name = frappe.db.get_value("File", {"file_url": file_url}, "name")
    if name:
        # File.get_full_path() maps public/private URLs to the on-disk path.
        return frappe.get_doc("File", name).get_full_path()
    return ""


# ---------------------------------------------------------------------------
# Per-step status bookkeeping
# ---------------------------------------------------------------------------


def _start_step(doc, label):
    """Append (or reuse) a `provisioning_steps` row, mark it Running, commit.

    Returns the child row so the caller can attach the log on completion.
    Reusing an existing row by label keeps a re-run's table from duplicating
    steps.
    """
    row = next((r for r in doc.provisioning_steps if r.step == label), None)
    if row is None:
        row = doc.append("provisioning_steps", {"step": label})
    row.status = "Running"
    row.started = now_datetime()
    row.finished = None
    row.log = ""
    doc.save(ignore_permissions=True)
    frappe.db.commit()
    return row


def _finish_step(doc, row, log, status="Done"):
    """Mark a step row terminal (Done/Failed) with its captured log, commit."""
    row.status = status
    row.finished = now_datetime()
    # Keep the stored log bounded — Small Text is fine for kilobytes but a
    # runaway traceback shouldn't bloat the doc; keep the tail (most relevant).
    row.log = (log or "")[-4000:]
    doc.save(ignore_permissions=True)
    frappe.db.commit()


# ---------------------------------------------------------------------------
# The worker
# ---------------------------------------------------------------------------


def _run_provisioning(federation_name):
    """Background worker: run the 8 provisioning steps in order for one
    federation, recording each step's status/log/timestamps into the doc and
    committing between steps.

    Runs on the bench host as the frappe user (dispatched from the `long`
    queue). Any step raising marks that step Failed, flips the federation to
    Failed, and stops — earlier steps' successful state is preserved so a fixed
    re-run resumes cleanly (the scripts are idempotent; step 1 skips an existing
    site).
    """
    doc = frappe.get_doc("CSE Federation", federation_name)
    site = "{sub}.{suffix}".format(sub=doc.subdomain, suffix=DOMAIN_SUFFIX)

    # Host secrets/paths (NOT stored on the federation doc — see _conf docstring).
    mariadb_root_password = _conf("cse_mariadb_root_password")
    new_site_admin_password = _conf("cse_new_site_admin_password")

    # ------------------------------------------------------------------
    # Define the ordered steps as (label, callable). Each callable takes no
    # args, does its work, and returns a log string. Conditional steps return a
    # short "skipped" note instead of running.
    # ------------------------------------------------------------------

    def step_create_site():
        """1) bench new-site — the isolated Frappe site for this federation.

        Idempotency guard: if the site dir already exists we skip creation so a
        re-run of a partially-failed provision doesn't error out. Passwords come
        from host config, never the doc.
        """
        if os.path.isdir(os.path.join(_sites_dir(), site)):
            return "site {} already exists — skipping bench new-site".format(site)
        cmd = [
            "bench",
            "new-site",
            site,
            "--mariadb-root-password",
            mariadb_root_password or "",
            "--admin-password",
            new_site_admin_password or "",
            # Grant the site DB user access from any host (matches the runbook).
            "--mariadb-user-host-login-scope=%",
        ]
        # These passwords are in argv; redact them from the log/exception that
        # gets persisted into the federation record.
        return _run(
            cmd,
            cwd=_bench_path(),
            redact=[mariadb_root_password, new_site_admin_password],
        )

    def step_install_apps():
        """2) Install the LMS platform app and the CSE branding app onto the
        new site. install-app is a no-op if already installed, so this is
        re-run safe."""
        log = _run(["bench", "--site", site, "install-app", "lms"], cwd=_bench_path())
        log += _run(
            ["bench", "--site", site, "install-app", "cse_branding"],
            cwd=_bench_path(),
        )
        return log

    def step_branding_roles():
        """3) Branding + the 4 CSE role profiles (configure_branding_roles.py).

        Feeds the federation's brand tokens from the doc into the site's
        Website Settings / Website Theme AND the Track-1 CSE Login Branding
        single, plus creates the CSE User / Federation Admin / Coach / Athlete
        role profiles.
        """
        env = {
            "FEDERATION_NAME": doc.federation_name,
            "PRIMARY_COLOR": doc.primary_color,
            "NAVY_COLOR": doc.navy_color,
            "FONT_APP": doc.font_app,
            "FONT_DISPLAY": doc.font_display,
            "LOGO_PATH": _attach_local_path(doc.logo),
        }
        return _run_site_script(site, "configure_branding_roles.py", env)

    def step_certificate():
        """4) The 1-year certificate expiry rule + branded print format
        (configure_certificate.py). No per-federation inputs."""
        return _run_site_script(site, "configure_certificate.py")

    def step_content():
        """5) Initial content + clients (import_bundle.py) — only when an import
        source is selected. Source-neutral: the adapter that produced the bundle
        is irrelevant here; we just point the importer at the bundle dir."""
        if not doc.import_source or doc.import_source == "None":
            return "no import source selected — skipping content import"
        env = {
            "EXPORT_DIR": doc.import_bundle_path,
            "IMPORT_PROGRESS": "1" if doc.import_progress else "0",
        }
        return _run_site_script(site, "import_bundle.py", env)

    def step_payments():
        """6) Payment provider wiring (configure_payments.py) — only when the
        provider is Stripe. The Stripe keys live on the doc (secret key is a
        Password field, read back via get_password) and are passed to the
        payments script as env.

        NOTE: configure_payments.py is the payments-track site script; it is
        orchestrated here the same way as the other scripts. If it is not yet
        deployed to the scripts dir, leave payment_provider = None and this step
        is skipped.
        """
        if doc.payment_provider != "Stripe":
            return "payment provider is not Stripe — skipping payments setup"
        env = {
            "STRIPE_PUBLISHABLE_KEY": doc.stripe_publishable_key,
            # get_password decrypts the stored Password field.
            "STRIPE_SECRET_KEY": doc.get_password("stripe_secret_key"),
            "PAYMENT_CURRENCY": doc.payment_currency or "USD",
        }
        return _run_site_script(site, "configure_payments.py", env)

    def step_admin_user():
        """7) The federation's first admin user (create_admin_user.py), given
        the Federation Admin role profile so they can run the site through the
        LMS UI.

        The initial password comes from host config (cse_admin_initial_password)
        or, absent that, a random secret — which is NOT logged. Operators should
        have the admin reset it (or set SEND_WELCOME_EMAIL on the script) on
        first login.
        """
        if not doc.admin_email:
            return "no admin email provided — skipping admin user creation"
        initial_password = _conf("cse_admin_initial_password") or frappe.generate_hash(
            length=16
        )
        env = {
            "ADMIN_EMAIL": doc.admin_email,
            "ADMIN_FIRST_NAME": doc.admin_first_name,
            "ADMIN_LAST_NAME": doc.admin_last_name,
            "ROLE_PROFILE": ADMIN_ROLE_PROFILE,
            "NEW_PASSWORD": initial_password,
        }
        # Don't leak the password into the step log.
        return _run_site_script(site, "create_admin_user.py", env)

    def step_custom_domain():
        """8) Custom vanity domain (bench setup add-domain + nginx + certbot) —
        only when a custom_domain is set. DNS (the CNAME to the federation
        subdomain) is a MANUAL pre-step the operator must have completed; it is
        surfaced in the UI and cannot be automated from here.
        """
        if not doc.custom_domain:
            return "no custom domain — skipping domain + TLS setup"
        domain = doc.custom_domain
        log = _run(
            ["bench", "setup", "add-domain", domain, "--site", site],
            cwd=_bench_path(),
        )
        log += _run(["bench", "setup", "nginx", "--yes"], cwd=_bench_path())
        log += _run(["systemctl", "reload", "nginx"])
        # Non-interactive certbot; -m contact email falls back to the admin's.
        certbot_email = doc.admin_email or "platform@{}".format(DOMAIN_SUFFIX)
        log += _run(
            [
                "certbot",
                "--nginx",
                "-d",
                domain,
                "-n",
                "--agree-tos",
                "-m",
                certbot_email,
            ]
        )
        return log

    def step_smoke_test():
        """Acceptance gate: smoke_test.sh drives the real learner flow
        (login -> enroll -> lessons -> quiz -> certificate) over the site's HTTP
        API. If it fails, the federation is NOT considered Live."""
        return _run(
            ["bash", os.path.join(_scripts_dir(), "smoke_test.sh")],
            env={"SITE": site},
            cwd=_scripts_dir(),
        )

    steps = [
        ("1. bench new-site", step_create_site),
        ("2. install-app lms + cse_branding", step_install_apps),
        ("3. configure_branding_roles.py", step_branding_roles),
        ("4. configure_certificate.py", step_certificate),
        ("5. import_bundle.py (content + clients)", step_content),
        ("6. configure_payments.py", step_payments),
        ("7. create_admin_user.py", step_admin_user),
        ("8. custom domain + TLS", step_custom_domain),
        ("gate: smoke_test.sh", step_smoke_test),
    ]

    # ------------------------------------------------------------------
    # Execute each step in order. Wrap every step so a failure records the log,
    # flips both the row and the federation to Failed, and stops the run.
    # ------------------------------------------------------------------
    for label, fn in steps:
        row = _start_step(doc, label)
        try:
            log = fn()
        except Exception:
            # Capture the full traceback (RuntimeError from _run already carries
            # the command output) so the operator can diagnose from the doc.
            _finish_step(doc, row, frappe.get_traceback(), status="Failed")
            doc.status = "Failed"
            doc.save(ignore_permissions=True)
            frappe.db.commit()
            # Re-raise so the job is marked failed in the RQ/worker log too.
            raise
        _finish_step(doc, row, log, status="Done")

    # All steps (including the smoke-test gate) passed -> the federation is live.
    doc.status = "Live"
    doc.save(ignore_permissions=True)
    frappe.db.commit()
    return {"federation": federation_name, "status": "Live"}
