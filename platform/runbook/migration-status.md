# EzyCourse → Frappe LMS Migration — Status Record

Durable record of the EzyCourse migration so its state lives in the repo, not
only on the server. Update this whenever the migration state changes.

**Status: COMPLETE — content + video hosting.** (Close-out items below still to
be confirmed.)
**Target site:** `demo.combatsportseducation.com`
**Video host:** Bunny Stream (configured)
**Recorded:** 2026-07-17 · **Migration run date:** _to confirm_

---

## What was migrated

Courses are live and published on the site (instructors: Wesley, David),
branded USA Kickboxing. Confirmed present with lesson counts:

| Course | Lessons |
|--------|--------:|
| Seminars | 5 |
| Corner Certificate | 21 |
| Athletic Development | 42 |
| Level 2 Silver Coach | 74 |
| BJJ Drills and Skills | 92 |
| K1 Development Curriculum | 156 |
| _…additional courses below the fold_ | _to confirm_ |

> Fill in the full course list + totals from
> `run_on_site.py dump_ids.py` (course/chapter/lesson counts) so this matches
> the source-of-truth on the server.

## Close-out checklist (to confirm)

- [ ] **Students & enrollments** imported (count vs EzyCourse dashboard)
- [ ] **Videos** all playing via Bunny embeds; `videos_pending: 0`
      (no `[VIDEO PENDING]` placeholders in any lesson)
- [ ] **Progress** imported (if `IMPORT_PROGRESS=1` was used)
- [ ] Export archive backed up **off** the bench server
- [ ] Students notified of new URL + "Forgot password" to set a password
- [ ] EzyCourse subscription kept read-only for one billing cycle, then cancelled

## Reproducibility

- [ ] Finalized `ENDPOINTS` / `AUTH_STYLE` in `scripts/ezycourse_export.py`
      committed (the HAR-mapped values used for the real crawl).
- [ ] `video_map.json` archived (location: _to confirm_) — the EzyCourse-URL →
      Bunny-embed mapping. Not secret, but keep a copy with the export archive.

## Deliberately NOT in git

Student PII CSVs, the HAR capture (contains a live session cookie), and any
passwords. These stay on the operator's machine / secure storage only.
