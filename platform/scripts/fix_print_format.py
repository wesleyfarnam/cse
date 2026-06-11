import frappe, re
frappe.set_user("Administrator")
pf = frappe.get_doc("Print Format", "CSE Certificate")
html = pf.html
html = re.sub(r'<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>\s*', '', html)
html = html.replace("'Inter', sans-serif", "sans-serif").replace('"Inter", sans-serif', 'sans-serif')
pf.html = html
pf.save(ignore_permissions=True)
frappe.db.commit()
print("PF_FIXED", "fonts.googleapis" not in pf.html)
