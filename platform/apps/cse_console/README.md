# cse_console

Operator console for the CSE platform — the **federation setup wizard**.

A federation is one isolated Frappe site (e.g. `usakb.combatsportseducation.com`)
that runs LMS + the CSE branding/role stack. Standing one up by hand means
running a fixed sequence of bench commands and verified provisioning scripts in
`platform/scripts/`. This app gives the operator a single form — the **CSE
Federation** doctype — that captures every input that sequence needs (subdomain,
branding, admin, content import, payments) and tracks the run.

## What this app is

- **`CSE Federation`** — the wizard document. One row per federation. Holds the
  desired configuration and a `provisioning_steps` child table that records the
  live status/log of each step as the federation is stood up.
- **`CSE Provisioning Step`** — child (`istable`) row: one orchestration step
  with its status, log, and timestamps.

## What this app is NOT

The actual orchestration — shelling out to `bench new-site`, running
`run_on_site.py <script>` against the new site, wiring the custom domain — lives
in a separate module (`cse_console.provisioning`) authored by another agent.
This app only defines the data model the wizard reads and writes. The controller
here (`cse_federation.py`) is intentionally a thin stub.

## Scripts this console orchestrates (for reference)

All run as: `SITE=<site> ~/frappe-bench/env/bin/python run_on_site.py <script>`

| Script | Purpose |
| --- | --- |
| `run_on_site.py` | Bootstrapper: sets `SITE`, runs a script against a site |
| `configure_branding_roles.py` | Branding + the 4 role profiles |
| `configure_certificate.py` | 1-year certificate rule |
| `create_admin_user.py` | Federation admin (`ADMIN_EMAIL` / names / role / password) |
| `import_bundle.py` | Source-neutral content/client importer |
| `smoke_test.sh` | Acceptance gate |

Site creation + domain (runbook):

```
bench new-site <fed>.combatsportseducation.com --mariadb-root-password .. --admin-password ..
bench --site <site> install-app lms
bench --site <site> install-app cse_branding
bench setup add-domain <domain> --site <site> && bench setup nginx --yes \
  && systemctl reload nginx && certbot --nginx -d <domain>
```
