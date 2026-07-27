"""Source-adapter base layer for the normalized migration bundle.

An *adapter* turns one source's export into the on-disk **normalized bundle**
documented in ``platform/scripts/BUNDLE_SCHEMA.md``. The general importer
(``ezycourse_import.py`` today) consumes any bundle that follows that schema,
so every adapter is interchangeable: EzyCourse is simply adapter #1, and the
generic-CSV / future Teachable / Thinkific adapters emit the same tree.

This module is **standalone stdlib Python** — it must NOT import ``frappe``
(adapters run off-site, before the importer touches a Frappe bench). It only
uses ``json`` / ``pathlib`` / ``re`` / ``shutil``.

Bundle tree an adapter produces (see BUNDLE_SCHEMA.md §1)::

    <out_dir>/
    ├── manifest.json                    # optional provenance + counts
    ├── courses/<course_id>/course.json  # {"course":…, "chapters":[…], "lessons":[…]}
    │   └── assets/<lesson_id>_<file>     # optional lesson attachments
    └── students/normalized.json         # {"users":[…], "enrollments":[…]}

Subclass :class:`Adapter` and implement :meth:`Adapter.to_bundle`, using the
``write_*`` helpers below so every adapter emits byte-compatible output.
"""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path


# ---------------------------------------------------------------------------
# Shared helpers (used by every concrete adapter)
# ---------------------------------------------------------------------------

def safe_name(text) -> str:
    """Return a filesystem-safe token for use as a ``courses/<id>`` dir name or
    an ``assets/<lesson_id>_…`` prefix. Mirrors ``ezycourse_export.safe_name``
    so ids collide identically across adapters."""
    return re.sub(r"[^A-Za-z0-9._-]+", "_", str(text)).strip("_")[:120] or "unnamed"


def write_json(path: Path, obj) -> None:
    """Write ``obj`` as pretty JSON, creating parent dirs. ``default=str`` keeps
    non-JSON-native values (dates, Decimals) from blowing up serialization."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, default=str))


def write_course(out_dir: Path, course_id, course: dict,
                 chapters: list, lessons: list) -> Path:
    """Write one ``courses/<course_id>/course.json`` (BUNDLE_SCHEMA.md §3).

    - ``course``   : object with at least ``title`` (and ideally ``id``).
    - ``chapters`` : list of ``{"id", "title"}`` objects; array order becomes
      chapter order in the LMS.
    - ``lessons``  : flat list; each lesson MUST carry ``_chapter_id`` matching
      one chapter's ``id`` (lessons whose ``_chapter_id`` matches nothing are
      dropped by the importer).

    Returns the course directory so the caller can drop assets into
    ``<course_dir>/assets/``.
    """
    course_dir = out_dir / "courses" / safe_name(course_id)
    write_json(course_dir / "course.json",
               {"course": course, "chapters": chapters, "lessons": lessons})
    return course_dir


def copy_asset(course_dir: Path, lesson_id, src_path) -> str:
    """Copy a lesson attachment into ``<course_dir>/assets/`` named
    ``<lesson_id>_<original_filename>`` (BUNDLE_SCHEMA.md §4). Returns the
    destination filename. Raises ``FileNotFoundError`` if ``src_path`` is
    missing so adapters can record it in ``assets_failed.json``."""
    src = Path(src_path)
    if not src.is_file():
        raise FileNotFoundError(src_path)
    dest_name = safe_name(f"{lesson_id}_{src.name}")
    dest = course_dir / "assets" / dest_name
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dest)
    return dest_name


def write_normalized(out_dir: Path, users: list, enrollments: list) -> dict:
    """Write ``students/normalized.json`` (BUNDLE_SCHEMA.md §5).

    - ``users``       : ``[{"email", "first_name", "last_name"}]`` (email required).
    - ``enrollments`` : ``[{"email", "course", "start_date", "finish_date",
      "progress"}]``; ``course`` should be the same ``title`` used in the
      matching ``course.json`` (or the source ``id`` for id-based resolution).

    Returns ``{"users": n, "enrollments": m}`` for the manifest.
    """
    write_json(out_dir / "students" / "normalized.json",
               {"users": users, "enrollments": enrollments})
    return {"users": len(users), "enrollments": len(enrollments)}


def write_manifest(out_dir: Path, source, students: dict | None = None,
                   content: dict | None = None, **extra) -> Path:
    """Write the optional ``manifest.json`` (BUNDLE_SCHEMA.md §7).

    Free-form provenance the importer never reads; useful for auditing which
    adapter produced a bundle and how many records it carried. Pass ``students``
    / ``content`` count dicts (as returned by :func:`write_normalized` and the
    adapter's course loop) plus any ``**extra`` keys (e.g. ``adapter``,
    ``exported_at``).
    """
    import time

    manifest = {
        "source": source,
        "exported_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    if students is not None:
        manifest["students"] = students
    if content is not None:
        manifest["content"] = content
    manifest.update(extra)
    path = out_dir / "manifest.json"
    write_json(path, manifest)
    return path


# ---------------------------------------------------------------------------
# Adapter interface
# ---------------------------------------------------------------------------

class Adapter:
    """Base class / interface every source adapter implements.

    Contract (BUNDLE_SCHEMA.md §9): given a source export, produce a directory
    that the general importer can consume unchanged. Subclasses override
    :attr:`name` and :meth:`to_bundle`.

    Concrete adapters:
      * ``adapters.ezycourse.EzyCourseAdapter`` — wraps the existing
        ``ezycourse_export.py`` normalize/crawl output.
      * ``adapters.csv_generic.CsvGenericAdapter`` — a documented 4-file CSV layout.
    """

    #: short slug recorded in the manifest, e.g. "ezycourse" / "csv_generic".
    name = "base"

    def to_bundle(self, source_input, out_dir) -> dict:
        """Transform ``source_input`` into a normalized bundle under ``out_dir``.

        Parameters
        ----------
        source_input :
            Adapter-specific handle on the raw source (a directory of CSVs, an
            existing EzyCourse export dir, API credentials, …). Each subclass
            documents what it accepts.
        out_dir :
            Destination directory for the bundle. Created if absent. May equal
            ``source_input`` for in-place adapters.

        Returns
        -------
        dict
            Summary counts (``courses`` / ``lessons`` / ``users`` /
            ``enrollments`` / …) suitable for logging and for
            :func:`write_manifest`.
        """
        raise NotImplementedError

    # -- convenience wrappers so subclasses stay terse ----------------------

    @staticmethod
    def _out(out_dir) -> Path:
        out = Path(out_dir)
        out.mkdir(parents=True, exist_ok=True)
        return out

    def write_course(self, out_dir, course_id, course, chapters, lessons):
        return write_course(Path(out_dir), course_id, course, chapters, lessons)

    def write_normalized(self, out_dir, users, enrollments):
        return write_normalized(Path(out_dir), users, enrollments)

    def write_manifest(self, out_dir, source, **kw):
        return write_manifest(Path(out_dir), source, **kw)
