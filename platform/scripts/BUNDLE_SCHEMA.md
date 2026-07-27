# Normalized Migration Bundle — Schema

The **normalized migration bundle** is the single on-disk format that any *source
adapter* produces and the *general importer* consumes. It is deliberately defined
to match, field-for-field, what `ezycourse_import.py` already reads, so the
EzyCourse export archive that ran in production is **already a valid bundle**.

- **Adapters** (EzyCourse today; generic CSV, Teachable, Thinkific later) write a
  bundle directory.
- **The importer** (`ezycourse_import.py` today, a general importer later) walks
  the bundle and creates LMS Courses, Chapters, Lessons, Files, Users,
  Enrollments, and optional Progress via `run_on_site.py`.

EzyCourse is simply the first adapter. Nothing here is EzyCourse-specific except
the historical names of the producing scripts.

---

## 1. Directory layout

```
<bundle>/
├── manifest.json                 # optional; provenance + counts
├── courses/
│   └── <course_id>/              # one dir per course; <course_id> is filesystem-safe
│       ├── course.json           # REQUIRED: course + chapters + lessons (see §3)
│       ├── assets/               # optional: lesson attachments, named "<lesson_id>_<file>"
│       │   ├── 4021_slides.pdf
│       │   └── 4021_worksheet.docx
│       └── assets_failed.json    # optional: adapter's record of assets it couldn't fetch
└── students/
    ├── normalized.json           # REQUIRED for users/enrollments/progress (see §5)
    ├── students.csv              # adapter INPUT only — not read by the importer
    └── enrollments/*.csv         # adapter INPUT only — not read by the importer
```

**What the importer actually globs:**

- `courses/*/course.json` — the sole content input (via `EXPORT_DIR.glob("courses/*/course.json")`).
- `<course_dir>/assets/<lesson_id>_*` — per-lesson attachments (via `assets_dir.glob(f"{lid}_*")`).
- `students/normalized.json` — users, enrollments, progress.

Everything else (`manifest.json`, `students.csv`, `enrollments/*.csv`,
`assets_failed.json`) is **producer-side or informational** and is ignored by the
importer. `students.csv` / `enrollments/*.csv` are the adapter's raw inputs that
`ezycourse_export.py --normalize` merges into `normalized.json`; a non-CSV adapter
may skip them entirely and just emit `normalized.json`.

The `video_map.json` (referenced in the task) is **not read from inside the
bundle**. It is passed to the importer out-of-band via the `VIDEO_MAP` env var
pointing at any JSON file (see §6). It is conventionally stored alongside the
bundle but is not part of the required tree.

---

## 2. Field-resolution conventions (important)

The importer is intentionally lenient — for most fields it accepts the **first
non-empty** value from a list of candidate keys (`first(d, *keys)`). Adapters
SHOULD emit the **preferred** key; the alternates exist so heterogeneous source
payloads validate without transformation.

- Emails are always lowercased by the importer; adapters need not pre-lowercase.
- URLs are discovered structurally: `collect_urls()` recursively walks every
  string value in a lesson object and keeps any `http…` URL whose path ends in a
  known media/doc extension (`mp4 m3u8 mov webm pdf png jpe?g gif mp3 zip
  docx? pptx? xlsx?`). So a lesson can carry asset/video URLs under *any* key
  name and they will still be found.

---

## 3. `courses/<id>/course.json`

Top-level object with three keys:

```json
{
  "course":   { ...course object... },     // §3.1  (REQUIRED)
  "chapters": [ ...chapter objects... ],    // §3.2  (REQUIRED, may be [])
  "lessons":  [ ...lesson objects... ]      // §3.3  (REQUIRED, may be [])
}
```

Lessons are stored **flat** at the top level (not nested inside chapters). Each
lesson is bound to its chapter by a `_chapter_id` back-reference that must match a
chapter's `id` (see §3.3 / §4).

### 3.1 Course object (`.course`)

| Field | Required | Notes |
|---|---|---|
| `title` | required* | Preferred. Falls back to `name`, then `"Untitled Course"`. This is the LMS Course match key (deduped by title). |
| `id` | recommended | Preferred; falls back to `course_id`. Used only to build `course_title_by_ezy_id` so numeric-id enrollments can resolve. |
| `short_description` | optional | Preferred for LMS `short_introduction`; falls back to `subtitle`, `excerpt`; HTML-stripped, truncated to 200 chars, defaults to the title. |
| `description` | optional | Preferred for LMS `description` (HTML kept); falls back to `about`, then `<p>{title}</p>`. |

