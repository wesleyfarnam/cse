# Deploying the template federation site to a VPS

Turns a fresh **Ubuntu 24.04** VPS into the always-on, branded demo site
(production setup: supervisor + nginx + HTTPS + nightly backups + firewall).

## 1. Create the VPS (one-time, manual)

- Provider: Hetzner (CPX31/CX32) or DigitalOcean — 4 vCPU / 8 GB RAM / 80 GB+ disk.
- Image: Ubuntu 24.04 LTS. Add your SSH key at creation.
- DNS: point an A record (e.g. `demo.cseplatform.com`) at the server IP
  **before** running the script so Let's Encrypt can issue the certificate.

## 2. Run the provisioning script

SSH in as root, then:

```bash
git clone https://github.com/wesleyfarnam/cse.git
cd cse/platform/deploy

SITE_DOMAIN=demo.cseplatform.com \
ADMIN_PASSWORD='<strong password>' \
DB_ROOT_PASSWORD='<strong password>' \
LETSENCRYPT_EMAIL=wesley@waypointmkt.com \
bash provision-vps.sh
```

Takes ~15–25 minutes (most of it is the Frappe/LMS build). The script is
idempotent — safe to re-run if a step fails.

Omit `LETSENCRYPT_EMAIL` to skip HTTPS (e.g. when testing against a bare IP).

## 3. Verify

```bash
SITE=demo.cseplatform.com BASE=http://127.0.0.1:8080 \
bash ../scripts/smoke_test.sh
```

Step 5 must return a certificate with `expiry_date` exactly one year after
`issue_date`. Then visit `https://demo.cseplatform.com/lms` in a browser.

## 4. After deploy

- Log in as `Administrator` and change/delete the demo coach
  (`coach@demofed.test` / `CoachDemo_1`) before sharing the site publicly.
- Backups: `bench setup backups` is configured (nightly, on-server). Ship
  copies offsite (S3/Backblaze) — see runbook §"Operational trust".
- New federation on the same server = the per-federation checklist at the end
  of `runbook/milestone-1-runbook.md` (one bench hosts many isolated sites).

## Notes

- The Ubuntu-repo `wkhtmltopdf` (unpatched Qt) renders the certificate fine
  with the CSE print format. If PDF layout issues appear later, install the
  patched build from wkhtmltopdf's GitHub releases.
- Sealed-box rule holds: the script never edits frappe/lms source; all CSE
  config is site data applied by `../scripts`.
