# Frappe LMS → cseLMS (Next.js/Supabase) — migration handoff

For the Claude Code session building the cseLMS importer. Pull courses out of the
live Frappe LMS via its **auto-REST API** (token auth) — no SSH, attachments come
over the same channel. Companion script: `platform/handoff/import-frappe.ts`
(read-only extractor + dry-run reporter that writes a normalized bundle).

Source site: `https://demo.combatsportseducation.com`
Token: Desk → the user's profile → **API Access → Generate Keys** (a read-only role
on that user is enough). Use header `Authorization: token <api_key>:<api_secret>`.

## Tightened mapping table

| Frappe | cseLMS | Notes / gotchas |
| --- | --- | --- |
| `LMS Course` (title, description, image) | `courses` (+ cover re-hosted to storage) | `image` is a `/files/…` URL — fetch with the token, re-upload to Supabase storage. |
| `Course Chapter` | `sections` | Ordered via the course's `chapters` **child table**, not a top-level list. |
| `Course Lesson.content` | `lessons` + `lesson_blocks` | **`content` is EditorJS block JSON, NOT markdown/HTML.** Map block-by-block: `paragraph`→rich-text, `image`→image block (re-host `/files/` url), `embed`→video block. Do not run it through a markdown parser. |
| video in a lesson | `lesson_blocks` (video) | **Videos are Bunny Stream / YouTube embed URLs — NOT self-hosted files.** There is no `/files/*.mp4` to move. Decide: keep the Bunny/YouTube embed, or re-ingest from Bunny → Mux. Only images/PDFs live in Frappe storage. |
| `LMS Quiz` + `LMS Question` | `quizzes` / `quiz_questions` | **The lesson→quiz link lives INSIDE the EditorJS blocks** (a `quiz` block whose data references the `LMS Quiz` docname; older content uses `{{ Quiz("name") }}` in text). Scan blocks for quiz refs, then fetch the quiz + its `questions` child table. Question fields: `question`, `type`/`question_type`, `option_1..4` + `is_correct_1..4`, `explanation`. |
| `User` + `LMS Enrollment` (+ `LMS Course Progress`) | invited users + `memberships` + `enrollments` (progress carried) | **Migrated members have NO passwords** — invite / password-reset flow at cutover (email must be live). Progress is per-lesson in `LMS Course Progress` (member, lesson, status=Complete). |

## Five corrections baked in (why the naive mapping breaks)

1. **Video ≠ self-hosted.** Bunny/YouTube embeds. Nothing to re-upload for video.
2. **Lesson body = EditorJS blocks, not markdown/HTML.** Map blocks, don't parse markdown.
3. **Quiz→lesson link is inside the blocks**, not a foreign key. Scan for it.
4. **No passwords carry over.** Invite/reset at cutover; needs email delivery live first.
5. **Private files need the token** to fetch bytes (`/private/files/…`); public `/files/…` are plain GETs. Use the token for all asset fetches.

## API mechanics (the tree is child tables — list, then get)

```text
GET /api/resource/LMS Course?limit_page_length=0            → course names
GET /api/resource/LMS Course/<name>                         → full doc incl. `chapters` child rows
  each chapter row → Course Chapter name
GET /api/resource/Course Chapter/<name>                     → `lessons` child rows
  each lesson row → Course Lesson name
GET /api/resource/Course Lesson/<name>                      → `content` (EditorJS JSON)
GET /api/resource/LMS Quiz/<name>                           → `questions` child rows
GET /api/resource/LMS Enrollment?limit_page_length=0&fields=["member","course"]
GET /api/resource/LMS Course Progress?limit_page_length=0&fields=["member","lesson","status"]
```

Always pass `limit_page_length=0` — the API paginates to 20 rows by default.

## Recommended shape

Do the **one-off script first** (prove the mapping against real data: dry-run report →
approve → import into one school). *Then* productize into an "Import from Frappe" wizard
in the super-admin portal — this is white-label, so client onboarding will repeat, and
the wizard is the natural home. Don't debug the mapping through a UI.

## One thing that is NOT a clean 1:1

`memberships` (recurring) do **not** exist in Frappe — Frappe LMS payments are
one-time-per-course. Enrollments carry over; recurring memberships are net-new and
depend on a product decision (what a membership grants; Stripe subscription model).
Don't let the table imply memberships transfer.
