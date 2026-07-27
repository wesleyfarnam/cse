# Desktop-Claude Deploy Handoff — CSE platform (branch `claude/cse-platform-build`)

A self-contained brief for continuing this deployment from **Claude Code running
on a Mac that has SSH access to the demo server** (the web session that built
this cannot reach the server). Be careful: the demo server holds **real migrated
course content** — back up before changes.

## Project

CSE = a white-label Frappe LMS platform. Repo: `wesleyfarnam/cse`.
Work branch: **`claude/cse-platform-build`** (draft PR #14), stacked on
`claude/dreamy-bardeen-rc2oji` (PR #12, the EzyCourse migration — already done).
**Hard rule (sealed-box): never edit `frappe/lms` source.** All CSE code lives in
the `cse_branding` / `cse_console` apps, site data, or deploy config.

## Server (this Mac has the SSH key)

```
ssh root@5.78.185.237      # then:
sudo -iu frappe
```
- Bench: `/home/frappe/frappe-bench`  ·  Site: `demo.combatsportseducation.com`
- The `cse_branding` app is installed at `apps/cse_branding`, but its on-server git
  repo was broken (no commits/remote); a prior deploy copied files in and gave it
  one commit. **Deploy = clone the branch to `/tmp` and `rsync` the app files in —
  NOT `git pull`.**

## Current state

- **Track 1** (design system + per-federation branding) is deployed **app-side**:
  the branding engine works.
  `curl -s https://demo.combatsportseducation.com/api/method/cse_branding.brand.brand_css`
  returns `:root{--cse-*}` tokens from the **CSE Login Branding** record.
- **Left over from testing:** `primary_color` is set to green `#1EB980` — revert to
  `#d11f2d`.
- **Not deployed yet:** Track 2 (the LMS app skin `cse-lms-skin.css` and marketing
  pages `www/home,pricing,instructors`). The server's `cse_branding` predates Track
  2 — re-deploy it.
- **Not done yet:** the `/lms` nginx injection (Track 1).
  `platform/deploy/nginx-cse-branding.snippet` must be wired into the site's nginx
  config so the `/lms` Vue SPA loads the brand stylesheet.

## Do these, in order

**1. Back up**
```bash
bench --site demo.combatsportseducation.com backup --with-files
```

**2. Revert the test color**
```bash
bench --site demo.combatsportseducation.com execute frappe.client.set_value --kwargs "{'doctype':'CSE Login Branding','name':'CSE Login Branding','fieldname':'primary_color','value':'#d11f2d'}"
bench --site demo.combatsportseducation.com clear-cache
```

**3. Re-deploy `cse_branding` (brings Track 2 — skin + marketing pages)**
```bash
cd /tmp && rm -rf cse-deploy && git clone -b claude/cse-platform-build https://github.com/wesleyfarnam/cse.git cse-deploy
rsync -a --exclude='.git' /tmp/cse-deploy/platform/apps/cse_branding/ ~/frappe-bench/apps/cse_branding/
( cd ~/frappe-bench/apps/cse_branding && git add -A && git -c user.email=deploy@cse.local -c user.name=CSE commit -q -m "cse_branding Track 2" || true )
cd ~/frappe-bench && bench build --app cse_branding && bench --site demo.combatsportseducation.com migrate && bench --site demo.combatsportseducation.com clear-cache && sudo supervisorctl restart all
```

**4. Verify the marketing pages render** (hard-refresh in a browser)
`…/home`, `…/pricing`, `…/instructors` — navy nav, red accents, card grids. This
is the clearest visible proof of the reskin.

**5. Wire the `/lms` nginx injection**
Read `platform/deploy/nginx-cse-branding.snippet` and
`platform/runbook/branding-connection-points.md`; include the `sub_filter` in the
site's bench-generated nginx conf for the `/lms` location; `nginx -t`; reload.
Confirm `/lms` still loads normally.

**6. Tune the LMS skin**
Open `…/lms` with DevTools. `cse-lms-skin.css`
(`apps/cse_branding/.../public/css/`) has rules marked `VERIFY LIVE` — inspect the
real sidebar / nav / button / card elements, correct the selectors to the actual
frappe-ui class names, then
`bench build --app cse_branding && sudo supervisorctl restart all` and iterate
until `/lms` shows the navy sidebar, brand-red primary actions, and the Plus
Jakarta Sans / Saira Condensed fonts.

## Notes

- Marketing pages + login re-theme automatically from the **CSE Login Branding**
  record — set the federation's real brand colors/fonts there.
- The `cse_console` federation-setup app and the parameterized scripts are on the
  same branch (not yet deployed) — a separate later step; confirm before deploying.
- If any step errors, stop and diagnose — the step-1 backup is the safety net.
