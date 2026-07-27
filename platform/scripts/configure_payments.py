"""Configure the payment gateway for a federation site (as site data).

Runs through run_on_site.py on the bench, e.g.:

    SITE=<fed>.combatsportseducation.com \
    PAYMENT_PROVIDER='stripe' \
    STRIPE_PUBLISHABLE_KEY='pk_live_...' \
    STRIPE_SECRET_KEY='sk_live_...' \
    PAYMENT_CURRENCY='USD' \
    ~/frappe-bench/env/bin/python run_on_site.py configure_payments.py

Config (environment variables):
  PAYMENT_PROVIDER         Gateway provider. Default "stripe". Only "stripe" is
                           implemented today; any other value prints a clear
                           skip message and exits cleanly.
  STRIPE_PUBLISHABLE_KEY   Stripe publishable key (pk_...). Required for stripe.
  STRIPE_SECRET_KEY        Stripe secret key (sk_...). Required for stripe.
  PAYMENT_CURRENCY         ISO currency code for course pricing. Default "USD".

Doctypes touched (all provided by the frappe/payments app, plus LMS):
  - Stripe Settings          (Single-ish gateway config; keyed by gateway_name)
  - Payment Gateway          (registry row "Stripe-<gateway_name>")
  - Payment Gateway Account  (only if the doctype exists on this site)
  - LMS Settings             (payment fields, guarded by field presence)

Idempotent: existing rows are matched and updated in place rather than
duplicated. Missing keys never crash — the script prints a skip message and
exits 0 so the console can surface a friendly "payments not configured" state.
"""

import os

import frappe

frappe.set_user("Administrator")

# ---------- 0. Resolve config from ENV ----------
PROVIDER = (os.environ.get("PAYMENT_PROVIDER") or "stripe").strip().lower()
CURRENCY = (os.environ.get("PAYMENT_CURRENCY") or "USD").strip().upper()

# The payments app keys a gateway by its gateway_name and registers the
# corresponding Payment Gateway as "Stripe-<gateway_name>". We use a single
# stable gateway per site.
GATEWAY_NAME = "Default"
PAYMENT_GATEWAY = f"Stripe-{GATEWAY_NAME}"


def _skip(msg):
    """Print a clear skip line and exit 0 (never crash the console step)."""
    print(f"PAYMENTS_SKIPPED {msg}")
    raise SystemExit(0)


# ---------- 1. Provider guard ----------
if PROVIDER != "stripe":
    _skip(f"unsupported PAYMENT_PROVIDER={PROVIDER!r} (only 'stripe' implemented)")

publishable_key = (os.environ.get("STRIPE_PUBLISHABLE_KEY") or "").strip()
secret_key = (os.environ.get("STRIPE_SECRET_KEY") or "").strip()
if not publishable_key or not secret_key:
    _skip("missing STRIPE_PUBLISHABLE_KEY and/or STRIPE_SECRET_KEY")

# The payments app must be installed for the gateway doctypes to exist.
if not frappe.db.exists("DocType", "Stripe Settings"):
    _skip("'Stripe Settings' doctype not found — is the payments app installed?")

# ---------- 2. Upsert Stripe Settings ----------
# Stripe Settings.on_update auto-creates/updates the matching "Payment Gateway"
# registry row (named "Stripe-<gateway_name>") via create_payment_gateway().
if frappe.db.exists("Stripe Settings", GATEWAY_NAME):
    stripe = frappe.get_doc("Stripe Settings", GATEWAY_NAME)
else:
    stripe = frappe.get_doc({"doctype": "Stripe Settings", "gateway_name": GATEWAY_NAME})

stripe.publishable_key = publishable_key
# secret_key is a Password field; assigning the plaintext lets Frappe encrypt
# it at rest on save.
stripe.secret_key = secret_key
# Some payments builds expose a currency on the gateway settings; set it when
# present so the gateway and LMS agree.
if stripe.meta.has_field("currency"):
    stripe.currency = CURRENCY
stripe.save(ignore_permissions=True)

# ---------- 3. Ensure the Payment Gateway registry row exists ----------
# on_update normally creates this, but assert it defensively so downstream
# links (LMS Settings, Payment Gateway Account) always resolve.
if not frappe.db.exists("Payment Gateway", PAYMENT_GATEWAY):
    frappe.get_doc(
        {
            "doctype": "Payment Gateway",
            "gateway": PAYMENT_GATEWAY,
            "gateway_settings": "Stripe Settings",
            "gateway_controller": GATEWAY_NAME,
        }
    ).insert(ignore_permissions=True)

# ---------- 4. Payment Gateway Account (only if the doctype is present) ----------
# Payment Gateway Account ships with ERPNext/payments in some stacks and binds a
# gateway to a currency + default flag. On an LMS-only site it may be absent, so
# guard on the doctype and upsert one keyed by (gateway, currency).
if frappe.db.exists("DocType", "Payment Gateway Account"):
    existing_pga = frappe.db.get_value(
        "Payment Gateway Account",
        {"payment_gateway": PAYMENT_GATEWAY, "currency": CURRENCY},
        "name",
    )
    if existing_pga:
        pga = frappe.get_doc("Payment Gateway Account", existing_pga)
        pga.is_default = 1
        pga.save(ignore_permissions=True)
    else:
        pga = frappe.get_doc({"doctype": "Payment Gateway Account"})
        pga.payment_gateway = PAYMENT_GATEWAY
        if pga.meta.has_field("currency"):
            pga.currency = CURRENCY
        if pga.meta.has_field("is_default"):
            pga.is_default = 1
        pga.insert(ignore_permissions=True)

# ---------- 5. LMS Settings payment fields (enable paid courses) ----------
# LMS Settings is a Single. Field names vary across LMS versions, so set each
# known payment field only when it exists on this site's schema.
if frappe.db.exists("DocType", "LMS Settings"):
    lms_settings = frappe.get_single("LMS Settings")
    lms_meta = lms_settings.meta
    touched = []

    # Select the active gateway for course purchases.
    if lms_meta.has_field("payment_gateway"):
        lms_settings.payment_gateway = PAYMENT_GATEWAY
        touched.append("payment_gateway")

    # Currency used for course pricing / checkout.
    for currency_field in ("currency", "default_currency"):
        if lms_meta.has_field(currency_field):
            lms_settings.set(currency_field, CURRENCY)
            touched.append(currency_field)
            break

    # Optional master switch some LMS builds expose to turn on paid courses.
    for enable_field in ("enable_payments", "paid_courses", "enable_paid_courses"):
        if lms_meta.has_field(enable_field):
            lms_settings.set(enable_field, 1)
            touched.append(enable_field)
            break

    if touched:
        lms_settings.save(ignore_permissions=True)

frappe.db.commit()
print(f"PAYMENTS_OK provider=stripe gateway={PAYMENT_GATEWAY} currency={CURRENCY}")
