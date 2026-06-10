# CSE Milestone 1 Runbook — Template Federation Site

This runbook documents every step used to stand up a single branded federation
site on Frappe LMS, configured per the CSE Milestone 1 brief. In Milestone 2
this becomes the repeatable "new federation" provisioning process.

**Sealed-box rule (§10 of the build spec): no frappe/lms source files are
modified at any point.** Everything below is done through installation,
settings screens / settings doctypes, and site data (Server Script, custom
Print Format, Property Setter — all of which live in the site database, not in
app code).

Verified end-to-end on 2026-06-10: a test Coach enrolled, completed all
lessons, passed the quiz (70% threshold), and received a certificate reading
**"Issued on: Jun 11, 2026 · Valid until: Jun 11, 2027."**

---

## 1. Server prerequisites

Tested on Ubuntu 24.04, Python 3.11, Node 22.

```bash
apt-get update
apt-get install -y mariadb-server mariadb-client libmariadb-dev pkg-config \
    redis-server wkhtmltopdf cron

# MariaDB must run utf8mb4 (Frappe requirement)
cat > /etc/mysql/mariadb.conf.d/99-frappe.cnf <<'EOF'
[mysqld]
character-set-client-handshake = FALSE
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

[mysql]
default-character-set = utf8mb4
EOF

service mariadb start
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password \
    USING PASSWORD('<DB_ROOT_PASSWORD>'); FLUSH PRIVILEGES;"
```

> **bench refuses to run as root.** Create a dedicated user
> (`useradd -m -s /bin/bash frappe`) and run all `bench` commands as it:
> `su - frappe`. Install the bench CLI for that user:
> `pip3 install --user frappe-bench`.

## 2. Bench + Frappe LMS install

```bash
# as the frappe user
cd ~
bench init --frappe-branch version-15 frappe-bench
cd frappe-bench

# Fetch the LMS app (sealed box — cloned, never edited).
# CYPRESS_INSTALL_BINARY=0 skips the Cypress e2e-test binary, which is not
# needed to run the app (and may be blocked by firewalls).
CYPRESS_INSTALL_BINARY=0 bench get-app lms

# LMS depends on the payments app. Its develop branch needs Python>=3.14,
# so pin the branch matching the framework:
bench get-app payments --branch version-15

# One site per federation
bench new-site demo-federation.localhost \
    --mariadb-root-password <DB_ROOT_PASSWORD> \
    --admin-password <ADMIN_PASSWORD> \
    --mariadb-user-host-login-scope='%'

bench --site demo-federation.localhost install-app lms
bench use demo-federation.localhost

# Server Scripts power the certificate-expiry rule (step 6). In Frappe v15
# the flag must be in common_site_config.json (-g), not the site config:
bench set-config -g server_script_enabled 1

bench start          # production: use supervisor/nginx via `bench setup production`
```

## 3. Branding (settings only — Bucket 1, no AGPL trigger)

All branding lives in **Website Settings** (Desk → search "Website Settings"),
which the LMS frontend reads via its `get_branding` API:

| Setting screen | Field | Value used |
|---|---|---|
| Website Settings → Brand | App Name | Demo Kickboxing Federation |
| Website Settings → Brand | App Logo | uploaded `dkf_logo.png` |
| Website Settings → Brand | Brand HTML | Demo Kickboxing Federation |
| Website Settings → Brand | Favicon | uploaded `dkf_favicon.png` |
| Website Settings → Brand | Banner Image / Footer Logo | uploaded `dkf_logo.png` |
| Website Settings → Theme | Website Theme | "Demo Kickboxing Federation" theme, primary color `#C41E3A` |

Scripted equivalent: `scripts/configure_branding_roles.py` (run with
`scripts/run_on_site.py`). Per-federation onboarding = swap the two image
files + the name + the color.

> **Known limitation:** the LMS Vue frontend has no primary-color setting (only
> light/dark mode). The Website Theme color applies to the website layer.
> Re-skinning the SPA's accent color would require either custom CSS delivered
> from a separate CSE app or a core edit — the latter is out per the sealed-box
> rule, so it is *not* done. Flagged for a future CSE theming app if needed.

## 4. CSE role model

