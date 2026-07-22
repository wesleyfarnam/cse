/*
 * CSE brand injector (client-side).
 *
 * Idempotent, id-guarded fallback that guarantees the per-federation brand
 * stylesheet + Google Fonts link are present in <head> on any surface the
 * server-side include hooks do not reach. Loaded on both Desk (app_include_js)
 * and web/portal (web_include_js).
 *
 * The brand stylesheet is served by the whitelisted endpoint
 *   cse_branding.brand.brand_css  ->  /api/method/cse_branding.brand.brand_css
 * which returns the resolved :root{--cse-*} tokens + fonts + design system.
 */
(function () {
  "use strict";

  var BRAND_CSS_HREF = "/api/method/cse_branding.brand.brand_css";
  var DEFAULT_FONTS_URL =
    "https://fonts.googleapis.com/css2?" +
    "family=Plus+Jakarta+Sans:wght@400;500;600;700;800" +
    "&family=Saira+Condensed:wght@600;700&display=swap";

  function ensureLink(id, href) {
    if (!href) return;
    if (document.getElementById(id)) return; // already injected — idempotent
    var link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function inject() {
    if (!document.head) return;

    // Per-federation brand tokens + fonts + design system.
    ensureLink("cse-brand-css", BRAND_CSS_HREF);

    // Google Fonts for the app + display families. Prefer the URL delivered in
    // the boot payload (bootinfo.cse_brand), fall back to the contract default.
    var fontsUrl = DEFAULT_FONTS_URL;
    try {
      var boot = window.frappe && window.frappe.boot;
      if (boot && boot.cse_brand && boot.cse_brand.google_fonts_url) {
        fontsUrl = boot.cse_brand.google_fonts_url;
      }
    } catch (e) {
      /* ignore — use default */
    }
    ensureLink("cse-brand-fonts", fontsUrl);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject(); // DOM already parsed
  }
})();
