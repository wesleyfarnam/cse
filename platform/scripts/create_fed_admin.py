import os

import frappe
from frappe.utils.password import update_password

# Runbook step 6: create the federation's own admin and assign the
# "Federation Admin" role profile (created by configure_branding_roles.py).
# Values come from the provisioning worker via env; defaults keep a manual
# run harmless on the Milestone 1 demo site.
FED_NAME = os.environ.get("FEDERATION_NAME", "Demo Kickboxing Federation")
EMAIL = os.environ.get("FED_ADMIN_EMAIL", "admin@demofed.test")
PASSWORD = os.environ.get("FED_ADMIN_PW", "FedAdmin_1")
FIRST = os.environ.get("FED_ADMIN_FIRST", "Federation")
LAST = os.environ.get("FED_ADMIN_LAST", "Admin")

frappe.set_user("Administrator")
# Same rationale as configure_branding_roles.py: workers/redis may be down on a
# freshly provisioned box, so run any enqueued role-profile sync inline.
frappe.flags.in_install = True

if not frappe.db.exists("User", EMAIL):
    user = frappe.get_doc({
        "doctype": "User",
        "email": EMAIL,
        "first_name": FIRST,
        "last_name": LAST,
        "send_welcome_email": 0,
        "role_profile_name": "Federation Admin",
    })
    user.insert(ignore_permissions=True)
    update_password(EMAIL, PASSWORD)
else:
    user = frappe.get_doc("User", EMAIL)
    if not frappe.db.exists("Has Role", {"parent": EMAIL, "role": "Federation Admin"}):
        user.add_roles("Federation Admin")

frappe.db.commit()
print("FED_ADMIN_OK", EMAIL, "for", FED_NAME)
