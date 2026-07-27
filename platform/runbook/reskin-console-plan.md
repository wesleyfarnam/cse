# CSE Platform — Reskin, Theming & Federation Console Plan

## Context

Two capabilities are being added to the CSE platform on top of the working
Milestone-1 foundation:

1. **A default design system + full reskin** — the "App Navigation Design"
   handoff (7 batches: dashboard, course player, learning management,
   onboarding/settings, marketing home, catalog/detail, pricing/instructors)
   becomes the platform's default look, **themeable per federation** (each
   federation swaps colors, fonts, and logo).
2. **A federation setup console** — an operator wizard that stands up a new
   federation end-to-end: name → subdomain/custom domain → branding swap →
   content + client import (from *any* source, not just EzyCourse) → payment
   gateway → admin user → finalize.

Hard constraint throughout: the **sealed-box rule** — `frappe/lms` source is
never edited. Everything is a separate app, site data, or deploy config.

### Key research findings (that shape the plan)

- **The design has no token layer** — the mockups hardcode ~450 hex literals
  each with zero componentization. A federation theme is a *tiny* set:
  **~2 fonts + 3 brand colors (primary, primary-hover, navy) + logo**;
  everything else (neutrals, spacing, radius, shadows, semantic colors) is
  structural and constant. So step one is *creating* a tokenized design system.
- **`cse_branding` today registers zero hooks** — it only overrides `/login`.
  Its `:root` CSS-variable approach is the right pattern to generalize.
- **The `/lms` Vue SPA is a compiled bundle no Frappe CSS-include hook reaches.**
  Colors/fonts/logo/light-restyle on the stock app are achievable via an
  **nginx `sub_filter`** injecting a brand stylesheet (or a route-shadow shell);
  anything structural (bespoke dashboard widgets, marketing pages) must be
  **built fresh**. Pixel-perfect app screens = a custom learner frontend.
- **Provisioning: build a custom `cse_console` app, not frappe/press** (Press
  would force a Docker/multi-server re-platform). It reuses the existing M1
  scripts 1:1; the only net-new provisioning code is the **payment gateway**.

### Decisions (defaults taken; change any of these)

- **Reskin depth:** *phased* — theme the stock LMS app + build marketing fresh
  now; decide on a pixel-perfect custom frontend later, after seeing the themed
  stock app.
- **Payments:** Stripe (US-first, for USA Kickboxing).
- **Console:** operator-only for now (self-serve later).
- **Git:** continuing on the sanctioned branch until told to split into a
  separate PR.

---

## Track 1 — Tokenized design system + all connection points  *(building now)*

Turn the design into a real, per-federation-themeable system and wire branding
into **every** surface. All inside `cse_branding` (+ one nginx snippet).

- **Design system CSS** (`public/css/cse-design-system.css`) — structural tokens
  (neutrals L/D, radius, shadows, semantic) + brand tokens
  (`--cse-primary`, `--cse-primary-hover`, `--cse-primary-dark`, `--cse-navy`,
  `--cse-link`, `--cse-font-app`, `--cse-font-display`), plus the component
  classes the mockups never had (buttons, cards, badges, tabs, progress,
  sidebar, inputs). Light + dark.
- **Brand generator** (`brand.py`) — `get_brand_tokens()` / `render_brand_css()`
  produce a `:root{…}` block from the branding doctype; a whitelisted
  `brand_css()` endpoint serves tokens + system as one stylesheet.
- **Doctype fields** — add fonts, navy, hover/dark/link colors, and a Google
  Fonts URL to `CSE Login Branding` (now the site-wide brand record).
- **Connection points** (the crux):
  | Surface | Mechanism |
  |---|---|
  | `/login` | existing template (moved onto the shared generator) |
  | Desk `/app` | `app_include_css` |
  | Web/portal pages (LMS certificate, sign-up, marketing `www/`) | `web_include_css` + `update_website_context` |
  | **`/lms` Vue SPA** | **nginx `sub_filter`** injects `<link>` to `brand_css` + fonts — no LMS edit |
  | SPA JS payload | `boot_session` carries brand tokens |

**Outcome:** editing one branding record re-themes the whole federation.

## Track 2 — The reskin (after Track 1)

- **Marketing site** (home, pricing, instructors, catalog/detail) — net-new,
  built to the mockups as `www/` pages in a CSE app using the design system.
- **App screens** — *phased*: stock LMS themed via Track 1 now; a custom
  Frappe-UI learner frontend (pixel-perfect dashboard/player/etc., LMS as
  headless backend) is a later decision.

## Track 3 — Federation setup console (`cse_console`)

- **`CSE Federation` doctype** capturing wizard inputs; an 8-step wizard UI.
- **Orchestration** via `frappe.enqueue(queue="long")` + `subprocess` around the
  existing runbook commands and scripts (each already idempotent).
- **Step → tooling:** name/branding (parameterize `configure_branding_roles.py`),
  domain (`bench setup add-domain` + certbot), content+clients (see import
  framework below), **payments (new `configure_payments.py`, Stripe)**, admin
  (`create_admin_user.py`, ready), finalize (`configure_certificate.py`,
  `smoke_test.sh`).

## Track 4 — Source-agnostic import framework

EzyCourse is **one adapter**, not the design.

- **Normalized bundle schema** — courses → chapters → lessons, users,
  enrollments, progress, assets, video map. The one format the importer reads.
- **Adapters** — `ezycourse` (existing crawl/CSV → normalized), `csv` (generic
  long-tail), future `teachable`/`thinkific`/etc.
- **Generic importer** — generalize `ezycourse_import.py` → `import_bundle.py`
  (source-neutral); EzyCourse specifics move into its adapter.

---

## Verification (server-side — cannot be tested from the repo container)

Track 1 is authored here but must be verified on the demo VPS:

1. `bench --site demo.combatsportseducation.com install-app cse_branding` (or
   `migrate`/`build` if already installed), then `bench build`.
2. Add the nginx snippet, `nginx -t`, reload.
3. Set brand colors/fonts/logo on the **CSE Login Branding** record.
4. Confirm the brand applies on `/login`, a portal page, and — via the
   `sub_filter` — the `/lms` app (accent color, fonts, logo all follow).
5. Change one color → confirm every surface updates.

Sequencing: Track 1 → Track 4 (import) + Track 3 (console) in parallel →
Track 2 marketing → (decision) pixel-perfect app frontend.
