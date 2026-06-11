# EzyCourse → Frappe LMS Migration Runbook

Moves everything off EzyCourse (courses, lessons, video/file assets, students,
enrollments, progress) into a CSE Frappe LMS site.

EzyCourse has **no public data-export API** — only event webhooks. So the
migration runs three tracks in parallel:

| Track | What | Risk |
|-------|------|------|
| 1 | CSV exports from the admin dashboard (students, enrollments, quiz responses) | None — confirmed feature |
| 2 | Scripted crawl of the dashboard's internal API (course content + assets) | Endpoints must be mapped from a HAR capture first |
| 3 | Support ticket asking EzyCourse for a full export | May go nowhere; free to try |

Scripts: `scripts/ezycourse_export.py` (runs anywhere) and
`scripts/ezycourse_import.py` (runs on the bench via `run_on_site.py`).

---

## Phase A — Export

### Track 1: CSV exports (do this first, ~30 min)

In the EzyCourse admin dashboard:

1. **Students** → filter "All" → Export CSV. Save as
   `ezycourse_export/students/students.csv`.
2. For **each course**: course → Students/Enrollments view → Export CSV
   (include completion status). Save as
   `ezycourse_export/students/enrollments/<Course_Title>.csv`
   (the filename becomes the course title fallback — use underscores for spaces).
3. **Quiz responses** and **sales/orders** CSVs → save anywhere under
   `ezycourse_export/` for the record (not consumed by the importer yet).

Then merge them:

```bash
python3 scripts/ezycourse_export.py --normalize --out ezycourse_export
```

Produces `students/normalized.json` (deduped users + enrollments). Check the
printed counts against the dashboard's student count.

### Track 2: course content + assets (needs a HAR capture first)

1. **Capture:** log into the EzyCourse admin in Chrome → DevTools → Network
   tab → check "Preserve log". Browse: the course list, one course's
   curriculum, and one lesson of each type (video, text, file, quiz). Right
   click in the Network panel → "Save all as HAR with content".
2. **Map endpoints:** from the HAR, find the XHR requests that returned the
   course list, curriculum tree, and lesson detail. Update the `ENDPOINTS`
   dict and `AUTH_STYLE` at the top of `scripts/ezycourse_export.py` to match,
   and copy the `Cookie` header value (or bearer token) from one request.
3. **Run:**

```bash
pip install requests yt-dlp
EZY_COOKIE='<cookie header value>' python3 scripts/ezycourse_export.py \
  --crawl --base-url https://YOURSCHOOL.ezycourse.com --out ezycourse_export
```

Resumable — re-run after failures; existing files are skipped. Videos served
as HLS (`.m3u8`) are downloaded with yt-dlp. Anything that fails lands in
`courses/<id>/assets_failed.json`; fetch those manually from the admin UI.

This is the account owner exporting their own data; still, keep the request
rate gentle (the script sleeps between calls) and run it once, not in a loop.

### Track 3: support ticket (send day one, don't block on it)

Email EzyCourse support:

> We are migrating our school off EzyCourse. Under our data ownership of the
> content we uploaded, please provide: (1) a structured export of all courses
> and lesson content, (2) the original video and file assets we uploaded, and
> (3) full student/enrollment data. Please advise the format and timeline.

Anything they return replaces the matching Track 2 output.

### Export verification

- `manifest.json` counts vs the EzyCourse dashboard (courses, students).
- Open one `courses/<id>/course.json` and confirm chapters/lessons look right.
- Play one downloaded video from `assets/`.

**Back up `ezycourse_export/` somewhere durable before continuing.** This
archive is the escape hatch even if the import is delayed.

---

## Phase B — Video hosting (before import)

Frappe LMS embeds video URLs; it does not host video files. Upload the
exported videos to a host and build a map file:

- **Bunny Stream** (default): create a video library, bulk-upload the
  `assets/*.mp4` files, copy each embed/play URL.
- **YouTube unlisted** (free alternative): upload, copy watch URLs.

Create `video_map.json`:

```json
{
  "https://cdn.ezycourse.com/.../original-url.m3u8": "https://iframe.mediadelivery.net/embed/...",
  "12345": "https://www.youtube.com/watch?v=..."
}
```

Keys are the original EzyCourse asset URL **or** the EzyCourse lesson id.
Unmapped videos import with a visible `[VIDEO PENDING]` placeholder and are
counted in the import summary, so this can be done incrementally.

---

## Phase C — Import

Copy `ezycourse_export/` (and `video_map.json`) to the bench server, then:

```bash
SITE=<federation-site> \
EXPORT_DIR=/home/frappe/ezycourse_export \
VIDEO_MAP=/home/frappe/video_map.json \
IMPORT_PROGRESS=1 \
~/frappe-bench/env/bin/python scripts/run_on_site.py scripts/ezycourse_import.py
```

- Idempotent — safe to re-run (matches by title before inserting).
- Students are created **with welcome emails suppressed**; passwords don't
  migrate, students use "Forgot password" at cutover.
- `IMPORT_PROGRESS=1` marks every lesson complete for students whose
  enrollment CSV shows a finish date or 100% progress. Before relying on it,
  confirm the progress doctype on the installed frappe/lms version
  (`bench console` → `frappe.get_meta("LMS Course Progress").fields`) — field
  names have shifted between releases.
- Final line prints `IMPORT_OK {counts}` including `videos_pending`.

### Import verification

1. `SITE=<site> ...python run_on_site.py scripts/dump_ids.py` — diff the
   course/chapter/lesson tree counts against `manifest.json`.
2. Run `scripts/smoke_test.sh` against one migrated course (login → enroll →
   complete → quiz → certificate).
3. Log in as one migrated student (password reset) and confirm their
   enrollments and progress render in the LMS UI; play one embedded video.
4. `videos_pending` in the import summary should be 0 before cutover.

---

## Cutover checklist

- [ ] Export archive backed up off the bench server
- [ ] All videos mapped (`videos_pending: 0`) and playing
- [ ] Spot-check: 3 courses end-to-end, 5 students' enrollments
- [ ] Announce to students: new URL + use "Forgot password" to set a password
- [ ] Redirect/park the EzyCourse school URL
- [ ] Keep the EzyCourse subscription read-only for one billing cycle as a
      fallback, then cancel
