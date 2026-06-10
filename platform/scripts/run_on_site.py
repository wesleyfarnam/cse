"""Run a CSE configuration script against a Frappe site.

Usage (as the frappe user, with the bench's python):
    SITE=demo-federation.localhost \
    ~/frappe-bench/env/bin/python run_on_site.py <script.py>
"""

import os
import sys

BENCH_SITES = os.environ.get("BENCH_SITES", "/home/frappe/frappe-bench/sites")
SITE = os.environ.get("SITE", "demo-federation.localhost")

os.chdir(BENCH_SITES)
import frappe  # noqa: E402

frappe.init(site=SITE)
frappe.connect()
exec(open(sys.argv[1]).read())
