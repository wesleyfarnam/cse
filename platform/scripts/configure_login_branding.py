"""Seed CSE Login Branding for the demo Kickboxing Federation site.

Idempotent. Uploads the demo background video as a public File, then writes
all the federation-specific values onto the Single doctype shipped by the
cse_branding app.
"""

import os

import frappe
from frappe.utils.file_manager import save_file

frappe.set_user("Administrator")

ASSETS = "/home/frappe/cse-scripts"
BG_FILENAME = "demo_login_background.mp4"


def _upload_public(local_name, attached_to="CSE Login Branding"):
    """Upload a file from the cse-scripts dir as a public File, returning its file_url."""
    existing = frappe.db.get_value(
        "File",
        {"file_name": local_name, "attached_to_doctype": attached_to, "is_private": 0},
        "file_url",
    )
    if existing:
        return existing
    path = os.path.join(ASSETS, local_name)
    if not os.path.exists(path):
        frappe.throw(f"Login background asset missing: {path}")
    with open(path, "rb") as fh:
        f = save_file(local_name, fh.read(), attached_to, attached_to, is_private=0)
    return f.file_url


bg_url = _upload_public(BG_FILENAME)

ws_logo = frappe.get_website_settings("app_logo") or ""

doc = frappe.get_single("CSE Login Branding")
doc.background_file = bg_url
doc.logo_file = ws_logo
doc.primary_color = "#d11f2d"
doc.accent_color = "#ff5a4d"
doc.dark_bg_color = "#0a1130"
doc.panel_bg_color = "#15214f"
doc.text_color = "#f4efe2"
doc.wordmark_text = "COMBAT SPORTS EDUCATION"
doc.eyebrow_text = "Member Portal"
doc.hero_headline_main = "Where champions"
doc.hero_headline_accent = "check in."
doc.hero_subhead = (
    "Combat Sports Education — train, compete, and track your journey "
    "from white belt to the podium."
)
doc.welcome_headline = "Welcome back"
doc.welcome_subhead = "Log in to the Demo Kickboxing Federation portal."
doc.footer_left = "© 2026 Demo Kickboxing Federation"
doc.footer_right_label = "Built on"
doc.footer_right_value = "Frappe"
doc.save(ignore_permissions=True)

frappe.db.commit()
print("LOGIN_BRANDING_OK")
