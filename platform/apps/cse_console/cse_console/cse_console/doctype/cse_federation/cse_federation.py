import frappe  # noqa: F401  (imported for parity with other controllers)
from frappe.model.document import Document


class CSEFederation(Document):
    """A single CSE federation (one isolated Frappe site) and its setup wizard.

    This document captures every input needed to stand up a federation end to
    end — subdomain/domain, branding tokens, the first admin user, the content
    import source, and payment settings — plus a `provisioning_steps` child
    table that records the live status/log of each orchestration step.

    Intentionally a thin stub. The orchestration that actually provisions the
    site (`bench new-site`, `run_on_site.py <script>` for branding/roles/cert/
    admin/import, custom-domain + TLS wiring, and the smoke-test gate) lives in
    a separate module, `cse_console.provisioning`, authored by another agent.
    Validation and lifecycle hooks can be added here later if needed.
    """

    pass
