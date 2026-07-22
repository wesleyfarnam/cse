"""Website render-context hook for CSE branding.

Injects the rendered brand `:root{--cse-* ...}` block into every web/portal
render context as `context.brand_css`, so web templates (including
server-rendered LMS certificate & sign-up pages) can inline the per-federation
tokens directly into the page `<head>` without a stylesheet round-trip.

Kept in its own module (not brand.py) to avoid clashing with the other agent's
work on brand.py. It re-uses brand.py's resolver so there is a single source of
truth for the token contract.

Wired via `update_website_context` in hooks.py.
"""

import frappe

from cse_branding.brand import render_brand_css, get_brand_tokens


def update_website_context(context):
    """Attach the resolved brand :root css (+ token dict) to the web context.

    Templates can then inline it, e.g.:
        {% if brand_css %}<style>{{ brand_css }}</style>{% endif %}

    Side-effect free and defensive: a failure here must never break page render.
    """
    try:
        context.brand_css = render_brand_css()
        context.cse_brand = get_brand_tokens()
    except Exception:
        frappe.log_error(title="cse_branding.update_website_context failed")
        context.brand_css = ""
    return context
