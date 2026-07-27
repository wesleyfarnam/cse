app_name = "cse_branding"
app_title = "CSE Branding"
app_publisher = "Combat Sports Education"
app_description = "Per-federation login page + branding for the CSE platform"
app_email = "platform@combatsportseducation.com"
app_license = "MIT"

# ---------------------------------------------------------------------------
# Branding wiring — get the CSE design system to EVERY surface.
#
# The resolved brand tokens + fonts + design system are served as one
# stylesheet by the whitelisted endpoint `cse_branding.brand.brand_css`
# (mounted at /api/method/cse_branding.brand.brand_css). The static design
# system + fonts also ship as bundled assets so surfaces reached by Frappe's
# include hooks get styled without an extra round-trip.
#
# Surfaces & mechanisms:
#   - Desk (the /app SPA)         -> app_include_css / app_include_js
#   - Web / portal pages          -> web_include_css / web_include_js
#     (includes LMS certificate & sign-up pages rendered server-side)
#   - Web templates that inline    -> update_website_context (context.brand_css)
#   - Boot payload (client tokens) -> boot_session (bootinfo.cse_brand)
#   - /login                       -> custom www/login.html template (self-contained)
#   - /lms Vue SPA                 -> nginx sub_filter (see platform/deploy/,
#                                     the SPA bypasses Frappe include hooks)
# ---------------------------------------------------------------------------

# Desk (/app): inject the compiled design system into the desk bundle.
app_include_css = "/assets/cse_branding/css/cse-design-system.css"

# Desk (/app): client-side brand injector (ensures the brand_css endpoint link
# + Google Fonts link exist even on surfaces the static include misses).
app_include_js = "/assets/cse_branding/js/cse-brand-inject.js"

# Web / portal pages (includes server-rendered LMS certificate & sign-up):
# ship both the design system and the fonts helper.
web_include_css = [
    "/assets/cse_branding/css/cse-design-system.css",
    "/assets/cse_branding/css/cse-fonts.css",
]

# Web / portal pages: same client-side brand injector.
web_include_js = "/assets/cse_branding/js/cse-brand-inject.js"

# Inject the rendered brand :root{...} css into the website render context as
# `context.brand_css` so web templates can inline the per-federation tokens.
# Defined in context.py (a sibling of brand.py) to avoid clashing with the
# other agent's edits to brand.py.
update_website_context = "cse_branding.context.update_website_context"

# Attach the resolved brand tokens dict to the desk boot payload as
# `bootinfo.cse_brand`, so the client injector and desk JS can read tokens
# (colors, fonts, google_fonts_url) without a fetch. Defined in brand_boot.py.
boot_session = "cse_branding.brand_boot.boot_session"
