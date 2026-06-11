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
  end-to-end `smoke_test.sh`.
- `docs/sample-certificate.pdf` — smoke-test output: branded certificate with
  issue + 1-year expiry dates.

## Status

- ✅ Milestone 1: template federation site (demo branded instance, roles,
  expiring certificate, passing smoke test)
- ⬜ Milestone 2: frappe/press fleet + CSE console + scripted provisioning
