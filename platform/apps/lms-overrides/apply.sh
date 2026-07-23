#!/bin/bash
# Re-apply CSE frontend overrides onto a fresh frappe/lms checkout, then build.
# Run as the frappe user from anywhere.
set -e
BENCH=/home/frappe/frappe-bench
OV="$(cd "$(dirname "$0")" && pwd)"
echo "Applying CSE LMS overrides into $BENCH/apps/lms/frontend/src ..."
rsync -a "$OV/frontend-src/" "$BENCH/apps/lms/frontend/src/"
cd "$BENCH/apps/lms/frontend" && yarn build
cd "$BENCH" && bench --site "$(cat sites/currentsite.txt 2>/dev/null || echo demo.combatsportseducation.com)" clear-cache
sudo supervisorctl restart all
echo "Done. CSE overrides applied + built."
