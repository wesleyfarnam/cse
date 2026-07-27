"""Configure outbound email for a CSE site (as site data).

Runs through run_on_site.py on the bench, e.g.:

    SITE=<fed>.combatsportseducation.com \
    EMAIL_SENDER='no-reply@mail.combatsportseducation.com' \
    SMTP_SERVER='smtp.postmarkapp.com' SMTP_PORT='587' \
    SMTP_LOGIN='<token>' SMTP_PASSWORD='<token>' SMTP_TLS='1' \
    ~/frappe-bench/env/bin/python run_on_site.py configure_email.py

Without outbound email, NOTHING automated sends — password resets (which the
migrated students need at cutover), receipts, certificate emails, and lifecycle
nudges all depend on this. It's the platform's #1 foundation.

Config (environment variables):
  EMAIL_SENDER    Required. The From address (e.g. no-reply@mail.<domain>).
  SMTP_SERVER     Required. Provider SMTP host (e.g. smtp.postmarkapp.com,
                  email-smtp.<region>.amazonaws.com, smtp.sendgrid.net).
  SMTP_PORT       SMTP port. Default 587 (STARTTLS).
  SMTP_LOGIN      SMTP username / API-key id. Defaults to EMAIL_SENDER.
  SMTP_PASSWORD   Required. SMTP password / API key.
  SMTP_TLS        '1' (default) STARTTLS, or SMTP_SSL='1' for implicit SSL.
  EMAIL_ACCOUNT_NAME  Display name for the Email Account. Default 'CSE Outgoing'.

DNS (do once per sending domain, BEFORE go-live): add SPF, DKIM, and DMARC
records for mail.<domain> from the provider's console — this is what keeps mail
out of spam. Provider gives the exact values.

Idempotent: matches the Email Account by email_id and updates in place. Missing
required vars => prints a clear skip message and exits 0 (so the cse_console
wizard can surface a friendly 'email not configured' state).

Verify: Desk -> Email Account -> "Send Test Email"; watch the Email Queue; then
do a real 'Forgot password' on a test user end-to-end.
"""

import os

import frappe

frappe.set_user("Administrator")

sender = (os.environ.get("EMAIL_SENDER") or "").strip()
smtp_server = (os.environ.get("SMTP_SERVER") or "").strip()
password = os.environ.get("SMTP_PASSWORD") or ""

if not (sender and smtp_server and password):
    print(
        "EMAIL_SKIP: set EMAIL_SENDER, SMTP_SERVER, and SMTP_PASSWORD to configure "
        "outbound email. Skipping (nothing changed)."
    )
    raise SystemExit(0)

login = (os.environ.get("SMTP_LOGIN") or sender).strip()
port = int(os.environ.get("SMTP_PORT") or 587)
use_ssl = os.environ.get("SMTP_SSL", "0") == "1"
use_tls = (os.environ.get("SMTP_TLS", "1") == "1") and not use_ssl
account_name = os.environ.get("EMAIL_ACCOUNT_NAME") or "CSE Outgoing"

# ---- Email Account (outgoing, default) ----
existing = frappe.db.get_value("Email Account", {"email_id": sender})
doc = frappe.get_doc("Email Account", existing) if existing else frappe.new_doc("Email Account")

doc.email_account_name = account_name
doc.email_id = sender
doc.enable_outgoing = 1
doc.default_outgoing = 1
doc.smtp_server = smtp_server
doc.smtp_port = port
doc.use_tls = 1 if use_tls else 0
if hasattr(doc, "use_ssl_for_outgoing"):
    doc.use_ssl_for_outgoing = 1 if use_ssl else 0
doc.login_id_is_different = 1 if login != sender else 0
if login != sender:
    doc.login_id = login
doc.password = password
# Send from this account's address so DKIM/SPF align with the sending domain.
if hasattr(doc, "always_use_account_email_id_as_sender"):
    doc.always_use_account_email_id_as_sender = 1
doc.enable_incoming = 0

doc.save(ignore_permissions=True)

# ---- Site defaults: sender + auto-email id ----
frappe.db.set_single_value("System Settings", "auto_email_id", sender)
# common_site_config-independent notification sender
try:
    frappe.db.set_single_value("Notification Settings", "email", sender)
except Exception:
    pass

frappe.db.commit()
print("EMAIL_OK", sender, "via", smtp_server, "port", port, "tls" if use_tls else ("ssl" if use_ssl else "plain"))