*`title` (or `name`) is effectively required — without it the course imports as
"Untitled Course". Every imported course is created `published: 1` with
`Administrator` as instructor.

### 3.2 Chapter object (element of `.chapters`)

| Field | Required | Notes |
|---|---|---|
| `id` | required | Join key: matched against each lesson's `_chapter_id` (both stringified). |
| `title` | recommended | Preferred; falls back to `name`, then `"Chapter {index}"` (1-based order in the array). Chapters dedupe by `(title, course)`. |

Chapter order in the array becomes chapter order in the course.

### 3.3 Lesson object (element of `.lessons`)

| Field | Required | Notes |
|---|---|---|
| `_chapter_id` | required | Back-reference to the owning chapter's `id`. Lessons whose `_chapter_id` matches no chapter are silently dropped. |
| `id` | recommended | Preferred; falls back to `lesson_id`. Used for the `VIDEO_MAP` lesson-id key (§6) and to match `assets/<id>_*` (§4). |
| `title` | recommended | Preferred; falls back to `name`, then `"Untitled Lesson"`. Lessons dedupe by `(title, course)`. |
| `type` | optional | If `"video"` and no video URL was found, a `[VIDEO PENDING]` placeholder is still emitted. Otherwise unused. |
| `content` | optional | Lesson body **(HTML)**. Preferred; falls back to `description`, `body`, `text`. Split into EditorJS paragraph blocks on block tags. |
| `video_url` | optional | Explicit primary video reference (see §6). Prepended ahead of structurally-discovered video URLs. |
| *(any key holding a URL)* | optional | Attachment/video URLs may live under any field name; discovered by `collect_urls()` (§2). Video-extension URLs become video blocks; non-video URLs in `assets/` become Files (§4). |

**Lesson body → LMS content.** The importer converts each lesson into an EditorJS
document `{"blocks":[...]}` stored on `Course Lesson.content`:
1. For each video URL, an `embed` block if the video is mapped, else a
   `paragraph` `[VIDEO PENDING]` placeholder (and `videos_pending` is counted).
2. Then `paragraph` blocks from the HTML body.
3. If nothing was produced, a single paragraph of the lesson title.

---

## 4. Assets

Lesson attachments are plain files under `courses/<course_id>/assets/`, named
with the **owning lesson's id as a prefix**:

```
assets/<lesson_id>_<original_filename>
```

Import rules (`attach_assets`):
- The importer globs `assets/<lesson_id>_*` for each lesson.
- Files whose name matches a **video** extension (`mp4 m3u8 mov webm`) are
  **skipped** — video is hosted externally, never uploaded to Frappe (see §6).
- All other files are attached to the `Course Lesson` as public Frappe `File`
  docs (deduped by `(attached_to, file_name)`), incrementing `files`.

Assets are entirely optional; a bundle with no `assets/` dir imports fine.

---

## 5. `students/normalized.json`

Single object with two arrays. Read only if the file exists.

```json
{
  "users": [
    { "email": "a@x.com", "first_name": "Ann", "last_name": "Lee" }
  ],
  "enrollments": [
    {
      "email": "a@x.com",
      "course": "Intro to Widgets",
      "start_date": "2025-01-04",
      "finish_date": "2025-03-01",
      "progress": "100%"
    }
  ]
}
```

### 5.1 User (element of `.users`)

| Field | Required | Notes |
|---|---|---|
| `email` | **required** | Lowercased; the User primary key. Rows without it are unusable. |
| `first_name` | optional | Defaults to the email if empty. |
| `last_name` | optional | Defaults to `""`. |

Users are created with role `LMS Student`, `send_welcome_email: 0`, no welcome
mail. Deduped by email (existing `User` docs are left untouched).

### 5.2 Enrollment (element of `.enrollments`)

