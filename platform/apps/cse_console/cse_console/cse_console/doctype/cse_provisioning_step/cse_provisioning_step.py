import frappe  # noqa: F401  (imported for parity with other controllers)
from frappe.model.document import Document


class CSEProvisioningStep(Document):
    """One step in a federation's provisioning run.

    Child (istable) row of `CSE Federation`. Rows are created and mutated by the
    orchestration module (`cse_console.provisioning`) as it walks the setup
    sequence — this controller is intentionally a plain stub.
    """

    pass
