import sys, os
os.chdir("/home/frappe/frappe-bench/sites")
import frappe
frappe.init(site="demo-federation.localhost")
frappe.connect()
exec(open(sys.argv[1]).read())
