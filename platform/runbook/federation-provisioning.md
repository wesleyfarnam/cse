# Federation Provisioning — CSE Operator Console

How the CSE operator console stands up a **new federation** (one isolated Frappe
site) end to end. This is the Milestone-2 automation of the manual
"Per-federation onboarding checklist" from
[`milestone-1-runbook.md`](./milestone-1-runbook.md): the console drives the
exact same, already-verified scripts, in the same order, from a single Desk
action.

**Operator-only scope.** The console (the `CSE Federation` doctype + this
orchestration) is an internal tool for CSE platform operators. It is guarded to
**System Manager** and is never exposed to federation admins or end users. It
provisions and configures *other* sites; it is not part of any federation's
learner-facing surface.

**Sealed-box rule.** Nothing in the provisioning path edits `frappe`/`lms`
source. Every site-level change is applied through the platform scripts, which
only write site **data** (Server Script, Website Settings, Role Profiles,
CSE Login Branding, LMS content, users). See §10 of the build spec.

---

## Where it runs

All work happens on the **bench host**, as the OS user that owns frappe-bench
(conventionally `frappe`). The orchestration shells out to `bench` (which
refuses to run as root) and to `run_on_site.py <script>` (which needs the
bench's virtualenv python). Because a full provision takes minutes, the
whitelisted entry point only **enqueues** the job; a background worker on the
`long` queue does the actual work.

Host configuration the orchestrator reads from site config / environment (NOT
from the federation doc — these are host secrets/paths, not per-federation data):

| Key (`site config` / env)        | Purpose                                   | Default                     |
|----------------------------------|-------------------------------------------|-----------------------------|
| `cse_bench_path`                 | frappe-bench directory                    | `/home/frappe/frappe-bench` |
| `cse_scripts_dir`                | where the `platform/scripts` tooling lives| `/home/frappe/cse-scripts`  |
| `cse_mariadb_root_password`      | `bench new-site --mariadb-root-password`  | — (required for step 1)     |
| `cse_new_site_admin_password`    | `bench new-site --admin-password`         | — (required for step 1)     |
| `cse_admin_initial_password`     | first admin user's password (step 7)      | random if unset (not logged)|

---

## DNS is a manual pre-step

DNS cannot be automated from the bench host and **must be done before
provisioning**. The console surfaces this in the UI as a required checklist item:

- **Subdomain (always):** an `A` record `<subdomain>.combatsportseducation.com`
  → the platform VPS IP (skip if a wildcard record already covers it).
- **Custom domain (optional, step 8):** the federation adds a `CNAME`
  `theirdomain` → `<subdomain>.combatsportseducation.com`.

Step 8's `certbot` run will fail until DNS resolves, so confirm records have
propagated before kicking off (or before re-running for the domain step).

---

## The CSE Federation form

One `CSE Federation` document captures every input. Fields (grouped as on the
form):

| Section            | Field                     | Feeds                                              |
|--------------------|---------------------------|----------------------------------------------------|
| —                  | `federation_name`         | doc name; `FEDERATION_NAME` (branding)             |
| —                  | `subdomain`               | site name `<subdomain>.combatsportseducation.com`  |
| —                  | `custom_domain`           | step 8 (optional)                                  |
| Branding           | `primary_color`           | `PRIMARY_COLOR`                                     |
| Branding           | `navy_color`              | `NAVY_COLOR`                                        |
| Branding           | `font_app`                | `FONT_APP`                                          |
| Branding           | `font_display`            | `FONT_DISPLAY`                                      |
| Branding           | `logo`                    | `LOGO_PATH` (Attach → resolved to a local path)    |
| Admin              | `admin_email`             | `ADMIN_EMAIL` (step 7)                              |
| Admin              | `admin_first_name`        | `ADMIN_FIRST_NAME`                                  |
| Admin              | `admin_last_name`         | `ADMIN_LAST_NAME`                                   |
| Content & Clients  | `import_source`           | gates step 5 (None → skipped)                      |
| Content & Clients  | `import_bundle_path`      | `EXPORT_DIR`                                        |
| Content & Clients  | `import_progress`         | `IMPORT_PROGRESS`                                   |
| Payments           | `payment_provider`        | gates step 6 (Stripe → run)                         |
| Payments           | `stripe_publishable_key`  | `STRIPE_PUBLISHABLE_KEY`                            |
| Payments           | `stripe_secret_key`       | `STRIPE_SECRET_KEY` (Password → `get_password`)    |
| Payments           | `payment_currency`        | `PAYMENT_CURRENCY`                                  |
| Status             | `status`                  | lifecycle: Draft → Provisioning → Live / Failed    |
| Status             | `provisioning_steps`      | child table: per-step status / log / timestamps    |

---

## How provisioning runs

1. **Enqueue.** The operator clicks *Provision* on the form, which calls the
   whitelisted entry point:

   ```
   cse_console.provisioning.provision_federation(federation_name)
   ```

   It checks System Manager, flips `status` to **Provisioning**, clears any
   prior `provisioning_steps`, commits, and enqueues the worker on the `long`
   queue with a 3600s timeout. It returns immediately.

2. **Long worker.** `cse_console.provisioning._run_provisioning(federation_name)`
   loads the doc and runs the 8 steps (plus the smoke-test gate) in order. For
   each step it appends/updates a `provisioning_steps` row — **Running** with a
   start time, then **Done**/**Failed** with the finish time and captured
   stdout/stderr — and **commits between steps** so the form shows live
   progress as the operator polls.

3. **Per-step failure.** Any step that raises records its log, marks that row
   **Failed**, flips the federation `status` to **Failed**, and stops. Earlier
   successful steps are preserved. Because the scripts are idempotent (and
   step 1 skips an already-created site), fixing the cause and re-running
   resumes cleanly.

4. **Success.** When all steps including the smoke-test gate pass, `status`
   becomes **Live**.

### The 8 steps (+ gate)

Each step maps to the tooling the runbook already verified. Steps run as:
`SITE=<site> ~/frappe-bench/env/bin/python run_on_site.py <script>` (except the
`bench` and domain steps, which call `bench`/`nginx`/`certbot` directly).

1. **Create site** — `bench new-site <subdomain>.combatsportseducation.com
   --mariadb-root-password … --admin-password … --mariadb-user-host-login-scope=%`.
   Skipped if the site directory already exists (idempotency).
2. **Install apps** — `bench --site <site> install-app lms` then
   `install-app cse_branding`.
3. **Branding + roles** — `configure_branding_roles.py` with
   `FEDERATION_NAME`, `PRIMARY_COLOR`, `NAVY_COLOR`, `FONT_APP`, `FONT_DISPLAY`,
   `LOGO_PATH`. Sets Website Settings / Theme + the Track-1 CSE Login Branding
   single, and creates the CSE User / Federation Admin / Coach / Athlete role
   profiles.
4. **Certificate rule** — `configure_certificate.py` (1-year expiry Server
   Script + branded print format). No per-federation input.
5. **Content + clients** — `import_bundle.py` with `EXPORT_DIR` +
   `IMPORT_PROGRESS`. **Only when `import_source` is set** (source-neutral
   importer; skipped for `None`).
6. **Payments** — `configure_payments.py` with `STRIPE_PUBLISHABLE_KEY`,
   `STRIPE_SECRET_KEY`, `PAYMENT_CURRENCY`. **Only when
   `payment_provider = Stripe`.**
7. **Admin user** — `create_admin_user.py` with `ADMIN_EMAIL`,
   `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME`, `ROLE_PROFILE=Federation Admin`,
   `NEW_PASSWORD` (from `cse_admin_initial_password` or a random, un-logged
   secret).
8. **Custom domain** — `bench setup add-domain <domain> --site <site>` →
   `bench setup nginx --yes` → `systemctl reload nginx` → `certbot --nginx -d
   <domain>`. **Only when `custom_domain` is set.** (DNS CNAME is the manual
   pre-step above.)

**Gate: smoke test** — `smoke_test.sh` drives the real learner flow (login →
enroll → lessons → quiz → certificate) over the site's HTTP API. Always runs; if
it fails the federation is **not** marked Live.

---

## Manual fallback

If the console/worker is unavailable, provision by hand with the exact same
scripts — this is the original
[Per-federation onboarding checklist](./milestone-1-runbook.md#per-federation-onboarding-checklist-the-repeatable-part):

0. Add the DNS `A` record for `<subdomain>` (skip if wildcard exists).
1. `bench new-site <subdomain>.combatsportseducation.com --mariadb-root-password … --admin-password …`
2. `bench --site <site> install-app lms` and `install-app cse_branding`
3. `SITE=<site> FEDERATION_NAME=… PRIMARY_COLOR=… NAVY_COLOR=… FONT_APP=… FONT_DISPLAY=… LOGO_PATH=… ~/frappe-bench/env/bin/python run_on_site.py configure_branding_roles.py`
4. `SITE=<site> … run_on_site.py configure_certificate.py`
5. `SITE=<site> EXPORT_DIR=… IMPORT_PROGRESS=… … run_on_site.py import_bundle.py` (if importing)
6. `SITE=<site> STRIPE_… … run_on_site.py configure_payments.py` (if Stripe)
7. `SITE=<site> ADMIN_EMAIL=… NEW_PASSWORD=… … run_on_site.py create_admin_user.py`
8. `bench setup add-domain <domain> --site <site> && bench setup nginx --yes && systemctl reload nginx && certbot --nginx -d <domain>` (if custom domain)
9. `SITE=<site> bash smoke_test.sh` — final acceptance gate.

The console simply performs steps 0–9 as one action and records each in the
`provisioning_steps` table.

---

## Entry point

- Whitelisted: `cse_console.provisioning.provision_federation(federation_name)`
- Worker: `cse_console.provisioning._run_provisioning(federation_name)`
- Source: `platform/apps/cse_console/cse_console/provisioning.py`
