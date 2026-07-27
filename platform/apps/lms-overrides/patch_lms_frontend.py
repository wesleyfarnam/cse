#!/usr/bin/env python3
"""Minimal, idempotent injector for the CSE LMS frontend overrides.

Instead of overwriting frappe/lms's router.js and utils/index.js wholesale
(which forks ~1,400 lines of upstream and makes every LMS upgrade painful),
this injects ONLY the CSE deltas into the fresh upstream files:

  - router.js:      + /dashboard and /progress routes
  - utils/index.js: + Dashboard and Progress sidebar nav items

Idempotent (safe to re-run) and anchor-checked: if an expected upstream anchor
is missing (a future LMS version restructured the file), it FAILS LOUDLY rather
than silently corrupting — your signal to re-check the anchor for that version
(see platform/runbook/lms-upgrade-procedure.md).

Usage (run by apply.sh, or standalone):
    python3 patch_lms_frontend.py /home/frappe/frappe-bench/apps/lms/frontend/src
"""

import sys
import pathlib

# Two routes, inserted right after the routes array opens (indent = 1 tab).
ROUTES = """\t{
\t\tpath: '/dashboard',
\t\tname: 'Dashboard',
\t\tcomponent: () => import('@/pages/Dashboard.vue'),
\t},
\t{
\t\tpath: '/progress',
\t\tname: 'Progress',
\t\tcomponent: () => import('@/pages/Progress.vue'),
\t},
"""

# Two sidebar items, inserted immediately BEFORE the stock Courses nav item
# (item brace = 4 tabs, contents = 5 tabs).
NAV_ITEMS = """\t\t\t\t{
\t\t\t\t\tlabel: 'Dashboard',
\t\t\t\t\ticon: 'LayoutDashboard',
\t\t\t\t\tto: 'Dashboard',
\t\t\t\t\tactiveFor: ['Dashboard'],
\t\t\t\t\tcondition: () => {
\t\t\t\t\t\treturn userResource?.data
\t\t\t\t\t},
\t\t\t\t},
\t\t\t\t{
\t\t\t\t\tlabel: 'Progress',
\t\t\t\t\ticon: 'TrendingUp',
\t\t\t\t\tto: 'Progress',
\t\t\t\t\tactiveFor: ['Progress'],
\t\t\t\t\tcondition: () => {
\t\t\t\t\t\treturn userResource?.data
\t\t\t\t\t},
\t\t\t\t},
"""

# The stock Courses nav item opening — our insert-before anchor.
COURSES_ITEM_ANCHOR = "\t\t\t\t{\n\t\t\t\t\tlabel: 'Courses',\n\t\t\t\t\ticon: 'BookOpen',"


def insert_after(path, anchor, snippet, present_marker, label):
    src = path.read_text(encoding="utf-8")
    if present_marker in src:
        print(f"  = {label}: already present, skipping")
        return
    i = src.find(anchor)
    if i == -1:
        _fail(path, anchor)
    at = i + len(anchor)
    path.write_text(src[:at] + "\n" + snippet + src[at:], encoding="utf-8")
    print(f"  + {label}: injected")


def insert_before(path, anchor, snippet, present_marker, label):
    src = path.read_text(encoding="utf-8")
    if present_marker in src:
        print(f"  = {label}: already present, skipping")
        return
    i = src.find(anchor)
    if i == -1:
        _fail(path, anchor)
    path.write_text(src[:i] + snippet + src[i:], encoding="utf-8")
    print(f"  + {label}: injected")


def _fail(path, anchor):
    raise SystemExit(
        f"ANCHOR NOT FOUND in {path.name}:\n  {anchor!r}\n"
        f"  -> upstream LMS likely changed this file. Re-check/adjust the anchor "
        f"for the installed LMS version (see lms-upgrade-procedure.md), then re-run."
    )


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: patch_lms_frontend.py <lms/frontend/src dir>")
    src_dir = pathlib.Path(sys.argv[1])
    router = src_dir / "router.js"
    utils = src_dir / "utils" / "index.js"
    for p in (router, utils):
        if not p.exists():
            raise SystemExit(f"expected upstream file not found: {p}")

    insert_after(
        router,
        anchor="const routes = [",
        snippet=ROUTES,
        present_marker="name: 'Dashboard'",
        label="router /dashboard + /progress",
    )
    insert_before(
        utils,
        anchor=COURSES_ITEM_ANCHOR,
        snippet=NAV_ITEMS,
        present_marker="to: 'Dashboard'",
        label="sidebar Dashboard + Progress",
    )
    print("CSE frontend patch complete.")


if __name__ == "__main__":
    main()
