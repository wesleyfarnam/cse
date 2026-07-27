"""Context for the CSE pricing page (served at /pricing)."""

from cse_branding.brand import get_google_fonts_url


def get_context(context):
    context.no_cache = 1
    context.no_header = 1
    context.no_breadcrumbs = 1
    context.show_sidebar = False
    context.title = "Pricing — Combat Sports Education"
    context.google_fonts_url = get_google_fonts_url()
    return context
