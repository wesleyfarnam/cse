import frappe
from frappe.model.document import Document


class CSELoginBranding(Document):
    pass


def get_login_branding() -> dict:
    """Resolve current site's login branding values (with sensible fallbacks).

    Called from www/login.py — keep it cheap and side-effect free.
    """
    doc = frappe.get_cached_doc("CSE Login Branding", "CSE Login Branding")
    bg = (doc.background_file or "").strip()
    ext = bg.rsplit(".", 1)[-1].lower() if "." in bg else ""
    is_video = ext in {"mp4", "webm", "mov", "m4v"}

    return {
        "background_url": bg,
        "background_is_video": is_video,
        "logo_url": (doc.logo_file or "").strip() or frappe.get_website_settings("app_logo") or "",
        "primary_color": doc.primary_color or "#d11f2d",
        "accent_color": doc.accent_color or "#ff5a4d",
        "dark_bg_color": doc.dark_bg_color or "#0a1130",
        "panel_bg_color": doc.panel_bg_color or "#15214f",
        "text_color": doc.text_color or "#f4efe2",
        "eyebrow_text": doc.eyebrow_text or "Member Portal",
        "wordmark_text": doc.wordmark_text
        or (frappe.get_website_settings("app_name") or "").upper()
        or "Member Portal",
        "hero_headline_main": doc.hero_headline_main or "Welcome",
        "hero_headline_accent": doc.hero_headline_accent or "",
        "hero_subhead": doc.hero_subhead or "",
        "welcome_headline": doc.welcome_headline or "Welcome back",
        "welcome_subhead": doc.welcome_subhead
        or f"Log in to the {frappe.get_website_settings('app_name') or 'site'} portal.",
        "footer_left": doc.footer_left or "",
        "footer_right_label": doc.footer_right_label or "Built on",
        "footer_right_value": doc.footer_right_value or "Frappe",
    }
