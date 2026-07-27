"""EzyCourse adapter — adapter #1 for the normalized migration bundle.

EzyCourse was the original (and so far only) migration source, so its export
tooling *already* emits a compliant bundle: ``ezycourse_export.py --crawl``
writes ``courses/<id>/course.json`` (+ ``assets/``) and ``--normalize`` merges
the admin-dashboard CSVs into ``students/normalized.json``. This adapter simply
re-expresses that existing behaviour behind the common :class:`Adapter`
interface so EzyCourse sits alongside the generic-CSV / future Teachable /
Thinkific adapters, all producing the identical tree consumed by
``ezycourse_import.py``.

It does **not** re-implement the normalize logic — it imports and calls
``ezycourse_export.normalize`` directly, so there is a single source of truth
for how EzyCourse CSVs map to ``normalized.json``.

Usage as a library::

    from adapters.ezycourse import EzyCourseAdapter
    EzyCourseAdapter().to_bundle("ezycourse_export", "bundle_out")

CLI::

    python3 -m adapters.ezycourse --source ezycourse_export --out bundle_out

``source_input`` is a directory previously produced by ``ezycourse_export.py``
(content via ``--crawl`` and/or student CSVs under ``students/``). If ``out_dir``
differs from ``source_input`` the courses/ and students/ trees are copied over
first, then ``normalize`` is (re)run against the destination so
``students/normalized.json`` reflects the current CSVs. If ``out_dir`` equals
``source_input`` the bundle is produced in place.
"""

from __future__ import annotations

import argparse
import importlib.util
import shutil
import sys
from pathlib import Path

from .base import Adapter, write_manifest

# ezycourse_export.py lives one level up (platform/scripts/). It is not a
# package, so load it by path. Its module-level ``import requests`` only matters
# for --crawl; --normalize (all we call) is pure stdlib. We still make the
# import resilient: if requests is missing we stub it just long enough to load
# the module, since none of requests' behaviour is exercised by normalize().
_SCRIPTS_DIR = Path(__file__).resolve().parent.parent


def _load_export_module():
    if str(_SCRIPTS_DIR) not in sys.path:
        sys.path.insert(0, str(_SCRIPTS_DIR))
    try:
        import requests  # noqa: F401
    except ImportError:
        import types
        sys.modules.setdefault("requests", types.ModuleType("requests"))
    spec = importlib.util.spec_from_file_location(
        "ezycourse_export", _SCRIPTS_DIR / "ezycourse_export.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class EzyCourseAdapter(Adapter):
    """Wrap an existing ``ezycourse_export.py`` archive as a normalized bundle."""

    name = "ezycourse"

    def to_bundle(self, source_input, out_dir) -> dict:
        export = _load_export_module()
        source = Path(source_input)
        out = self._out(out_dir)

        if not source.is_dir():
            raise NotADirectoryError(
                f"EzyCourse source '{source}' is not a directory "
                f"(expected an ezycourse_export.py archive)")

        # 1. Mirror course content (courses/*/course.json + assets/) if the
        #    source is a different directory. Already-normalized in place → skip.
        if out.resolve() != source.resolve():
            src_courses = source / "courses"
            if src_courses.is_dir():
                shutil.copytree(src_courses, out / "courses", dirs_exist_ok=True)
            src_students = source / "students"
            if src_students.is_dir():
                shutil.copytree(src_students, out / "students", dirs_exist_ok=True)

        # 2. (Re)generate students/normalized.json from the CSVs using the
        #    EXISTING, production-proven normalize logic. If there are no CSVs
        #    but a normalized.json already exists, leave it untouched.
        students_dir = out / "students"
        has_csv = (students_dir / "students.csv").exists() or \
                  (students_dir / "enrollments").is_dir()
        if has_csv:
            student_counts = export.normalize(out)
        elif (students_dir / "normalized.json").exists():
            import json
            data = json.loads((students_dir / "normalized.json").read_text())
            student_counts = {"users": len(data.get("users", [])),
                              "enrollments": len(data.get("enrollments", []))}
        else:
            student_counts = {"users": 0, "enrollments": 0}

        # 3. Count content for the manifest/summary.
        course_jsons = sorted(out.glob("courses/*/course.json"))
        import json
        lessons = 0
        for cj in course_jsons:
            lessons += len(json.loads(cj.read_text()).get("lessons") or [])
        content_counts = {"courses": len(course_jsons), "lessons": lessons}

        write_manifest(out, source=str(source), adapter=self.name,
                       students=student_counts, content=content_counts)

        summary = {**content_counts, **student_counts}
        print("EZYCOURSE_ADAPTER_OK", summary)
        return summary


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", required=True,
                    help="directory produced by ezycourse_export.py")
    ap.add_argument("--out", required=True, help="bundle output directory")
    args = ap.parse_args(argv)
    EzyCourseAdapter().to_bundle(args.source, args.out)


if __name__ == "__main__":
    main()