| Field | Required | Notes |
|---|---|---|
| `email` | **required** | Lowercased; must resolve to a `User`, else the row is skipped (`ENROLLMENT_SKIPPED`). |
| `course` | **required** | Resolved to an LMS Course by **title first**, then by source id via `course_title_by_ezy_id`. Unresolvable → skipped. |
| `start_date` | optional | Informational; not currently written to the Enrollment doc. |
| `finish_date` | optional | Completion signal (see §5.3). |
| `progress` | optional | Completion signal (see §5.3). |

Enrollment docs dedupe by `(member, course)`.

### 5.3 Progress

There is **no separate progress file**; progress is derived from the enrollment's
completion signal and applied only when the importer runs with `IMPORT_PROGRESS=1`.

An enrollment counts as **completed** when either:
- `finish_date` is non-empty, **or**
- `progress`, trimmed of a trailing `%`, is one of `100`, `Completed`, `complete`.

For a completed enrollment, every `Course Lesson` in that course gets an
`LMS Course Progress` row with `status: "Complete"` (deduped by
`(member, lesson)`). Without `IMPORT_PROGRESS=1`, completion signals are ignored.

---

## 6. Video mapping (`video_map.json` / `VIDEO_MAP`)

Frappe LMS does not host video, so video is never uploaded from the bundle.
Instead the importer takes an **out-of-band** JSON map (env `VIDEO_MAP` → path)
that translates each source video into an embeddable URL on the new host
(Bunny/YouTube/etc.):

```json
{
  "https://school.ezycourse.com/media/abc.m3u8": "https://iframe.mediadelivery.net/embed/…",
  "4021": "https://www.youtube.com/watch?v=…"
}
```

A lesson references a video **two ways**, and the map is keyed to match either:

1. **By original URL** — the video URL as it appears anywhere in the lesson
   object (via `video_url` or any URL discovered by `collect_urls`). Key the map
   by that exact URL string.
2. **By lesson id** — the stringified lesson `id`/`lesson_id`. Use this when the
   source stream URL wasn't captured (e.g. HLS behind auth, or a
   `type: "video"` lesson with no URL).

Resolution per video: `VIDEO_MAP.get(original_url) or VIDEO_MAP.get(lesson_id)`.
- **Hit** → an `embed` block (`service: "youtube"` if the URL contains `youtu`,
  else `"url"`).
- **Miss** → a visible `[VIDEO PENDING]` paragraph naming the original URL (or
  "see assets dir"), and `videos_pending` is incremented.

The map is optional; with no map every video lesson gets a `[VIDEO PENDING]`
placeholder and can be backfilled by re-running (the importer is idempotent).

---

## 7. `manifest.json` (optional, informational)

Provenance/counters written by the producing adapter; not read by the importer.

```json
{
  "source": "https://YOURSCHOOL.ezycourse.com",
  "exported_at": "2026-07-22 12:00:00",
  "students": { "users": 812, "enrollments": 1340 },
  "content":  { "courses": 12, "lessons": 480, "assets_ok": 512, "assets_failed": 3 }
}
```

Adapters SHOULD write it for auditability; the shape is free-form.

---

## 8. Minimum valid bundle

The smallest bundle the importer accepts:

```
<bundle>/courses/<any-id>/course.json     # {"course":{"title":…},"chapters":[…],"lessons":[…]}
```

`students/normalized.json` is required only if you want users/enrollments/progress.
`manifest.json`, `assets/`, and the video map are all optional.

---

## 9. Producing a compliant bundle from a new source (adapter contract)

A new adapter (generic CSV, Teachable, Thinkific, …) is compliant if it writes:

1. `courses/<id>/course.json` per course, with `course` / `chapters` / `lessons`
   as in §3 — using the **preferred** key names (`title`, `id`, `content`,
   `video_url`, `_chapter_id`) and binding lessons to chapters via `_chapter_id`.
2. `assets/<lesson_id>_<file>` for any downloadable attachments (§4).
3. `students/normalized.json` with `users` + `enrollments` (§5), emails resolvable
   and courses referenced by the same `title` used in `course.json`.
4. Video references either as URLs inside lessons or resolvable by lesson id, to
   be paired with a `VIDEO_MAP` at import time (§6).

No importer changes are needed: EzyCourse's `--normalize`/`--crawl` output is one
concrete instance of this contract, and the existing `ezycourse_import.py`
consumes any bundle that follows it.
```
