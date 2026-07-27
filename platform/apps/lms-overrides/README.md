# CSE LMS frontend overrides

frappe/lms is a **sealed upstream** app. We do not fork it. Our CSE design
implementation lives here and is applied on top with `./apply.sh`, which keeps
the footprint on upstream as small as possible so LMS upgrades stay cheap.

## Two kinds of override

1. **Net-new + restyled components (file copies).** Dropped into
   `apps/lms/frontend/src` by `apply.sh`:
   - `pages/Dashboard.vue` — Batch 1 student dashboard (net-new)
   - `pages/Progress.vue` — Batch 3 progress (net-new)
   - `pages/ProfileCertificates.vue` — Batch 3 certificate cards + empty state (restyle)
   - `pages/Courses/Courses.vue` — Batch 3 My Courses (restyle)
   - `components/CourseCard.vue` — Batch 3/6 course card (restyle)

2. **Minimal injection into upstream core files.** `patch_lms_frontend.py`
   injects ONLY the CSE deltas into the *fresh* upstream files — it does **not**
   copy them wholesale:
   - `router.js` ← the `/dashboard` and `/progress` routes
   - `utils/index.js` ← the Dashboard and Progress sidebar nav items

   The injector is idempotent and **anchor-checked**: if a future LMS version
   moves an anchor, it fails loudly (no silent corruption) so you re-check the
   anchor for that version.

Backend for Dashboard/Progress lives in `cse_branding/progress.py` (whitelisted),
so **no lms Python is touched**.

## Why this shape

Earlier this app shipped full-file copies of `router.js` (285 lines) and
`utils/index.js` (~1,080 lines) — a huge fork surface where every LMS upgrade
silently lost upstream fixes. Now the only thing we own in those files is 2
routes + 2 nav items, injected. The fork surface is the 5 component files above
plus ~4 lines-of-intent.

## Applying / upgrading

Run `./apply.sh` after any `frappe/lms` update. Full procedure (pin, apply,
smoke-test) is in `platform/runbook/lms-upgrade-procedure.md`.
