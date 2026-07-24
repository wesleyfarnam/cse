# CSE Operator Console — design spec

`console-dashboard.prototype.html` is the interactive design target for the
operator console (open it in a browser). Build it for real as a **Frappe UI page**
in this app, backed by the existing **CSE Federation** doctype + `provisioning.py`.

## Two screens

1. **Federations dashboard** — the "all clients" view: stat tiles (total / live /
   provisioning / learners) + a table of every federation (logo, name, subdomain,
   status pill, plan, learners, created) + a prominent **＋ Add New Federation**.
   Data: list the CSE Federation records; status pill = the doc's `status`
   (Draft / Provisioning / Live / Failed).

2. **Add New Federation wizard** — 8 steps mapping 1:1 to the doctype sections and
   `provisioning.py`: Details → Domain → Branding → Content → Import clients →
   Payments → Admin → Review &amp; provision. Submitting writes a CSE Federation doc
   and calls `cse_console.provisioning.provision_federation`; the review screen
   streams the 8 provisioning steps live from the doc's `provisioning_steps` child
   table (Pending / Running / Done / Failed).

## Notes
- The branding step feeds the same CSE Login Branding record the whole platform
  themes from — the live preview in the wizard mirrors that.
- Payments + import steps are optional (can be completed later).
- Keep it operator-only for now (System Manager / CSE User).
