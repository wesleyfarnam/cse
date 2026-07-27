# CSE Platform — "What's Next" Handoff for Claude Code

For a Claude Code session (ideally on a Mac with SSH access to the server) picking
up the CSE platform. Pairs with `desktop-claude-handoff.md` (the deploy mechanics)
and `reskin-console-plan.md` (the design/console roadmap). **Sealed-box rule:
never edit `frappe/lms` source.** Server: `root@5.78.185.237` → `sudo -iu frappe`;
bench `/home/frappe/frappe-bench`; site `demo.combatsportseducation.com`. Back up
before changes: `bench --site demo.combatsportseducation.com backup --with-files`.

## Where things stand (2026-07-23)

- **Live:** Milestone-1 foundation; EzyCourse migration (real courses on the demo
  site, Bunny video); Track 1 branding engine; Track 2 reskin (navy sidebar, red
  primary, app fonts) + marketing pages `/home`, `/pricing`, `/instructors`.
- **Built, not deployed:** `cse_console` federation setup app (Track 3); the
  source-agnostic import framework (Track 4).
- **Branches:** PR #12 = migration (`claude/dreamy-bardeen-rc2oji`), PR #14 =
  platform (`claude/cse-platform-build`, head has the live brand_css + skin fixes).
- **Biggest gap:** the platform has **no email configured** — nothing automated
  can send.

## Federation setup console — the admin "add a client" dashboard

The operator dashboard to **see all clients and spin up a new one** (name → domain
→ branding → content → clients → payments → admin → provision). The engine is
built (`cse_console`: CSE Federation doctype + `provisioning.py`). Two steps:
deploy the engine so you can add clients today, then build the designed dashboard
on top. Design target: `platform/apps/cse_console/design/` (open the prototype
HTML + read its README).

### A. Deploy the cse_console engine → a working admin view today

```text
On the server (ssh root@5.78.185.237 → sudo -iu frappe):
1. Back up: bench --site demo.combatsportseducation.com backup --with-files
2. Get the app onto the bench (same pattern as cse_branding): rsync
   platform/apps/cse_console into ~/frappe-bench/apps/cse_console, give it a git
   commit (git init + commit if needed so bench version works).
3. Install on the site + apply:
   bench --site demo.combatsportseducation.com install-app cse_console
   bench --site demo.combatsportseducation.com migrate
   bench build && bench --site demo.combatsportseducation.com clear-cache
   sudo supervisorctl restart all
4. Confirm the admin view: log into Desk as Administrator and open
   /app/cse-federation — the "all clients" list + New button are there.
5. DRY-RUN a new federation (throwaway subdomain, NO real Stripe keys, NO DNS) to
   confirm provisioning.py runs the 8 steps and writes per-step status. Report
   what worked / errored. Do not run real payments or point DNS yet.
```

### B. Build the designed Operator Console dashboard (after A)

```text
Build the CSE Operator Console as a Frappe UI page in cse_console, following
platform/apps/cse_console/design/ (prototype + README):
- Dashboard: list CSE Federation records with stat tiles + status pills (from the
  doc's status field) + a prominent "Add New Federation".
- Wizard: the 8 steps mapping to the doctype sections; on submit create a CSE
  Federation doc and call cse_console.provisioning.provision_federation, streaming
  the provisioning_steps child table live (Pending/Running/Done/Failed).
- Reuse the CSE brand tokens; the Branding step feeds the CSE Login Branding record.
Operator-only (System Manager / CSE User).
```

## Next work, in priority order

### 1. Email delivery — DO THIS FIRST (unblocks everything)
No email = no password resets, receipts, certificate emails, or nudges. The
migrated students have no passwords and are meant to use "Forgot password" at
cutover, which silently needs email.
- Pick a provider: **Amazon SES** (cheap, scales) / **Postmark** (best deliverability,
  simple) / SendGrid / Mailgun. Recommend Postmark or SES.
- DNS on `mail.combatsportseducation.com`: **SPF**, **DKIM**, and a **DMARC** record
  (values from the provider). This is the deliverability foundation — do it carefully.
- Configure a Frappe **Email Account** (outgoing, SMTP or the provider's API) as the
  site's default sender. Set the "Auto Reply"/notification sender + `email_id`.
- **`platform/scripts/configure_email.py` is BUILT** — run via `run_on_site.py`,
  env-driven (EMAIL_SENDER, SMTP_SERVER, SMTP_PORT, SMTP_LOGIN, SMTP_PASSWORD,
  SMTP_TLS/SSL). Creates the outgoing Frappe Email Account (default sender) and
  sets the site's auto-email id. Idempotent; skips cleanly if creds are missing.
  Deploy = get provider creds + add SPF/DKIM/DMARC DNS, then run it. Wireable into
  the console wizard as an email step.
- **Verify:** Desk → Email Account → send a test; watch the **Email Queue**; then do
  a real end-to-end **password reset** on a migrated student account.

### 2. Payments — deploy + test Stripe
- `platform/scripts/configure_payments.py` (already built) writes Stripe Settings +
  LMS payment fields. Deploy it and run with the **real Stripe keys**:
  `PAYMENT_PROVIDER=stripe STRIPE_PUBLISHABLE_KEY=pk_... STRIPE_SECRET_KEY=sk_... run_on_site.py configure_payments.py`
- Mark a test course paid; **buy it end-to-end** with a Stripe test card; confirm the
  enrollment + receipt path. (Receipt emails need step 1 live.)

### 3. Recurring memberships + dunning — decision, then build
- The pricing page sells Monthly/Annual **memberships**, but LMS's native payments are
  **one-time per course**. To sell memberships you need **Stripe Billing subscriptions**.
- Recommended: model memberships as Stripe subscription products; on active
  subscription, grant an "All-Access" role/enrollment; let **Stripe's native dunning**
  (Smart Retries + reminder emails) handle failed renewals — don't rebuild dunning.
- This is net-new work + a product decision (which plans, what access each grants).
  Confirm the plan with the owner before building.

### 4. Certificate emails — small, after step 1
- The 1-year certificate already issues on completion. Add a Frappe **Notification**
  (or extend the existing certificate flow) to email the learner their certificate /
  a "you're certified" message. Needs email live.

### 5. Engagement / lifecycle emails — after step 1
- Nudges ("finish your course"), inactivity re-engagement, new-course announcements,
  streak reminders. Build with Frappe **Notification** docs (event + scheduled) and/or
  **Email Campaign**, plus scheduled jobs. Keep them per-federation togglable.

### Housekeeping (any time)
- Confirm the server is running the latest branch commit and the test brand color is
  reverted to `#d11f2d` (hard-refresh `/lms`, `/home`).
- Merge PR #12 first, then #14 (both green, conflict-free).
- (Console deploy + dashboard build now have their own section above.)

## Guardrails
- Email + Stripe keys and DNS secrets are sensitive — never commit them; pass via env
  / Frappe's password fields. Redact secrets from any logs.
- Everything stays sealed-box and per-federation-configurable (driven by site data /
  env, like the branding record), so it composes into the `cse_console` wizard.
- Back up before each change; if a step errors, stop and diagnose.
