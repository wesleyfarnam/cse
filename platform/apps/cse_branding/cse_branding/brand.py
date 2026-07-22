"""Site-wide brand token generator + whitelisted stylesheet endpoint.

The CSE design system separates a small, per-federation-themeable BRAND layer
(a handful of colors + two font families) from the constant STRUCTURAL layer
(neutrals, radius, shadow, semantic colors) that ships as static CSS.

`brand_css()` is the single connection point: one <link> to this endpoint
delivers the resolved brand tokens (:root overrides), the fonts helper, and the
full design system as one stylesheet. Editing the "CSE Login Branding" single
doc re-themes every surface that includes it.

Endpoint module path: cse_branding.brand.brand_css
"""

import frappe

# Contract defaults — these mirror the :root defaults in the design system and
# the doctype field defaults, so tokens resolve sensibly even before the single
# doc has been saved.
DEFAULTS = {
    "primary": "#DB2B3A",
    "primary_hover": "#C01F2F",
    "primary_dark": "#F04752",
    "navy": "#131C3F",
    "link": "#2F54D0",
    "font_app": "Plus Jakarta Sans",
    "font_display": "Saira Condensed",
    "google_fonts_url": (
        "https://fonts.googleapis.com/css2?"
        "family=Plus+Jakarta+Sans:wght@400;500;600;700;800"
        "&family=Saira+Condensed:wght@600;700&display=swap"
    ),
}


def get_brand_tokens() -> dict:
    """Resolve the site-wide brand tokens from the CSE Login Branding single doc.

    Each value falls back to the design-token contract default when the field is
    empty or the doc is unavailable. Cheap and side-effect free.
    """
    try:
        doc = frappe.get_cached_doc("CSE Login Branding", "CSE Login Branding")
    except Exception:
        doc = None

    def field(name):
        if not doc:
            return None
        val = getattr(doc, name, None)
        if val is None:
            return None
        val = val.strip() if isinstance(val, str) else val
        return val or None

    return {
        "primary": field("primary_color") or DEFAULTS["primary"],
        "primary_hover": field("primary_hover_color") or DEFAULTS["primary_hover"],
        "primary_dark": field("primary_dark_color") or DEFAULTS["primary_dark"],
        "navy": field("navy_color") or DEFAULTS["navy"],
        "link": field("link_color") or DEFAULTS["link"],
        "font_app": field("font_app") or DEFAULTS["font_app"],
        "font_display": field("font_display") or DEFAULTS["font_display"],
        "google_fonts_url": field("google_fonts_url") or DEFAULTS["google_fonts_url"],
    }


def render_brand_css() -> str:
    """Build the :root{...} block overriding the BRAND-layer design tokens.

    Uses the exact contract custom-property names. Font families are quoted so
    multi-word names resolve as a single family value.
    """
    t = get_brand_tokens()
    return (
        ":root{"
        f"--cse-primary:{t['primary']};"
        f"--cse-primary-hover:{t['primary_hover']};"
        f"--cse-primary-dark:{t['primary_dark']};"
        f"--cse-navy:{t['navy']};"
        f"--cse-link:{t['link']};"
        f"--cse-font-app:'{t['font_app']}';"
        f"--cse-font-display:'{t['font_display']}';"
        "}"
    )


def get_google_fonts_url() -> str:
    """Return the configured Google Fonts stylesheet URL for the app + display fonts."""
    return get_brand_tokens()["google_fonts_url"]


def _read_css(*parts) -> str:
    """Read a bundled stylesheet from the app's public/css directory."""
    try:
        path = frappe.get_app_path("cse_branding", *parts)
        with open(path, "r", encoding="utf-8") as fh:
            return fh.read()
    except Exception:
        return ""


@frappe.whitelist(allow_guest=True)
def brand_css():
    """Serve resolved brand tokens + fonts helper + full design system as one CSS file.

    One <link> to `/api/method/cse_branding.brand.brand_css` re-themes any surface.
    """
    css = "\n".join(
        [
            render_brand_css(),
            _read_css("public", "css", "cse-fonts.css"),
            _read_css("public", "css", "cse-design-system.css"),
        ]
    )

    frappe.response["type"] = "binary"
    frappe.response["filename"] = "brand.css"
    frappe.response["filecontent"] = css.encode("utf-8")
    frappe.response["content_type"] = "text/css; charset=utf-8"
    return
