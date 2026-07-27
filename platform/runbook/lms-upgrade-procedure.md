# frappe/lms Upgrade Procedure (with CSE overrides)

The CSE platform runs a small, managed override of the LMS frontend (see
`platform/apps/lms-overrides/`). Because that touches upstream front-end files,
LMS upgrades are a **deliberate, checked step** — not an autopilot `bench update`.
Follow this so an upgrade never silently breaks the branded app.

## Principles

- **Pin the LMS version.** Upgrade on purpose (security patch or wanted feature),
  not automatically. Don't run a bare `bench update --apps lms` on a schedule.
- The override footprint is intentionally tiny: 5 component/page files + a
  **minimal injector** (`patch_lms_frontend.py`) that adds only 2 routes + 2
  sidebar items. The injector is **anchor-checked** — it fails loudly if upstream
  moved an anchor, which is exactly the signal to reconcile.

## Procedure

1. **Back up first.**
   ```bash
   bench --site demo.combatsportseducation.com backup --with-files
   ```

2. **Note the current LMS version** (to compare after):
   ```bash
   cd ~/frappe-bench/apps/lms && git describe --tags --always && cd ~/frappe-bench
   ```

3. **Update just the LMS app** to the target version:
   ```bash
   bench get-app lms --branch <target>   # or: cd apps/lms && git fetch && git checkout <tag>
   bench --site demo.combatsportseducation.com migrate
   ```
   This resets `apps/lms/frontend/src` to pristine upstream (your overrides are
   gone until re-applied — expected).

4. **Re-apply the CSE overrides:**
   ```bash
   ~/cse-scripts/... or the repo path: platform/apps/lms-overrides/apply.sh
   ```
   - If it prints `ANCHOR NOT FOUND …`, upstream reformatted `router.js` or
     `utils/index.js`. Open that file, find where the routes array opens / where
     the Courses sidebar item is, and update the matching anchor string in
     `patch_lms_frontend.py`. Re-run. (This is the only manual reconciliation the
     override can require, and only when upstream changes those exact spots.)
   - The restyled components (CourseCard/Courses/Certificates) are full copies,
     so if upstream changed those components' data/props, re-diff them against the
     new upstream version and port any needed changes into `frontend-src/`.

5. **Smoke-test the four CSE surfaces** in a browser (hard-refresh):
   - `…/lms/dashboard` — the branded dashboard renders with data
   - `…/lms/progress` — progress page renders
   - `…/lms/courses` — My Courses + the restyled course cards
   - a course → **Certificates** — cards + empty state
   Plus confirm the sidebar shows **Dashboard** and **Progress** nav items and the
   navy/red branding is intact.

6. **If anything is broken and you're blocked,** restore the backup from step 1
   and pin back to the previous LMS version; reconcile the override off-line.

## Notes

- No LMS **Python** is overridden — the Dashboard/Progress backend is in
  `cse_branding/progress.py`. Only the front-end needs re-applying.
- Doing this with a Claude Code session that has the live source is ideal: point
  it at the `ANCHOR NOT FOUND` message or the changed component and it can
  reconcile the diff quickly.
