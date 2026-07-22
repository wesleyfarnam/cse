"""Import a normalized migration bundle into Frappe LMS (source-neutral).

This is the GENERAL importer. It reads a *normalized bundle* exactly as
defined in platform/scripts/BUNDLE_SCHEMA.md and loads it into a Frappe LMS
site. Any source adapter (EzyCourse today; generic CSV, Teachable, Thinkific
later) produces the same bundle layout, so a single importer consumes them
all. EzyCourse is simply the first adapter — its export archive is already a
valid bundle, and ezycourse_import.py is the legacy EzyCourse-specific path
that this script supersedes.

Run via run_on_site.py on the bench (same invocation as ezycourse_import.py):
    SITE=<site> EXPORT_DIR=/path/to/bundle \
    ~/frappe-bench/env/bin/python run_on_site.py import_bundle.py

Env:
    EXPORT_DIR       normalized bundle directory (required). BUNDLE_DIR is
                     accepted as a source-neutral alias; EXPORT_DIR wins if
                     both are set.
    VIDEO_MAP        optional JSON file mapping an original source video URL
                     (or "<lesson_id>") -> embed URL on the new video host
                     (Bunny/YouTube/etc.). Lessons without a mapping get a
                     visible [VIDEO PENDING] placeholder.
    IMPORT_PROGRESS  set to 1 to also mark lessons complete for students
                     whose enrollment shows a finish date / 100% progress.

Idempotent: safe to re-run; matches existing docs before inserting. Frappe LMS
does not host video, so video files in the bundle are never uploaded — they
are resolved to external embed URLs via VIDEO_MAP (see BUNDLE_SCHEMA.md §6).
"""

import json
import os
import re
from pathlib import Path

import frappe
from frappe.utils.file_manager import save_file

frappe.set_user("Administrator")

# EXPORT_DIR is the historical name (matches ezycourse_import.py); BUNDLE_DIR
# is a source-neutral alias. EXPORT_DIR takes precedence when both are present.
BUNDLE_DIR = os.environ.get("EXPORT_DIR") or os.environ.get("BUNDLE_DIR")
if not BUNDLE_DIR:
    raise SystemExit("EXPORT_DIR (or BUNDLE_DIR) is required: path to a normalized bundle")
EXPORT_DIR = Path(BUNDLE_DIR)

VIDEO_MAP = {}
if os.environ.get("VIDEO_MAP"):
    VIDEO_MAP = json.loads(Path(os.environ["VIDEO_MAP"]).read_text())
IMPORT_PROGRESS = os.environ.get("IMPORT_PROGRESS") == "1"

stats = {"courses": 0, "chapters": 0, "lessons": 0, "files": 0,
         "users": 0, "enrollments": 0, "progress": 0, "videos_pending": 0}


def first(d, *keys, default=""):
    for k in keys:
        v = d.get(k)
        if v not in (None, ""):
            return v
    return default


def strip_html(text):
    return re.sub(r"<[^>]+>", " ", text or "").strip()


def html_paragraphs(html):
    """Bundle lesson bodies are HTML; EditorJS paragraphs accept inline
    markup, so split on block tags and keep the rest as-is."""
    parts = re.split(r"</?(?:p|div|br|h[1-6]|li)[^>]*>", html or "", flags=re.I)
    return [{"type": "paragraph", "data": {"text": p.strip()}} for p in parts if strip_html(p)]


IS_VIDEO = re.compile(r"\.(mp4|m3u8|mov|webm)(\?|$)", re.I)


def collect_urls(obj, found=None):
    if found is None:
        found = []
    if isinstance(obj, dict):
        for v in obj.values():
            collect_urls(v, found)
    elif isinstance(obj, list):
        for v in obj:
            collect_urls(v, found)
    elif isinstance(obj, str) and obj.startswith("http") and " " not in obj:
        if re.search(r"\.(mp4|m3u8|mov|webm|pdf|png|jpe?g|gif|mp3|zip|docx?|pptx?|xlsx?)(\?|$)", obj, re.I):
            found.append(obj)
    return found


def lesson_blocks(lesson):
    blocks = []
    lid = str(first(lesson, "id", "lesson_id"))
    body = first(lesson, "content", "description", "body", "text")
    video_urls = [u for u in collect_urls(lesson) if IS_VIDEO.search(u)]
    if first(lesson, "video_url") and lesson["video_url"] not in video_urls:
        video_urls.insert(0, lesson["video_url"])
    if not video_urls and first(lesson, "type") == "video":
        video_urls = [""]  # video lesson whose stream URL wasn't captured

    for url in video_urls:
        embed = VIDEO_MAP.get(url) or VIDEO_MAP.get(lid)
        if embed:
            blocks.append({"type": "embed", "data": {"service": "youtube" if "youtu" in embed else "url",
                                                     "source": embed, "embed": embed}})
        else:
            stats["videos_pending"] += 1
            blocks.append({"type": "paragraph", "data": {
                "text": f"<b>[VIDEO PENDING]</b> original: {url or 'see assets dir'}"}})
    blocks.extend(html_paragraphs(body))
    if not blocks:
        blocks = [{"type": "paragraph", "data": {"text": first(lesson, "title", "name", default=" ")}}]
    return blocks


