app_name = "cse_console"
app_title = "CSE Console"
app_publisher = "Combat Sports Education"
app_description = "Operator console + federation setup wizard for the CSE platform"
app_email = "platform@combatsportseducation.com"
app_license = "MIT"

# ---------------------------------------------------------------------------
# App metadata only.
#
# This app deliberately registers NO runtime hooks (no boot_session, no
# include_js/css, no doc_events, no scheduler_events). It ships two doctypes —
# `CSE Federation` (the wizard document) and its child `CSE Provisioning Step` —
# and nothing that runs on every request or mutates other apps' surfaces.
#
# The orchestration that actually stands up a federation (shelling out to
# `bench new-site`, running `run_on_site.py <script>` against the new site,
# wiring the custom domain) lives in a SEPARATE module, `cse_console.provisioning`,
# authored by another agent. When that module is ready it may register its own
# hooks (e.g. a whitelisted method to kick off / poll a provisioning run). Keep
# those additions there and out of this file unless they are genuinely app-wide.
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Fixtures / workspace (note, not yet wired)
#
# If the operator console should ship a Desk Workspace card for the CSE
# Federation list, export it as a fixture and declare it here, e.g.:
#
#   fixtures = [
#       {"dt": "Workspace", "filters": [["name", "in", ["CSE Console"]]]},
#   ]
#
# Left commented until a workspace is actually designed, so a fresh install
# does not fail importing a fixture that does not exist.
# ---------------------------------------------------------------------------
