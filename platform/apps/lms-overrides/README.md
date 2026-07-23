# CSE LMS frontend overrides (Path C)

frappe/lms is a **sealed upstream** app (do not edit its repo). These files are
our CSE design-system implementation on top of it. After any `lms` update,
re-apply them with `./apply.sh` (copies into apps/lms/frontend/src + rebuilds).

Files (Batch 1/2/3/6 of the claude.ai/design CSE system):
- components/CourseCard.vue   — Batch 3/6 course card (pill, progress, Resume)
- pages/Dashboard.vue (+ /dashboard route, nav item) — Batch 1 student dashboard
- pages/Progress.vue (+ /progress route, nav item)   — Batch 3 progress
- pages/ProfileCertificates.vue — Batch 3 certificate cards + empty state
- pages/Courses/Courses.vue   — Batch 3 My Courses page header
- router.js / utils/index.js  — routes + sidebar nav (Dashboard, Progress)

Backend for Dashboard/Progress lives in cse_branding/progress.py (whitelisted),
so no lms Python is touched. `lms-frontend.patch` = git diff of the tracked
files at capture time (reference; apply.sh uses full-file copies instead).