def ensure_course(detail):
    title = first(detail, "title", "name", default="Untitled Course")
    name = frappe.db.exists("LMS Course", {"title": title})
    if not name:
        name = frappe.get_doc({
            "doctype": "LMS Course",
            "title": title,
            "short_introduction": strip_html(first(detail, "short_description", "subtitle", "excerpt"))[:200]
                                  or title,
            "description": first(detail, "description", "about", default=f"<p>{title}</p>"),
            "published": 1,
            "instructors": [{"instructor": "Administrator"}],
        }).insert(ignore_permissions=True).name
        stats["courses"] += 1
    return name


def ensure_chapter(title, course_name):
    name = frappe.db.exists("Course Chapter", {"title": title, "course": course_name})
    if not name:
        name = frappe.get_doc({"doctype": "Course Chapter", "title": title,
                               "course": course_name}).insert(ignore_permissions=True).name
        stats["chapters"] += 1
    course = frappe.get_doc("LMS Course", course_name)
    if not any(c.chapter == name for c in course.chapters):
        course.append("chapters", {"chapter": name})
        course.save(ignore_permissions=True)
    return name


def ensure_lesson(title, content, chapter_name, course_name):
    name = frappe.db.exists("Course Lesson", {"title": title, "course": course_name})
    if not name:
        name = frappe.get_doc({"doctype": "Course Lesson", "title": title, "chapter": chapter_name,
                               "course": course_name, "content": content}).insert(ignore_permissions=True).name
        stats["lessons"] += 1
    ch = frappe.get_doc("Course Chapter", chapter_name)
    if not any(le.lesson == name for le in ch.lessons):
        ch.append("lessons", {"lesson": name})
        ch.save(ignore_permissions=True)
    return name


def attach_assets(lesson_name, lesson, course_dir):
    assets_dir = course_dir / "assets"
    if not assets_dir.is_dir():
        return
    lid = str(first(lesson, "id", "lesson_id"))
    for path in assets_dir.glob(f"{lid}_*"):
        if IS_VIDEO.search(path.name):
            continue  # videos go to the external host, not Frappe files
        if frappe.db.exists("File", {"attached_to_doctype": "Course Lesson",
                                     "attached_to_name": lesson_name, "file_name": path.name}):
            continue
        save_file(path.name, path.read_bytes(), "Course Lesson", lesson_name, is_private=0)
        stats["files"] += 1


# ---------------------------------------------------------------- courses --
# Maps a source-specific course id -> the created LMS Course name, so that
# enrollments referencing a numeric/source id (rather than a title) resolve.
course_name_by_source_id = {}
for course_json in sorted(EXPORT_DIR.glob("courses/*/course.json")):
    payload = json.loads(course_json.read_text())
    detail = payload.get("course") or {}
    course_name = ensure_course(detail)
    course_name_by_source_id[str(first(detail, "id", "course_id"))] = course_name

    lessons_by_chapter = {}
    for lesson in payload.get("lessons") or []:
        lessons_by_chapter.setdefault(str(lesson.get("_chapter_id")), []).append(lesson)

    for idx, chapter in enumerate(payload.get("chapters") or [], start=1):
        ch_title = first(chapter, "title", "name", default=f"Chapter {idx}")
        ch_name = ensure_chapter(ch_title, course_name)
        for lesson in lessons_by_chapter.get(str(chapter.get("id")), []):
            l_title = first(lesson, "title", "name", default="Untitled Lesson")
            content = json.dumps({"blocks": lesson_blocks(lesson)})
            l_name = ensure_lesson(l_title, content, ch_name, course_name)
            attach_assets(l_name, lesson, course_json.parent)
    print("COURSE_IMPORTED", course_name)

# ----------------------------------------------------- students/enrollments --
normalized_path = EXPORT_DIR / "students" / "normalized.json"
if normalized_path.exists():
    data = json.loads(normalized_path.read_text())

    for u in data.get("users", []):
        email = u["email"].lower()
        if not frappe.db.exists("User", email):
            user = frappe.get_doc({"doctype": "User", "email": email,
                                   "first_name": u.get("first_name") or email,
                                   "last_name": u.get("last_name") or "",
                                   "send_welcome_email": 0,
                                   "roles": [{"role": "LMS Student"}]})
            user.flags.no_welcome_mail = True
            user.insert(ignore_permissions=True)
            stats["users"] += 1

    for e in data.get("enrollments", []):
        email = e["email"].lower()
        course_name = (frappe.db.get_value("LMS Course", {"title": e["course"]})
                       or course_name_by_source_id.get(str(e["course"])))
        if not course_name or not frappe.db.exists("User", email):
            print("ENROLLMENT_SKIPPED", email, e["course"])
            continue
        if not frappe.db.exists("LMS Enrollment", {"member": email, "course": course_name}):
            frappe.get_doc({"doctype": "LMS Enrollment", "member": email,
                            "course": course_name}).insert(ignore_permissions=True)
            stats["enrollments"] += 1

        completed = bool(e.get("finish_date")) or str(e.get("progress", "")).strip().rstrip("%") in ("100", "Completed", "complete")
        if IMPORT_PROGRESS and completed:
            for lesson in frappe.get_all("Course Lesson", filters={"course": course_name}, pluck="name"):
                if not frappe.db.exists("LMS Course Progress", {"member": email, "lesson": lesson}):
                    frappe.get_doc({"doctype": "LMS Course Progress", "member": email,
                                    "lesson": lesson, "status": "Complete",
                                    "course": course_name}).insert(ignore_permissions=True)
                    stats["progress"] += 1

frappe.db.commit()
print("IMPORT_OK", json.dumps(stats))
