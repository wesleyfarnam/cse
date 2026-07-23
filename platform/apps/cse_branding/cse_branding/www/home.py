"""Context for the CSE marketing home page (served at /home).

Mirrors the self-contained pattern of the login page: a full HTML document that
bypasses the default web.html chrome and pulls the design system + brand tokens
from the brand_css endpoint, so it re-themes per federation automatically.
"""

from cse_branding.brand import get_google_fonts_url


def get_context(context):
    context.no_cache = 1
    context.no_header = 1
    context.no_breadcrumbs = 1
    context.show_sidebar = False
    context.title = "Combat Sports Education"
    context.google_fonts_url = get_google_fonts_url()
    return context
