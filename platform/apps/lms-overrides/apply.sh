#!/bin/bash
# Re-apply CSE LMS frontend overrides onto a fresh frappe/lms checkout, then build.
# Run as the frappe user, from anywhere. Idempotent.
#
# Strategy (see README): frappe/lms stays sealed. We only:
#   1. add NET-NEW pages (Dashboard, Progress) and drop-in REPLACEMENT components
#      (redesigned CourseCard / Courses / Certificates) as file copies, and
#   2. INJECT two routes + two sidebar items into upstream router.js / utils via
#      patch_lms_frontend.py — NOT wholesale-copy those core files.
# This keeps the fork surface tiny, so LMS upgrades stay cheap.
set -e
BENCH="${BENCH:-/home/frappe/frappe-bench}"
SITE="${SITE:-$(cat "$BENCH/sites/currentsite.txt" 2>/dev/null || echo demo.combatsportseducation.com)}"
OV="$(cd "$(dirname "$0")" && pwd)"
SRC="$BENCH/apps/lms/frontend/src"

echo "==> Copying net-new + replacement components into $SRC"
# Only the files we intentionally add or restyle — NOT router.js / utils/index.js.
rsync -a "$OV/frontend-src/components/" "$SRC/components/"
rsync -a "$OV/frontend-src/pages/"      "$SRC/pages/"

echo "==> Injecting CSE routes + sidebar items into upstream router.js / utils/index.js"
python3 "$OV/patch_lms_frontend.py" "$SRC"

echo "==> Building LMS frontend"
cd "$BENCH/apps/lms/frontend" && yarn build

echo "==> Clearing cache + restarting"
cd "$BENCH" && bench --site "$SITE" clear-cache
sudo supervisorctl restart all
echo "Done. CSE overrides applied (minimal-injection) + built."