Created via Desk → Role / Role Profile (scripted in
`configure_branding_roles.py`). Four custom roles act as CSE markers; Role
Profiles bundle them with the LMS capability roles that actually drive
permissions:

| Role Profile | Contains roles | Capability |
|---|---|---|
| CSE User | CSE User, System Manager, Moderator, Course Creator, Batch Evaluator, LMS Student | Full control of the instance |
| Federation Admin | Federation Admin, Moderator, Course Creator, Batch Evaluator, LMS Student | Manage users, content, evaluation, reporting within the site |
| Coach | Coach, Course Creator, LMS Student | Deliver content + take coach courses |
| Athlete | Athlete, LMS Student | Take content, view own progress |

Assign a profile on the User form ("Role Profile" field). New signups default
to LMS Student; an admin promotes them to Coach/Athlete profiles.

## 5. Sample certification course + quiz

Created via the LMS UI (or scripted: `scripts/create_course.py`):

- **Course:** "Certified Kickboxing Coach - Level 1", published, **Enable
  Certification = ✓** (this is the field that allows self-serve certificates
  at 100% progress).
- **Chapters/lessons:** Module 1 (Ring & Gear Safety, Injury Prevention
  Basics), Module 2 (DKF Competition Rules, Coaching the Athlete Pathway,
  Final Exam).
- **Quiz:** "Level 1 Final Exam", **passing percentage 70**, one
  single-choice and one multiple-choice question, embedded in the Final Exam
  lesson as a quiz block.

## 6. Certificate with 1-year expiry (Ring Corner rule)

Stock LMS behavior: self-serve certificates set `issue_date` but leave
`expiry_date` blank, and the stock print format doesn't show expiry. Both
gaps are closed with **site data**, not code edits:

1. **Server Script** (Desk → Server Script → New) — name
   `CSE Certificate Expiry - 1 Year`, type *DocType Event*, doctype
   *LMS Certificate*, event *Before Insert*:

   ```python
   # CSE rule: every certificate expires one year from issue
   if not doc.expiry_date:
       doc.expiry_date = frappe.utils.add_years(doc.issue_date or frappe.utils.nowdate(), 1)
   ```

2. **Custom Print Format** `CSE Certificate` (Jinja, custom format, doctype
   LMS Certificate) — a copy of the stock template plus an
   "Issued on … · Valid until …" line, with the Google Fonts `<link>` tags
   removed (external fonts break wkhtmltopdf PDF rendering on locked-down
   networks).

3. **Property Setter** on LMS Certificate, property `default_print_format` →
   `CSE Certificate`, which makes LMS auto-issue certificates with this
   template.

Scripted: `scripts/configure_certificate.py`.

## 7. End-to-end smoke test (passed 2026-06-10)

`scripts/smoke_test.sh` drives the real learner flow over the site's HTTP API
as test user `coach@demofed.test` (Role Profile: Coach):

| Step | API call | Result |
|---|---|---|
| Login | `/api/method/login` | ✓ "Casey Coach" |
| Enroll | `frappe.client.insert` LMS Enrollment | ✓ |
| Complete 5 lessons | `course_lesson.save_progress` | progress 20→100% |
| Submit quiz | `lms_quiz.submit_quiz` | score 2/2, pass=true |
| Claim certificate | `lms_certificate.create_certificate` | ✓ issued |
| Render PDF | `frappe.utils.print_format.download_pdf` | ✓ shows both dates |

Resulting certificate: issue date **2026-06-11**, expiry **2027-06-11**
(exactly one year), rendered on the branded template
(`docs/sample-certificate.pdf`).

---

## Per-federation onboarding checklist (the repeatable part)

1. `bench new-site <federation>.cse.example --mariadb-root-password … --admin-password …`
2. `bench --site <site> install-app lms`
3. Run `scripts/configure_branding_roles.py` with the federation's name,
   logo, favicon, and primary color.
4. Run `scripts/configure_certificate.py` (expiry rule + branded template).
5. Load curriculum (clone of template course or federation-specific content).
6. Create the Federation Admin user, assign the Federation Admin role profile.
7. Point the federation's domain at the site (`bench setup add-domain`).
8. Run `scripts/smoke_test.sh` adapted to the site as the final gate.

Milestone 2 turns steps 1–8 into one provisioning action in the CSE console
(frappe/press).
