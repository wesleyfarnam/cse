import frappe, json

frappe.set_user("Administrator")

# ---------- 1. Server Script: 1-year expiry on issue (Ring Corner rule) ----------
SCRIPT_NAME = "CSE Certificate Expiry - 1 Year"
if not frappe.db.exists("Server Script", SCRIPT_NAME):
    frappe.get_doc({
        "doctype": "Server Script",
        "name": SCRIPT_NAME,
        "script_type": "DocType Event",
        "reference_doctype": "LMS Certificate",
        "doctype_event": "Before Insert",
        "disabled": 0,
        "script": (
            "# CSE rule: every certificate expires one year from issue\n"
            "if not doc.expiry_date:\n"
            "    doc.expiry_date = frappe.utils.add_years(doc.issue_date or frappe.utils.nowdate(), 1)\n"
        ),
    }).insert(ignore_permissions=True)

# ---------- 2. Custom Print Format with issue + expiry dates ----------
stock = json.load(open("/home/frappe/frappe-bench/apps/lms/lms/lms/print_format/certificate/certificate.json"))
html = stock["html"]
html = html.replace(
    'on {{ frappe.utils.format_date(doc.issue_date, "medium") }}.',
    'on {{ frappe.utils.format_date(doc.issue_date, "medium") }}.\n'
    '        <div style="margin-top: 1rem;">\n'
    '            {{ _("Issued on") }}: <span style="font-weight: 900;">{{ frappe.utils.format_date(doc.issue_date, "medium") }}</span>\n'
    '            &nbsp;&middot;&nbsp;\n'
    '            {{ _("Valid until") }}: <span style="font-weight: 900;">{{ frappe.utils.format_date(doc.expiry_date, "medium") }}</span>\n'
    '        </div>'
)
PF_NAME = "CSE Certificate"
if not frappe.db.exists("Print Format", PF_NAME):
    frappe.get_doc({
        "doctype": "Print Format",
        "name": PF_NAME,
        "doc_type": "LMS Certificate",
        "module": "LMS",
        "print_format_type": "Jinja",
        "custom_format": 1,
        "standard": "No",
        "html": html,
        "css": stock.get("css") or "",
    }).insert(ignore_permissions=True)

# Make it the default certificate template (read by lms get_default_certificate_template)
if not frappe.db.exists("Property Setter", {"doc_type": "LMS Certificate", "property": "default_print_format"}):
    frappe.get_doc({
        "doctype": "Property Setter",
        "doctype_or_field": "DocType",
        "doc_type": "LMS Certificate",
        "property": "default_print_format",
        "property_type": "Data",
        "value": PF_NAME,
    }).insert(ignore_permissions=True)
else:
    frappe.db.set_value("Property Setter",
        frappe.db.get_value("Property Setter", {"doc_type": "LMS Certificate", "property": "default_print_format"}),
        "value", PF_NAME)

# ---------- 3. Test coach account ----------
COACH = "coach@demofed.test"
if not frappe.db.exists("User", COACH):
    user = frappe.get_doc({
        "doctype": "User",
        "email": COACH,
        "first_name": "Casey",
        "last_name": "Coach",
        "user_type": "Website User",
        "send_welcome_email": 0,
    })
    user.insert(ignore_permissions=True)
    user.add_roles("Coach", "Course Creator", "LMS Student")
    from frappe.utils.password import update_password
    update_password(COACH, "CoachDemo_1")

frappe.db.commit()
print("CERT_CONFIG_OK")
