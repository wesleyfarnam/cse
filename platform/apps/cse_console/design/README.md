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

## Wizard enhancements (built / specced)

- **Branding — pull from the federation's website.** The operator enters the
  client's existing site; `cse_console.brandpull.pull_branding(url)` (whitelisted,
  built) fetches it and returns a suggested **primary color, fonts, and logo URL**
  to prefill the Branding step (operator reviews/tweaks). Signals: `theme-color`
  meta, Google-Fonts `<link>` families, hex/rgb frequency×saturation, and
  `og:image`/`<link rel=icon>`/logo `<img>` for the logo. SSRF-guarded (public
  http/s only, private IPs blocked, timeout + size cap). Heuristic — always
  operator-reviewable.
- **Content — pick which courses to clone.** Source dropdown (Start empty / Clone
  from the CSE library / Import a bundle). "Clone" reveals a checklist of the CSE
  template courses to copy into the new federation; "Import" reveals a bundle path.
- **Import clients — real CSV upload.** Source dropdown reveals a file picker for
  "Generic CSV upload" (columns: email, first_name, last_name, course) or a bundle
  path — wired to the source-agnostic import framework.
