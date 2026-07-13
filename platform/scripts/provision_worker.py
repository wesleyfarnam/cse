"""CSE provisioning worker — turns queued Federation records into live sites.

This is the host-side half of Milestone 2. The CSE Console (cse_console app)
lets an admin queue a federation: a `Federation` row is written with
status=Provisioning. This worker polls the console for such rows and, for each
one, runs the Milestone 1 onboarding steps (runbook steps 1-8) against the
bench, then writes the result (Active / Error + a full log) back to the console.

It never touches frappe/lms source — it only shells out to `bench` and to the
sibling `configure_*` / `create_*` scripts, exactly as the runbook does by hand.

Console <-> worker transport is `bench execute` of the (non-whitelisted, so
never HTTP-exposed) helpers in cse_console.console_api:
  - fetch_provision_job     -> prints  JOB|b64name|b64host|b64color|b64logo
  - set_federation_status   <- name_b64, status, log_b64

Usage (as the frappe user, from anywhere):
    CONSOLE_SITE=console.combatsportseducation.com \
    DB_ROOT_PASSWORD=... \
    python3 provision_worker.py            # poll forever
    python3 provision_worker.py --oneshot  # process at most one job, then exit
    python3 provision_worker.py --dry-run  # print the steps, run nothing

Every setting is an env var (see CONFIG below) so this can run under systemd or
cron. --oneshot + cron is the simplest deployment; the long-running loop is for
a dedicated worker box.
"""

import os
import sys
import time

from console_worker import (
	BENCH,
	BENCH_DIR,
	CONSOLE_SITE,
	SCRIPTS_DIR,
	Runner,
	b64d,
	b64e,
	build_execute_cmd,
	cap_log,
	site_script_cmd,
)

# --------------------------------------------------------------------------- #
# Config (provisioning-specific; shared config lives in console_worker.py)
# --------------------------------------------------------------------------- #
DB_ROOT_PASSWORD = os.environ.get("DB_ROOT_PASSWORD", "")
# Tenant Administrator password. A per-site random value is safer in prod; the
# federation admin logs in as their own FED_ADMIN_EMAIL, not as Administrator.
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
DEFAULT_LOGO = os.environ.get("DEFAULT_LOGO", "")

POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", "15"))

STATUS_ACTIVE = "Active"
STATUS_ERROR = "Error"


# --------------------------------------------------------------------------- #
# Pure helpers (no side effects — unit-tested in test_provision_worker.py)
# --------------------------------------------------------------------------- #
def parse_job(stdout):
	"""Extract the JOB|... line printed by fetch_provision_job.

	Returns a dict of {name, hostname, brand_color, logo} or None when the
	console reported no pending job.
	"""
	for line in stdout.splitlines():
		line = line.strip()
		if line.startswith("JOB|"):
			parts = line.split("|")
			if len(parts) != 5:
				continue
			return {
				"name": b64d(parts[1]),
				"hostname": b64d(parts[2]),
				"brand_color": b64d(parts[3]),
				"logo": b64d(parts[4]),
			}
	return None


def resolve_logo_path(logo, console_site, bench_dir):
	"""Map a Federation.logo value to a real file on disk.

	Attach Image stores either an absolute path or a site file URL
	(/files/x public, /private/files/x private). The bytes live under the
	*console* site, so resolve relative URLs there. Returns None if nothing
	usable is found (caller falls back to DEFAULT_LOGO).
	"""
	if not logo:
		return None
	if os.path.isabs(logo) and os.path.exists(logo):
		return logo
	site_root = os.path.join(bench_dir, "sites", console_site)
	if logo.startswith("/private/"):
		candidate = site_root + logo
	elif logo.startswith("/files/"):
		candidate = os.path.join(site_root, "public") + logo
	else:
		candidate = None
	if candidate and os.path.exists(candidate):
		return candidate
	return None


# --------------------------------------------------------------------------- #
# Side-effecting layer
# --------------------------------------------------------------------------- #
def fetch_job(runner):
	rc, out = runner.run(build_execute_cmd(CONSOLE_SITE, "cse_console.console_api.fetch_provision_job"))
	if rc != 0:
		raise RuntimeError(f"fetch_provision_job failed (rc={rc}):\n{out}")
	if runner.dry_run:
		return None
	return parse_job(out)


