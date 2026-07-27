# CSE — Claude Desktop Handoff (current)

Continue the CSE platform. Repo: `wesleyfarnam/cse`, branch **`claude/cse-platform-build`**
(draft PR #14). This Mac has SSH to the server.
**HARD RULE (sealed-box): never edit `frappe/lms` source. Back up before changes.**

## Read first (in the repo)
- `platform/runbook/next-steps-handoff.md` — roadmap
- `platform/runbook/desktop-claude-handoff.md` — deploy mechanics
- `platform/apps/cse_console/design/` — operator-console prototype + spec to build
- `platform/runbook/lms-upgrade-procedure.md` — how `apply.sh` / lms-overrides works

## Server
`ssh root@5.78.185.237` → `sudo -iu frappe`. Bench `/home/frappe/frappe-bench`,
site `demo.combatsportseducation.com`. **Deploy = clone the branch to `/tmp` and
`rsync` the app dirs into `~/frappe-bench/apps`** (NOT `git pull` — on-server app
repos are bare); then build + migrate + restart.

## Do, in order
1. **Back up:** `bench --site demo.combatsportseducation.com backup --with-files`
2. **Sync latest:** clone branch to `/tmp`; rsync `platform/apps/cse_branding` and
   `platform/apps/cse_console` into the bench; commit each app's local git; then
   `bench build && bench --site … migrate && bench --site … clear-cache && sudo supervisorctl restart all`.
   Re-run `platform/apps/lms-overrides/apply.sh` (reskin overrides). Confirm the test
   brand color is back to `#d11f2d` and `/lms` + `/home` look right.
3. **Console:** `bench --site … install-app cse_console`; migrate; open
   `/app/cse-federation` as Administrator (all-clients list + New). **Dry-run** a
   throwaway federation (no real Stripe/DNS) to confirm provisioning runs the 8 steps;
   report what worked/errored.
4. **Email (foundation — nothing sends without it):** `platform/scripts/configure_email.py`
   is built. Once the owner picks a provider (Postmark or Amazon SES) + adds SPF/DKIM/
   DMARC on `mail.combatsportseducation.com`, run it via `run_on_site.py` with
   `EMAIL_SENDER/SMTP_SERVER/SMTP_PORT/SMTP_LOGIN/SMTP_PASSWORD`, send a test, then do a
   real "Forgot password" end-to-end.
5. **Payments:** `platform/scripts/configure_payments.py` with the real Stripe keys; test a purchase.
6. **Build the operator dashboard:** a Frappe UI page in `cse_console` per
   `platform/apps/cse_console/design/` — list `CSE Federation` records (dashboard) + the
   Add-New-Federation wizard that creates a doc and calls
   `cse_console.provisioning.provision_federation`, streaming `provisioning_steps` live.
   Brand-pull uses `cse_console.brandpull.pull_branding` (built); the reliable branding
   path is **uploading the logo** (palette read from the image).

## Report back
After steps 2 and 3, and flag what needs the owner: **email provider + DNS access**,
and **what the Monthly/Annual memberships grant** (before payments/dunning).
