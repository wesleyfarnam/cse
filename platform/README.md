# CSE Platform

White-label certification & training platform for combat-sports federations,
built on [Frappe LMS](https://github.com/frappe/lms) per the sealed-box rule:
frappe/lms is never modified; everything CSE-specific lives in settings, site
data, and (in later milestones) separate private Frappe apps.

## Contents

- `runbook/milestone-1-runbook.md` — full setup of the template federation
  site: install, branding, CSE roles, sample certification course, and the
  1-year-expiry certificate. This is the repeatable per-federation process.
- `scripts/` — scripted equivalents of every runbook step
  (`run_on_site.py` executes the others against a site), plus the
  end-to-end `smoke_test.sh`, and the Milestone 2 host workers:
  `provision_worker.py` (consumes the CSE Console job queue and runs the whole
  onboarding) and `sync_worker.py` (refreshes each live federation's
  `user_count` / `last_synced`), sharing `console_worker.py`.
- `docs/sample-certificate.pdf` — smoke-test output: branded certificate with
  issue + 1-year expiry dates.

## Status

- ✅ Milestone 1: template federation site (demo branded instance, roles,
  expiring certificate, passing smoke test)
- 🟡 Milestone 2: CSE Console (`cse_console` app) + scripted provisioning
  (`provision_worker.py`) and console sync (`sync_worker.py`) done; remaining:
  console deployment at `console.combatsportseducation.com` and the frappe/press
  fleet setup