def report_status(runner, name, status, log):
	kwargs = {"name_b64": b64e(name), "status": status, "log_b64": b64e(cap_log(log))}
	rc, out = runner.run(build_execute_cmd(CONSOLE_SITE, "cse_console.console_api.set_federation_status", kwargs))
	if rc != 0:
		# Report failures are logged but non-fatal — the next poll retries the
		# (still-Provisioning) row rather than crashing the whole worker.
		sys.stderr.write(f"WARN: could not set status for {name} (rc={rc}):\n{out}\n")


def _site_script(runner, site, script, extra_env=None):
	"""Run one configure_*/create_* script on a site via run_on_site.py."""
	env = {"SITE": site, "BENCH_SITES": os.path.join(BENCH_DIR, "sites")}
	if extra_env:
		env.update(extra_env)
	return runner.run(site_script_cmd(site, script), env=env)


def provision(runner, job):
	"""Run every onboarding step for one job. Returns (ok, log)."""
	host = job["hostname"]
	name = job["name"]
	log_parts = [f"=== Provisioning {name} ({host}) ==="]

	logo = resolve_logo_path(job["logo"], CONSOLE_SITE, BENCH_DIR) or DEFAULT_LOGO or job["logo"]
	brand_env = {
		"FEDERATION_NAME": name,
		"BRAND_COLOR": job["brand_color"] or "#C41E3A",
		"BRAND_COLOR_NAME": f"{name} Primary",
		"BRAND_LOGO": logo,
		# Reuse the federation's logo as its favicon (no separate favicon field
		# on the console yet); overridable later if one is added.
		"BRAND_FAVICON": logo,
		"FED_ADMIN_EMAIL": f"admin@{host}",
	}

	# (label, callable -> (rc, out), success_marker or None [None => rc==0 only])
	steps = [
		("new-site", lambda: runner.run(
			[BENCH, "new-site", host,
			 "--db-root-password", DB_ROOT_PASSWORD,
			 "--admin-password", ADMIN_PASSWORD,
			 "--install-app", "lms"]), None),
		("branding + roles", lambda: _site_script(runner, host, "configure_branding_roles.py", brand_env),
			"BRANDING_AND_ROLES_OK"),
		("certificate rule", lambda: _site_script(runner, host, "configure_certificate.py"),
			"CERT_CONFIG_OK"),
		("curriculum", lambda: _site_script(runner, host, "create_course.py"),
			"COURSE_OK"),
		("federation admin", lambda: _site_script(runner, host, "create_fed_admin.py", brand_env),
			"FED_ADMIN_OK"),
		("smoke test", lambda: runner.run(
			["bash", os.path.join(SCRIPTS_DIR, "smoke_test.sh")],
			env={"SITE": host, "BASE": "http://127.0.0.1:8000"}), None),
	]

	for label, fn, marker in steps:
		log_parts.append(f"\n--- {label} ---")
		rc, out = fn()
		log_parts.append(out.rstrip())
		ok = rc == 0 and (marker is None or runner.dry_run or marker in out)
		if not ok:
			log_parts.append(f"\n!! step '{label}' FAILED (rc={rc}, marker={marker!r})")
			return False, "\n".join(log_parts)

	log_parts.append(f"\n=== {name} provisioned OK ===")
	return True, "\n".join(log_parts)


def process_one(runner):
	"""Fetch and provision a single job. Returns True if a job was handled."""
	job = fetch_job(runner)
	if not job:
		return False
	print(f"[worker] picked up {job['name']} -> {job['hostname']}", flush=True)
	try:
		ok, log = provision(runner, job)
	except Exception as e:  # noqa: BLE001 - any build error becomes an Error status
		ok, log = False, f"worker exception: {e}"
	status = STATUS_ACTIVE if ok else STATUS_ERROR
	report_status(runner, job["name"], status, log)
	print(f"[worker] {job['name']} -> {status}", flush=True)
	return True


def main(argv):
	dry_run = "--dry-run" in argv
	oneshot = "--oneshot" in argv or dry_run
	runner = Runner(dry_run=dry_run)

	if oneshot:
		handled = process_one(runner)
		if not handled:
			print("[worker] no pending federations", flush=True)
		return 0

	print(f"[worker] polling {CONSOLE_SITE} every {POLL_INTERVAL}s", flush=True)
	while True:
		try:
			if not process_one(runner):
				time.sleep(POLL_INTERVAL)
		except Exception as e:  # noqa: BLE001 - keep the loop alive across transient errors
			sys.stderr.write(f"[worker] poll error: {e}\n")
			time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
	sys.exit(main(sys.argv[1:]))
