"""Configure federation branding + the 4 CSE role profiles for a site.

Runs through run_on_site.py on the bench, e.g.:

    SITE=<fed>.combatsportseducation.com \
    FEDERATION_NAME='Demo Kickboxing Federation' \
    PRIMARY_COLOR='#C41E3A' NAVY_COLOR='#131C3F' \
    FONT_APP='Plus Jakarta Sans' FONT_DISPLAY='Saira Condensed' \
    LOGO_PATH=/home/frappe/cse-scripts/brand_logo.png \
    FAVICON_PATH=/home/frappe/cse-scripts/brand_favicon.png \
    ~/frappe-bench/env/bin/python run_on_site.py configure_branding_roles.py

Config (environment variables) — every value falls back to today's demo so
that running with NO env produces the exact same output as before:
  FEDERATION_NAME  Display name used for app_name / brand_html / Website Theme.
                   Default "Demo Kickboxing Federation".
  PRIMARY_COLOR    Brand primary hex. Default "#C41E3A".
  NAVY_COLOR       Deep-navy structural hex (Track-1 --cse-navy).
                   Default "#131C3F".
  FONT_APP         App/UI font family (Track-1 --cse-font-app).
                   Default "Plus Jakarta Sans".
  FONT_DISPLAY     Display/headline font family (Track-1 --cse-font-display).
                   Default "Saira Condensed".
  LOGO_PATH        Local path to the brand logo PNG uploaded as the site logo.
                   Default "/home/frappe/cse-scripts/brand_logo.png".
  FAVICON_PATH     Local path to the favicon PNG.
                   Default "/home/frappe/cse-scripts/brand_favicon.png".
  PRIMARY_COLOR_NAME  optional. Name of the "Color" record referenced by the
                   Website Theme. Defaults to "DKF Red" for the demo federation
                   (backward compatible) and to "<FEDERATION_NAME> Primary"
                   otherwise.

Doctypes touched: Website Settings, File, Color, Website Theme, Role,
Role Profile, and (if the cse_branding app is installed) CSE Login Branding.

Idempotent: safe to re-run; existing rows are matched/updated rather than
duplicated.
"""

import os

import frappe
from frappe.utils.file_manager import save_file

frappe.set_user("Administrator")
# Role Profile on_update enqueues a sync via the redis queue; on a fresh box
# bench redis/workers aren't up yet at provisioning step 6. in_install makes
# queue_action(now=...) run inline instead.
frappe.flags.in_install = True

# ---------- 0. Resolve config from ENV (with demo fallbacks) ----------
DEMO_FEDERATION = "Demo Kickboxing Federation"

FEDERATION_NAME = os.environ.get("FEDERATION_NAME") or DEMO_FEDERATION
PRIMARY_COLOR = os.environ.get("PRIMARY_COLOR") or "#C41E3A"
NAVY_COLOR = os.environ.get("NAVY_COLOR") or "#131C3F"
FONT_APP = os.environ.get("FONT_APP") or "Plus Jakarta Sans"
FONT_DISPLAY = os.environ.get("FONT_DISPLAY") or "Saira Condensed"
LOGO_PATH = os.environ.get("LOGO_PATH") or "/home/frappe/cse-scripts/brand_logo.png"
FAVICON_PATH = os.environ.get("FAVICON_PATH") or "/home/frappe/cse-scripts/brand_favicon.png"

# The Color record referenced by the Website Theme. Keep the legacy "DKF Red"
# name for the demo federation so a no-env run is byte-for-byte compatible;
# derive a stable per-federation name otherwise.
if os.environ.get("PRIMARY_COLOR_NAME"):
    COLOR_NAME = os.environ["PRIMARY_COLOR_NAME"]
elif FEDERATION_NAME == DEMO_FEDERATION:
    COLOR_NAME = "DKF Red"
else:
    COLOR_NAME = f"{FEDERATION_NAME} Primary"

# Website Theme is named after the federation ("Demo Kickboxing Federation"
# for the demo — same as today).
THEME_NAME = FEDERATION_NAME


def _upload_public_file(local_path):
    """Upload a local image as a PUBLIC File attached to Website Settings.

    Idempotent: if a public File with the same file_name is already attached to
    Website Settings we reuse it instead of creating a duplicate row. Returns
    the file_url (or None if the local asset is missing).
    """
    if not local_path or not os.path.exists(local_path):
        return None
    file_name = os.path.basename(local_path)
    existing = frappe.db.get_value(
        "File",
        {
            "file_name": file_name,
            "attached_to_doctype": "Website Settings",
            "is_private": 0,
        },
        "file_url",
    )
    if existing:
        return existing
    with open(local_path, "rb") as fh:
        f = save_file(
            file_name, fh.read(), "Website Settings", "Website Settings", is_private=0
        )
    return f.file_url


# ---------- 1. Branding (Website Settings) ----------
logo_url = _upload_public_file(LOGO_PATH)
favicon_url = _upload_public_file(FAVICON_PATH)

ws = frappe.get_doc("Website Settings")
ws.app_name = FEDERATION_NAME
# Deliberately no banner_image: Frappe renders it full-size at the top of
# every portal page (login included); navbar/footer branding is enough.
if logo_url:
    ws.app_logo = logo_url
    ws.footer_logo = logo_url
if favicon_url:
    ws.favicon = favicon_url
ws.brand_html = FEDERATION_NAME
ws.save(ignore_permissions=True)

# Website Theme for primary brand color (website layer).
# Website Theme.primary_color is a Link to Color in Frappe v15, so the Color
# row has to exist before we can reference it.
if not frappe.db.exists("Color", COLOR_NAME):
    frappe.get_doc(
        {"doctype": "Color", "__newname": COLOR_NAME, "color": PRIMARY_COLOR}
    ).insert(ignore_permissions=True)
else:
    # Keep the swatch in sync if the brand color changed on a re-run.
    frappe.db.set_value("Color", COLOR_NAME, "color", PRIMARY_COLOR)

if not frappe.db.exists("Website Theme", THEME_NAME):
    theme = frappe.get_doc(
        {
            "doctype": "Website Theme",
            "theme": THEME_NAME,
            "primary_color": COLOR_NAME,
            "button_rounded_corners": 1,
        }
    ).insert(ignore_permissions=True)
    frappe.db.set_single_value("Website Settings", "website_theme", theme.name)
else:
    # Re-point an existing theme at the (possibly renamed) Color and make sure
    # it is the active site theme.
    frappe.db.set_value("Website Theme", THEME_NAME, "primary_color", COLOR_NAME)
    frappe.db.set_single_value("Website Settings", "website_theme", THEME_NAME)

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

# ---------- 3. Track-1 site-wide brand record (CSE Login Branding) ----------
# The cse_branding app ships a Single "CSE Login Branding" whose site-wide
# tokens (served by the whitelisted brand_css endpoint) theme every federation
# surface. Populate the subset that this provisioning step owns from the same
# ENV so Track-1 theming matches the Website-layer branding above. Guard on the
# doctype existing so this stays a no-op if cse_branding isn't installed.
if frappe.db.exists("DocType", "CSE Login Branding"):
    brand = frappe.get_single("CSE Login Branding")
    brand.primary_color = PRIMARY_COLOR
    brand.navy_color = NAVY_COLOR
    brand.font_app = FONT_APP
    brand.font_display = FONT_DISPLAY
    if logo_url:
        brand.logo_file = logo_url
    brand.save(ignore_permissions=True)

frappe.db.commit()
print("BRANDING_AND_ROLES_OK")
