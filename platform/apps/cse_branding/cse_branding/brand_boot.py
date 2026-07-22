"""Desk boot-session hook for CSE branding.

Attaches the resolved per-federation brand tokens to the desk boot payload as
`bootinfo.cse_brand`. The client-side injector (cse-brand-inject.js) and any
desk JS can then read colors / fonts / the Google Fonts URL straight from
`frappe.boot.cse_brand` with no extra fetch.

Kept in its own module (not brand.py) to avoid clashing with the other agent's
work on brand.py. It re-uses brand.py's resolver so there is a single source of
truth for the token contract.

Wired via `boot_session` in hooks.py.
"""

import frappe

from cse_branding.brand import get_brand_tokens


def boot_session(bootinfo):
    """Add the brand tokens dict to bootinfo as `cse_brand`.

    Defensive: a failure here must never break desk boot.
    """
    try:
        bootinfo.cse_brand = get_brand_tokens()
    except Exception:
        frappe.log_error(title="cse_branding.boot_session failed")
    return bootinfo
