# CSE B2B Website — Build Plan & Handoff Brief

**For:** Claude design → Claude code
**Project:** Marketing/sales site for Combat Sports Education's white-label certification platform
**Model chosen:** Credibility + funnel (~7–8 pages)

---

## 0. Read this first (scope guardrail)

This is the **marketing site only**. Its job is to convince federations and route them to a demo conversation. It is **not** the learning platform (the EzyCourse replacement) — that's a separate project. Do not build LMS features, logins, course players, or payment flows here. The only interactive element is a demo-request form.

**Do not publish pricing anywhere on the site.** Pricing is handled in sales conversations.

---

## 1. Goal & audience

**Primary goal:** Get qualified federations to **book a demo**.
**Audience:** Federation leadership and coaching-education directors — decision-makers responsible for coach credentialing, athlete safety, and meeting recognition/sanctioning standards. They are cautious, board-accountable buyers who need proof before committing.

**Single primary CTA across the whole site:** *Book a Demo* (sticky in header, repeated at the bottom of every page).

---

## 2. Sitemap (7 pages)

1. **Home** — the pitch in one scroll, with proof and a clear CTA.
2. **How It Works** — the white-label model explained simply.
3. **Programs** — the certification curriculum (Ring Corner → Gold).
4. **Case Study** — the USA Kickboxing proof story.
5. **Why CSE** — competitive advantage + recognition lineage.
6. **About** — who CSE is and credibility.
7. **Book a Demo** — the conversion page (form).

A short **FAQ** can live as a section on *How It Works* or *Book a Demo* rather than its own page — it handles board-level objections.

---

## 3. Page-by-page content spec

### 1. Home
- **Hero:** Bold headline + subhead + primary CTA. Headline angle: *"Launch your federation's own coach certification program — without building it from scratch."* Subhead names the value: proven, recognized curriculum delivered under their brand.
- **Value prop strip:** 3 short pillars — *Branded as yours · Proven & recognized · Fully managed.*
- **How it works (condensed):** 3 steps (Brand it → Launch it → Certify coaches), linking to the full How It Works page.
- **Proof snippet:** one line + logo referencing the USA Kickboxing implementation, linking to the case study.
- **Programs preview:** the four levels as cards (Ring Corner, Bronze, Silver, Gold).
- **Closing CTA band:** *Book a Demo.*

### 2. How It Works
- Explain the white-label model in plain terms: federation gets a branded instance of CSE's certification program; CSE builds, hosts, and maintains it; the federation runs it as their own.
- 3–4 step visual: Onboard & brand → Adapt curriculum → Launch to coaches → Ongoing updates.
- Short **FAQ** here (objection-handling): Is it really our brand? Who maintains it? How long to launch? Can we adapt content to our requirements? *(No pricing answers.)*
- CTA band.

### 3. Programs
- Overview line: a full coaching-education pathway, from cornering to world-class.
- Four levels, each a short block:
  - **Ring Corner Certification** — entry credential; qualifies coaches to corner athletes at sanctioned events; first step in the coaching pathway.
  - **Bronze** — basic instructor/coach developing athletes for competition or recreation.
  - **Silver** — coaches preparing athletes for national competition.
  - **Gold** — coaches preparing athletes for international/world-class competition.
- Note: curriculum is updated regularly and adaptable to a federation's local requirements.
- CTA band.

### 4. Case Study — USA Kickboxing
- The reference story: CSE built and delivered a recognized certification program for USA Kickboxing.
- Structure: the need → what CSE delivered → the result (a live, recognized coaching education program).
- Keep it credible and concrete; this page exists to de-risk the decision for other federations.
- CTA band.

### 5. Why CSE
- Four advantage blocks: *Finished, recognized curriculum · First mover with proof · Fully managed platform · Built for federations.*
- Recognition lineage: kickboxing as a US Olympic & Paralympic recognized sport; WAKO as the global governing body. Frame CSE as built to that standard.
- CTA band.

### 6. About
- Who CSE is and why it's qualified to deliver coaching education at a federation standard.
- Short, credibility-focused. Can mention the broader Combat Sports Education background.
- CTA band.

### 7. Book a Demo
- The conversion page. Short form: name, federation/organization, role, country, email, message.
- Reassurance copy: what happens after they submit (a real conversation, a walkthrough).
- No pricing. No account creation.

---

## 4. Design direction (for Claude design)

Pull the existing brand language from CSE's current materials so the site feels consistent:

- **Palette:** deep navy/charcoal base (~`#1F2A37`), bold red accent (~`#E8413A`), white text, generous dark space.
- **Type:** bold, condensed, often italicized display headlines (athletic, aggressive); clean sans-serif body.
- **Imagery:** high-contrast combat-sports photography (training, sparring, ring corners). Keep it premium, not stocky.
- **Motifs:** angled red diagonal slashes as section dividers (matches existing brochure). Strong, high-energy, professional — this sells to institutions, not consumers, so keep it credible and clean rather than gimmicky.
- **Tone of copy:** confident, institutional, benefit-led. Speaks to federations as peers.

**Deliverable from design step:** page layouts/wireframes + a component inventory (hero, value strip, step blocks, program cards, case-study layout, CTA band, demo form, header/footer).

---

## 5. Tech direction (for Claude code)

- **Stack:** static marketing site. Recommend **Next.js + Tailwind** (consistent with the future platform stack and easy to deploy on Vercel). Plain HTML/Tailwind is an acceptable lighter option if speed matters more.
- **Pages:** the 7 routes above.
- **Demo form:** single endpoint. Pipe submissions to GoHighLevel (form/webhook) so leads land in the existing CRM. Fallback: a simple form service (e.g. Formspree). No database needed.
- **No:** auth, LMS, payments, user accounts, dashboards. None of the platform belongs here.
- **Performance/SEO:** static-generated pages, basic meta tags + Open Graph, mobile-first responsive.
- **Content:** all copy is real and final-ish from this brief; design/code can refine wording but shouldn't invent pricing or features.

---

## 6. Out of scope (explicit)

- The hosted learning platform / EzyCourse replacement.
- Any pricing, royalty, or contract terms on public pages.
- Coach/athlete logins, course delivery, certificates, payments.

---

## 7. Handoff sequence

1. **Claude design** — turn Sections 3 & 4 into wireframes + component inventory.
2. **Claude code** — build the 7 pages from the wireframes using Section 5's stack; wire the demo form to GHL.
3. **Review** — check copy, proof claims, and that no pricing leaked in.
