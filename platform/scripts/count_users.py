import frappe

# Runs on a tenant (federation) site via run_on_site.py. Prints the federation's
# member count for the console's "User Count" column as USER_COUNT|<n>.
# Counts enabled users excluding the built-in system accounts — i.e. the coaches,
# athletes, and federation admins who actually use the site.
count = frappe.db.count("User", {"enabled": 1, "name": ["not in", ["Administrator", "Guest"]]})
print("USER_COUNT|%d" % count)
