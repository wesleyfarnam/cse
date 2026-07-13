import os

import frappe
from frappe.utils.file_manager import save_file

# Per-federation branding is supplied by the provisioning worker through env
# vars; the defaults reproduce the Milestone 1 demo site exactly so running
# this script by hand (no env) is unchanged.
FED_NAME = os.environ.get("FEDERATION_NAME", "Demo Kickboxing Federation")
BRAND_COLOR = os.environ.get("BRAND_COLOR", "#C41E3A")
COLOR_NAME = os.environ.get("BRAND_COLOR_NAME", "DKF Red")
LOGO_PATH = os.environ.get("BRAND_LOGO", "/home/frappe/cse-scripts/brand_logo.png")
# The worker passes the federation's logo here; the default reproduces the
# Milestone 1 demo favicon for a bare manual run.
FAVICON_PATH = os.environ.get("BRAND_FAVICON", "/home/frappe/cse-scripts/brand_favicon.png")

frappe.set_user("Administrator")
# Role Profile on_update enqueues a sync via the redis queue; on a fresh box
# bench redis/workers aren't up yet at provisioning step 6. in_install makes
# queue_action(now=...) run inline instead.
frappe.flags.in_install = True

# ---------- 1. Branding (Website Settings) ----------
logo = save_file("brand_logo.png", open(LOGO_PATH, "rb").read(),
                 "Website Settings", "Website Settings", is_private=0)
favicon = save_file("brand_favicon.png", open(FAVICON_PATH, "rb").read(),
                    "Website Settings", "Website Settings", is_private=0)

ws = frappe.get_doc("Website Settings")
ws.app_name = FED_NAME
# Deliberately no banner_image: Frappe renders it full-size at the top of
# every portal page (login included); navbar/footer branding is enough.
ws.app_logo = logo.file_url
ws.footer_logo = logo.file_url
ws.favicon = favicon.file_url
ws.brand_html = FED_NAME
ws.save(ignore_permissions=True)

# Website Theme for primary brand color (website layer).
# Website Theme.primary_color is a Link to Color in Frappe v15, so the Color
# row has to exist before we can reference it.
if not frappe.db.exists("Color", COLOR_NAME):
    frappe.get_doc({"doctype": "Color", "__newname": COLOR_NAME, "color": BRAND_COLOR}).insert(ignore_permissions=True)
if not frappe.db.exists("Website Theme", FED_NAME):
    theme = frappe.get_doc({
        "doctype": "Website Theme",
        "theme": FED_NAME,
        "primary_color": COLOR_NAME,
        "button_rounded_corners": 1,
    }).insert(ignore_permissions=True)
    frappe.db.set_single_value("Website Settings", "website_theme", theme.name)

# ---------- 2. CSE Role model ----------
# Custom marker roles (desk_access=0 -> usable by website users)
for role, desk in [("CSE User", 1), ("Federation Admin", 0), ("Coach", 0), ("Athlete", 0)]:
    if not frappe.db.exists("Role", role):
        frappe.get_doc({"doctype": "Role", "role_name": role, "desk_access": desk}).insert(ignore_permissions=True)

# Role Profiles bundle CSE roles with the LMS capability roles
profiles = {
    "CSE User": ["CSE User", "System Manager", "Moderator", "Course Creator", "Batch Evaluator", "LMS Student"],
    "Federation Admin": ["Federation Admin", "Moderator", "Course Creator", "Batch Evaluator", "LMS Student"],
    "Coach": ["Coach", "Course Creator", "LMS Student"],
    "Athlete": ["Athlete", "LMS Student"],
}
for pname, roles in profiles.items():
    if not frappe.db.exists("Role Profile", pname):
        rp = frappe.get_doc({"doctype": "Role Profile", "role_profile": pname})
        for r in roles:
            rp.append("roles", {"role": r})
        rp.insert(ignore_permissions=True)

frappe.db.commit()
print("BRANDING_AND_ROLES_OK")
