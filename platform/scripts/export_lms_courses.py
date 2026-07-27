"""Export EVERYTHING for every LMS course to a portable bundle.

Pulls each course out of the running Frappe LMS site — course meta + image,
chapters, lessons (full EditorJS content/body + video refs), quizzes and their
questions/options/answers, and every referenced image/file asset — into a
self-contained directory. This is how a new project "gets the courses": run this
on the server, then copy the output folder.

Runs through run_on_site.py on the bench:

    SITE=demo.combatsportseducation.com \
    EXPORT_DIR=/home/frappe/lms_export \
    ~/frappe-bench/env/bin/python run_on_site.py export_lms_courses.py

Output layout (EXPORT_DIR):
    manifest.json                      counts + course list
    files_index.json                   original file_url -> local assets/ path
    courses/<course>/course.json       full nested course: course + chapters +
                                       lessons + quizzes/questions (as_dict fidelity)
    courses/<course>/assets/           every image/attachment the course references

Notes:
  - Videos are external (Bunny Stream / YouTube) — captured as URLs inside the
    lesson data, not downloaded.
  - The JSON keeps full Frappe field fidelity (as_dict), so it round-trips: it can
    be re-imported with import_bundle.py, or read directly by another system.
  - Read-only: never modifies the site.
"""

import os
import re
import json
import shutil

import frappe

frappe.set_user("Administrator")

EXPORT_DIR = os.environ.get("EXPORT_DIR") or "/home/frappe/lms_export"
COURSES_DIR = os.path.join(EXPORT_DIR, "courses")
os.makedirs(COURSES_DIR, exist_ok=True)

_FILE_URL_RE = re.compile(r"(?:/private)?/files/[^\s\"'\\)<>]+")


def _slug(name):
    return re.sub(r"[^A-Za-z0-9._-]+", "_", (name or "course")).strip("_") or "course"


def _doc(doctype, name):
    """Full document as a plain dict (all fields + child tables), or None."""
    try:
        return frappe.get_doc(doctype, name).as_dict()
    except Exception:
        return None


def _child_names(parent_dict, table_field, link_field):
    """Pull linked names out of a child table on a parent dict."""
    out = []
    for row in (parent_dict.get(table_field) or []):
        val = row.get(link_field) if isinstance(row, dict) else None
        if val:
            out.append(val)
    return out


def _copy_asset(file_url, assets_dir, index):
    """Copy a /files/ or /private/files/ asset into assets_dir. Returns local rel path."""
    if not file_url or file_url in index:
        return index.get(file_url)
    rel = file_url.lstrip("/")  # files/... or private/files/...
    src = os.path.join(frappe.get_site_path("public" if rel.startswith("files/") else ""), rel)
    if not os.path.exists(src):
        # try the raw site path (covers private/files)
        src = os.path.join(frappe.get_site_path(), rel)
    if not os.path.exists(src):
        return None
    os.makedirs(assets_dir, exist_ok=True)
    base = os.path.basename(rel)
    dest = os.path.join(assets_dir, base)
    try:
        shutil.copy2(src, dest)
    except Exception:
        return None
    local = "assets/" + base
    index[file_url] = local
    return local


def _harvest_files(obj, assets_dir, index):
    """Find every /files/ url anywhere in a JSON-able object and copy the assets."""
    for m in _FILE_URL_RE.finditer(json.dumps(obj, default=str)):
        _copy_asset(m.group(0), assets_dir, index)


def _quizzes_for_lesson(lesson_dict):
    """Resolve any quizzes a lesson references (EditorJS quiz blocks / quiz field)."""
    names = set()
    blob = json.dumps(lesson_dict, default=str)
    # LMS quiz blocks embed the quiz docname; also a possible 'quiz' field.
    for fld in ("quiz", "quiz_id"):
        if lesson_dict.get(fld):
            names.add(lesson_dict[fld])
    # scan content for quiz references (best-effort)
    for m in re.finditer(r'"quiz"\s*:\s*"([^"]+)"', blob):
        names.add(m.group(1))
    quizzes = []
    for qn in names:
        if frappe.db.exists("LMS Quiz", qn):
            qd = _doc("LMS Quiz", qn)
            if qd:
                # expand each question fully
                q_names = _child_names(qd, "questions", "question")
                qd["_questions_expanded"] = [_doc("LMS Question", q) for q in q_names]
                quizzes.append(qd)
    return quizzes


def export_course(course_name, index_all):
    course = _doc("LMS Course", course_name)
    if not course:
        return None
    cdir = os.path.join(COURSES_DIR, _slug(course_name))
    assets_dir = os.path.join(cdir, "assets")
    os.makedirs(cdir, exist_ok=True)

    chapters_out = []
    for chap_name in _child_names(course, "chapters", "chapter"):
        chap = _doc("Course Chapter", chap_name)
        if not chap:
            continue
        lessons_out = []
        for lesson_name in _child_names(chap, "lessons", "lesson"):
            lesson = _doc("Course Lesson", lesson_name)
            if not lesson:
                continue
            lesson["_quizzes"] = _quizzes_for_lesson(lesson)
            lessons_out.append(lesson)
        chap["_lessons"] = lessons_out
        chapters_out.append(chap)

    bundle = {"course": course, "chapters": chapters_out}
    # copy every referenced image/file for the whole course
    _harvest_files(bundle, assets_dir, index_all_scoped := {})
    index_all.update(index_all_scoped)

    with open(os.path.join(cdir, "course.json"), "w", encoding="utf-8") as fh:
        json.dump(bundle, fh, indent=2, default=str, ensure_ascii=False)

    return {
        "course": course_name,
        "title": course.get("title"),
        "chapters": len(chapters_out),
        "lessons": sum(len(c.get("_lessons", [])) for c in chapters_out),
        "quizzes": sum(len(l.get("_quizzes", [])) for c in chapters_out for l in c.get("_lessons", [])),
        "dir": os.path.relpath(cdir, EXPORT_DIR),
    }


def main():
    course_names = [c.name for c in frappe.get_all("LMS Course")]
    index_all = {}
    summaries = []
    for cn in course_names:
        s = export_course(cn, index_all)
        if s:
            summaries.append(s)
            print("  +", s["title"], "-> chapters", s["chapters"], "lessons", s["lessons"], "quizzes", s["quizzes"])

    with open(os.path.join(EXPORT_DIR, "files_index.json"), "w", encoding="utf-8") as fh:
        json.dump(index_all, fh, indent=2, ensure_ascii=False)
    manifest = {
        "site": frappe.local.site,
        "courses": summaries,
        "totals": {
            "courses": len(summaries),
            "lessons": sum(s["lessons"] for s in summaries),
            "quizzes": sum(s["quizzes"] for s in summaries),
            "assets": len(index_all),
        },
    }
    with open(os.path.join(EXPORT_DIR, "manifest.json"), "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2, ensure_ascii=False)
    print("EXPORT_OK", json.dumps(manifest["totals"]), "->", EXPORT_DIR)


main()
