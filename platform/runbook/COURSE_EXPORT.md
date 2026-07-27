# Course Export — pull every built course (content, images, quizzes, everything)

How a new project "gets the courses" that were built on the live site: run one
read-only script on the server, copy the output folder. Videos stay hosted on
Bunny Stream / YouTube (captured as URLs, not downloaded). Round-trips back into
any Frappe LMS site via `import_bundle.py`, or read the JSON directly.

Script: `platform/scripts/export_lms_courses.py` (read-only — never modifies the site).

---

## Run it (on the server)

```bash
ssh root@5.78.185.237
sudo -iu frappe
cd ~/frappe-bench

# 1. Get the script onto the bench (same rsync pattern as the other cse scripts).
#    Clone the branch to /tmp, then copy the scripts dir in:
rm -rf /tmp/cse && git clone --depth 1 -b claude/cse-platform-build \
  https://github.com/wesleyfarnam/cse /tmp/cse
rsync -a /tmp/cse/platform/scripts/ ~/frappe-bench/scripts/

# 2. Export every course.
cd ~/frappe-bench/scripts
SITE=demo.combatsportseducation.com \
EXPORT_DIR=/home/frappe/lms_export \
~/frappe-bench/env/bin/python run_on_site.py export_lms_courses.py
```

It prints one line per course and ends with:
`EXPORT_OK {"courses":N,"lessons":N,"quizzes":N,"assets":N} -> /home/frappe/lms_export`

## Pull the folder down (from the new machine)

```bash
rsync -avz root@5.78.185.237:/home/frappe/lms_export ./lms_export
```

---

## What you get

```
lms_export/
├── manifest.json          # site, per-course counts, grand totals
├── files_index.json       # original /files/ URL  ->  local assets/ path
└── courses/
    └── <course-slug>/
        ├── course.json     # full nested course:
        │                    #   course meta + image
        │                    #   → chapters
        │                    #     → lessons (complete EditorJS body/content, video refs)
        │                    #       → quizzes → questions → options/answers
        └── assets/          # every image / attachment the course references, copied in
```

- **`course.json`** is `frappe.get_doc(...).as_dict()` for every record — full field
  fidelity, nothing summarized or dropped. Standard EditorJS block content, plain JSON.
- **Images / attachments** (course thumbnails, lesson images, question images) are
  physically copied into each course's `assets/`. `files_index.json` maps the original
  URL → local file so an importer can rewrite links.
- **Videos** are NOT downloaded — they live on Bunny Stream / YouTube. Lesson data keeps
  the Bunny/YouTube URL + video IDs, which is all a new site needs (videos stay hosted).
- **Quizzes** are fully expanded: each lesson's `_quizzes` array has the quiz doc plus
  `_questions_expanded` (every question, its options, correct answers).

## How a new project consumes it

1. **Re-import into another Frappe LMS site** — `platform/scripts/import_bundle.py` reads
   this format, re-uploads `assets/`, rewrites file URLs, re-creates the courses. This is
   the "clone courses into a new federation" path the console's content step uses.
2. **Read it directly** — any non-Frappe system can parse `course.json` without Frappe at
   all. Shape is documented in `platform/scripts/BUNDLE_SCHEMA.md`.

## Caveat to verify

Quiz-block detection scans lesson content for embedded quiz references. Cross-check the
printed `quizzes` count against `/app/lms-quiz` in Desk. If a count looks low, a course
wires quizzes in an unusual way — widen the resolver in `_quizzes_for_lesson`. For
standard LMS quiz blocks it captures them all.
