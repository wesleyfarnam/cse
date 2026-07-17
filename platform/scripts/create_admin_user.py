"""Create (or update) a CSE admin user and assign a Role Profile.

Runs through run_on_site.py on the server, e.g.:

    cd /home/frappe/cse-scripts   # wherever this repo's scripts live on the box
    SITE=demo.combatsportseducation.com \
    ADMIN_EMAIL='coach@example.com' \
    ADMIN_FIRST_NAME='Jane' ADMIN_LAST_NAME='Doe' \
    NEW_PASSWORD='choose-a-strong-one' \
    ~/frappe-bench/env/bin/python run_on_site.py create_admin_user.py

Config (environment variables):
  ADMIN_EMAIL       required. Login email for the new/updated user.
  ADMIN_FIRST_NAME  optional. Defaults to the part before '@'.
  ADMIN_LAST_NAME   optional.
  ROLE_PROFILE      optional. Defaults to "Federation Admin" (create + edit all
                    courses via the LMS UI, no full backend/System Manager).
                    Other options set up on this site: "Coach", "CSE User".
  NEW_PASSWORD      optional. If set, the password is set directly so they can
                    log in immediately. If omitted, set SEND_WELCOME_EMAIL=1 to
                    have Frappe email them a "set your password" link instead.
  SEND_WELCOME_EMAIL  optional, "1" to send the welcome/password-setup email.
"""

import os

import frappe

frappe.set_user("Administrator")
# Role Profile role-sync is enqueued on the redis queue; in_install makes it
# run inline so roles are applied even if workers aren't processing.
frappe.flags.in_install = True

email = (os.environ.get("ADMIN_EMAIL") or "").strip().lower()
if not email:
    raise SystemExit("Set ADMIN_EMAIL (e.g. ADMIN_EMAIL='coach@example.com')")

first_name = os.environ.get("ADMIN_FIRST_NAME") or email.split("@")[0]
last_name = os.environ.get("ADMIN_LAST_NAME") or ""
role_profile = os.environ.get("ROLE_PROFILE", "Federation Admin")
new_password = os.environ.get("NEW_PASSWORD")
send_welcome = os.environ.get("SEND_WELCOME_EMAIL", "0") == "1"

if not frappe.db.exists("Role Profile", role_profile):
    available = [r.name for r in frappe.get_all("Role Profile")]
    raise SystemExit(f"Role Profile {role_profile!r} not found. Available: {available}")

created = not frappe.db.exists("User", email)
if created:
    user = frappe.get_doc({
        "doctype": "User",
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "user_type": "System User",
        "enabled": 1,
        "send_welcome_email": 1 if send_welcome else 0,
    }).insert(ignore_permissions=True)
else:
    user = frappe.get_doc("User", email)
    user.enabled = 1

# Assign the Role Profile. Frappe v15 uses a `role_profiles` child table;
# older versions use a single `role_profile_name` link. Support both.
meta = frappe.get_meta("User")
if meta.has_field("role_profiles"):
    if not any(rp.role_profile == role_profile for rp in user.role_profiles):
        user.append("role_profiles", {"role_profile": role_profile})
elif meta.has_field("role_profile_name"):
    user.role_profile_name = role_profile

if new_password:
    user.new_password = new_password

user.save(ignore_permissions=True)
frappe.db.commit()

roles = sorted(r.role for r in frappe.get_doc("User", email).roles)
print("ADMIN_USER_OK", "created" if created else "updated", email,
      "| profile:", role_profile, "| roles:", roles)
