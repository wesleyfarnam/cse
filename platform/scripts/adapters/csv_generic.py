"""Generic CSV adapter — map a simple 4-file CSV layout into the normalized bundle.

This adapter lets any source that can produce plain CSVs (a spreadsheet export,
a hand-built migration, a one-off dump from a platform without tooling) feed the
same importer EzyCourse uses. It is **standalone stdlib Python** (``csv`` +
``json`` only) — no ``frappe`` and no third-party deps.

The source is a directory holding up to four files. Only ``courses.csv`` is
strictly required; the others are optional and produce an empty section when
absent.

===========================================================================
EXPECTED CSV FILES AND COLUMNS  (header row required; matching is
case-insensitive and trims surrounding whitespace)
===========================================================================

courses.csv                                     (REQUIRED)
---------------------------------------------------------------------------
    course_id           REQUIRED  unique id for the course; becomes the
                                  courses/<course_id>/ directory name and the
                                  join key for lessons.csv / enrollments.csv.
    title               REQUIRED  course title (the importer's dedupe/match key).
    short_description   optional  plain-text blurb (LMS short_introduction).
    description         optional  full description, HTML allowed (LMS description).

lessons.csv                                     (optional)
---------------------------------------------------------------------------
    course_id           REQUIRED  FK -> courses.csv.course_id.
    lesson_id           REQUIRED  unique id within the course; used for the
                                  VIDEO_MAP lesson-id key and asset prefixes.
    title               REQUIRED  lesson title.
    chapter_id          optional  groups lessons into a chapter; blank -> a
                                  single default chapter per course.
    chapter_title       optional  display name for the chapter (first non-empty
                                  value seen for a chapter_id wins). Defaults to
                                  "Chapter N" in first-seen order.
    content             optional  lesson body, HTML allowed.
    video_url           optional  primary video URL (paired with VIDEO_MAP at
                                  import; unmapped -> [VIDEO PENDING] placeholder).
    asset_path          optional  path to a local file to attach to the lesson.
                                  Relative paths resolve against the CSV dir.
                                  Copied to assets/<lesson_id>_<filename>.
    order               optional  integer sort key within a chapter (stable sort;
                                  ties keep file order).

students.csv                                    (optional)
---------------------------------------------------------------------------
    email               REQUIRED  the User primary key (lowercased on import).
    first_name          optional  defaults to the email if blank.
    last_name           optional  defaults to "".

enrollments.csv                                 (optional)
---------------------------------------------------------------------------
    email               REQUIRED  FK -> a student (or any email; unknown emails
                                  are still emitted and resolved at import time).
    course_id           one-of    FK -> courses.csv.course_id. Preferred; the
                                  adapter resolves it to the course title so the
                                  importer matches by title.
    course_title        one-of    used only if course_id is blank/unknown.
                                  (Provide course_id OR course_title.)
    start_date          optional  informational.
    finish_date         optional  completion signal (non-empty => completed).
    progress            optional  completion signal ("100", "100%", "Completed").

===========================================================================

Usage as a library::

    from adapters.csv_generic import CsvGenericAdapter
    CsvGenericAdapter().to_bundle("my_csvs", "bundle_out")

CLI::

    python3 -m adapters.csv_generic --source my_csvs --out bundle_out
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

from .base import Adapter, copy_asset, write_manifest


def _read_csv(path: Path):
    """Yield rows as dicts keyed by lowercased/stripped header names.
    ``utf-8-sig`` transparently strips a BOM from spreadsheet exports."""
    if not path.exists():
        return []
    with open(path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        rows = []
        for raw in reader:
            rows.append({(k.strip().lower() if k else k): (v.strip() if isinstance(v, str) else v)
                         for k, v in raw.items()})
        return rows


def _pick(row, *keys):
    for k in keys:
        v = row.get(k)
        if v:
            return v
    return ""


class CsvGenericAdapter(Adapter):
    """Map ``courses.csv`` / ``lessons.csv`` / ``students.csv`` /
    ``enrollments.csv`` in a directory into a normalized bundle."""

    name = "csv_generic"

    def to_bundle(self, source_input, out_dir) -> dict:
        src = Path(source_input)
        out = self._out(out_dir)
        if not src.is_dir():
            raise NotADirectoryError(f"CSV source '{src}' is not a directory")

        courses = _read_csv(src / "courses.csv")
        lessons = _read_csv(src / "lessons.csv")
        students = _read_csv(src / "students.csv")
        enrollments = _read_csv(src / "enrollments.csv")

        if not courses:
            raise FileNotFoundError(f"{src / 'courses.csv'} is required and was empty/missing")

        # Index lessons by course_id.
        lessons_by_course: dict[str, list] = {}
        for row in lessons:
            cid = _pick(row, "course_id")
            if not cid:
                continue
            lessons_by_course.setdefault(cid, []).append(row)

        title_by_course_id: dict[str, str] = {}
        counts = {"courses": 0, "chapters": 0, "lessons": 0, "assets_ok": 0, "assets_failed": 0}

        for crow in courses:
            cid = _pick(crow, "course_id")
            title = _pick(crow, "title")
            if not cid or not title:
                continue  # course_id + title are required
            title_by_course_id[cid] = title

            course_obj = {
                "id": cid,
                "title": title,
                "short_description": _pick(crow, "short_description"),
                "description": _pick(crow, "description"),
            }

            # Build chapters (first-seen order) and flat lessons bound by _chapter_id.
            chapter_order: list[str] = []
            chapter_titles: dict[str, str] = {}
            lesson_objs = []
            for lrow in lessons_by_course.get(cid, []):
                chap_id = _pick(lrow, "chapter_id") or "_default"
                if chap_id not in chapter_titles:
                    chapter_order.append(chap_id)
                    chapter_titles[chap_id] = _pick(lrow, "chapter_title")
                elif not chapter_titles[chap_id]:
                    chapter_titles[chap_id] = _pick(lrow, "chapter_title")

                lesson_obj = {
                    "id": _pick(lrow, "lesson_id"),
                    "_chapter_id": chap_id,
                    "title": _pick(lrow, "title"),
                    "content": _pick(lrow, "content"),
                }
                vurl = _pick(lrow, "video_url")
                if vurl:
                    lesson_obj["video_url"] = vurl
                    lesson_obj["type"] = "video"
                # keep raw order for stable sort
                lesson_obj["_order"] = lrow.get("order") or ""
                lesson_obj["_asset_path"] = _pick(lrow, "asset_path")
                lesson_objs.append(lesson_obj)

            # Stable sort lessons within their chapter by numeric order if given.
            def _sort_key(item):
                idx = chapter_order.index(item["_chapter_id"])
                raw = item.get("_order") or ""
                try:
                    order = int(raw)
                except (TypeError, ValueError):
                    order = 0
                return (idx, order)

            lesson_objs = sorted(enumerate(lesson_objs), key=lambda t: (_sort_key(t[1]), t[0]))
            lesson_objs = [o for _, o in lesson_objs]

            chapters = [{"id": ch, "title": chapter_titles[ch] or f"Chapter {i}"}
                        for i, ch in enumerate(chapter_order, start=1)]

            # Strip helper keys before writing.
            clean_lessons = []
            asset_specs = []
            for lo in lesson_objs:
                asset_specs.append((lo["id"], lo.pop("_asset_path", "")))
                lo.pop("_order", None)
                clean_lessons.append(lo)

            course_dir = self.write_course(out, cid, course_obj, chapters, clean_lessons)
            counts["courses"] += 1
            counts["chapters"] += len(chapters)
            counts["lessons"] += len(clean_lessons)

            # Copy attachments referenced by asset_path.
            failed = []
            for lesson_id, asset_path in asset_specs:
                if not asset_path:
                    continue
                p = Path(asset_path)
                if not p.is_absolute():
                    p = src / asset_path
                try:
                    copy_asset(course_dir, lesson_id, p)
                    counts["assets_ok"] += 1
                except FileNotFoundError:
                    failed.append({"lesson_id": lesson_id, "path": str(asset_path)})
                    counts["assets_failed"] += 1
            if failed:
                import json
                (course_dir / "assets_failed.json").write_text(json.dumps(failed, indent=2))

        # ------------------------------------------------------- students --
        users_by_email: dict[str, dict] = {}
        for srow in students:
            email = _pick(srow, "email").lower()
            if not email:
                continue
            users_by_email[email] = {
                "email": email,
                "first_name": _pick(srow, "first_name") or email,
                "last_name": _pick(srow, "last_name"),
            }

        enrollment_objs = []
        for erow in enrollments:
            email = _pick(erow, "email").lower()
            if not email:
                continue
            cid = _pick(erow, "course_id")
            course_ref = title_by_course_id.get(cid) or _pick(erow, "course_title") or cid
            if not course_ref:
                continue
            users_by_email.setdefault(email, {"email": email, "first_name": email, "last_name": ""})
            enrollment_objs.append({
                "email": email,
                "course": course_ref,
                "start_date": _pick(erow, "start_date"),
                "finish_date": _pick(erow, "finish_date"),
                "progress": _pick(erow, "progress"),
            })

        users = sorted(users_by_email.values(), key=lambda u: u["email"])
        student_counts = self.write_normalized(out, users, enrollment_objs)

        write_manifest(out, source=str(src), adapter=self.name,
                       students=student_counts, content=counts)

        summary = {**counts, **student_counts}
        print("CSV_GENERIC_ADAPTER_OK", summary)
        return summary


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", required=True, help="directory holding the *.csv files")
    ap.add_argument("--out", required=True, help="bundle output directory")
    args = ap.parse_args(argv)
    CsvGenericAdapter().to_bundle(args.source, args.out)


if __name__ == "__main__":
    main()
