# CSE Branding — Connection Points

How per-federation branding reaches **every** surface of the CSE platform.

## Single source of truth

One record drives everything: the **CSE Login Branding** single doctype. Its
fields (primary / hover / dark colors, navy, link, app + display fonts, Google
Fonts URL) are resolved by `cse_branding.brand.get_brand_tokens()`, rendered
into a `:root{--cse-* …}` block by `render_brand_css()`, and served — together
with the fonts helper and the full design system — by the whitelisted endpoint:

    cse_branding.brand.brand_css  ->  /api/method/cse_branding.brand.brand_css

The design system is split into two layers (both defined with the exact
`--cse-*` custom-property contract):

- **BRAND layer** — per-federation overridable (primary `#DB2B3A`, hover
  `#C01F2F`, dark `#F04752`, navy `#131C3F`, link `#2F54D0`, font-app
  `'Plus Jakarta Sans'`, font-display `'Saira Condensed'`). These are the
  `:root` defaults and what a federation overrides.
- **STRUCTURAL layer** — constant across federations, themed by light/dark
  (canvas / card / border / ink / secondary / faint, semantic success-info-
  neutral, radius `--cse-r-*`, shadow). Ships as static CSS; never per-federation.

## Surfaces & mechanisms

| # | Surface | Mechanism | How branding arrives | Type |
|---|---------|-----------|----------------------|------|
| 1 | **`/login`** | Custom `www/login.py` + `www/login.html` | Self-contained template (bypasses `web.html` desk chrome); `get_login_branding()` feeds context; design system + fonts included by the web hooks below | code |
| 2 | **Desk (`/app` SPA)** | `app_include_css` = `…/css/cse-design-system.css`; `app_include_js` = `…/js/cse-brand-inject.js` | Frappe injects the compiled design system into the desk bundle; the JS injector adds the brand_css endpoint link + Google Fonts link | code |
| 3 | **Web / portal pages** (incl. **LMS certificate** & **sign-up**, server-rendered) | `web_include_css` = `[cse-design-system.css, cse-fonts.css]`; `web_include_js` = `…/js/cse-brand-inject.js` | Frappe includes design system + fonts on every portal/web page; injector guarantees the endpoint + fonts links | code |
| 4 | **Web templates that inline tokens** | `update_website_context` = `cse_branding.context.update_website_context` | Sets `context.brand_css` (rendered `:root{…}`) + `context.cse_brand` so a template can inline `<style>{{ brand_css }}</style>` — no round-trip | code |
| 5 | **`/lms` Vue SPA** | nginx `sub_filter` — `platform/deploy/nginx-cse-branding.snippet` | The pre-built SPA bypasses ALL Frappe include hooks; nginx rewrites the SPA HTML to inject, before `</head>`, the `brand_css` endpoint link + Google Fonts link. `Accept-Encoding` cleared upstream so sub_filter sees uncompressed HTML | deploy-config |
| 6 | **Desk boot payload (client tokens)** | `boot_session` = `cse_branding.brand_boot.boot_session` | Attaches `bootinfo.cse_brand` = brand tokens dict; the JS injector reads `frappe.boot.cse_brand.google_fonts_url`, and desk JS can read colors/fonts with no fetch | code |

### Code vs deploy-config

- **Code** (rows 1–4, 6): lives in the `cse_branding` app; deployed by app
  install + `bench build` + `bench migrate` / restart. No editing of
  `frappe`/`lms` source (sealed-box).
- **Deploy-config** (row 5): lives in the site's nginx configuration; deployed
  by dropping `nginx-cse-branding.snippet` on the host and `include`-ing it in
  the `/lms` location, then `nginx -t && systemctl reload nginx`. This is the
  ONLY way to theme the stock LMS SPA without editing `frappe/lms`.

## Client-side injector

`public/js/cse-brand-inject.js` is a tiny, idempotent, id-guarded fallback
loaded on Desk and web. On DOMContentLoaded it ensures `<head>` contains:

- `<link id="cse-brand-css" rel="stylesheet" href="/api/method/cse_branding.brand.brand_css">`
- `<link id="cse-brand-fonts" rel="stylesheet" href="…google fonts…">` (URL from
  `frappe.boot.cse_brand.google_fonts_url`, else the contract default)

It is the catch-all for surfaces the static server includes miss.

## Per-federation flow

1. A federation admin edits the **CSE Login Branding** record (colors + fonts).
2. `get_brand_tokens()` resolves the new values (cached doc).
3. Every surface re-themes from the same tokens, with no code change:
   - `/login`, Desk, web/portal (incl. LMS certificate + sign-up), and inline
     templates pick up the new `:root{--cse-*}` via the design system + the
     `brand_css` endpoint / `context.brand_css` / `bootinfo.cse_brand`.
   - The `/lms` Vue SPA picks it up because nginx injects the same `brand_css`
     endpoint link — the endpoint returns the freshly-resolved tokens.

One record edited → every surface updates.
