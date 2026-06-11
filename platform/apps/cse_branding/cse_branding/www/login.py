"""Custom /login that overrides Frappe's framework template.

Bypasses templates/web.html so the page is fully self-contained and we don't
inherit the desk chrome. Keeps Frappe's redirect-if-already-logged-in behaviour
and re-uses the framework's `sanitize_redirect` helper.
"""

import frappe
from frappe.utils import cint
from frappe.www.login import sanitize_redirect

from cse_branding.cse_branding.doctype.cse_login_branding.cse_login_branding import (
    get_login_branding,
)

no_cache = True


def get_context(context):
    redirect_to = sanitize_redirect(frappe.local.request.args.get("redirect-to"))

    if frappe.session.user != "Guest":
        from frappe.apps import get_default_path
        from frappe.website.utils import get_home_page

        if not redirect_to:
            if frappe.session.data.user_type == "Website User":
                redirect_to = get_default_path() or get_home_page()
            else:
                redirect_to = get_default_path() or "/app"

        if redirect_to != "login":
            frappe.local.flags.redirect_location = redirect_to
            raise frappe.Redirect

    context.no_cache = 1
    context.no_header = True
    context.no_breadcrumbs = True
    context.show_sidebar = False
    context.title = "Login"

    branding = get_login_branding()
    context.update(branding)

    context.redirect_to = redirect_to or ""
    context.disable_user_pass_login = cint(
        frappe.get_system_settings("disable_user_pass_login")
    )
    context.login_with_email_link = cint(
        frappe.get_system_settings("login_with_email_link")
    )
    context.app_name = (
        frappe.get_website_settings("app_name")
        or frappe.get_system_settings("app_name")
        or "Frappe"
    )

    return context
