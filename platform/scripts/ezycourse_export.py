#!/usr/bin/env python3
"""Export all data from an EzyCourse school into a neutral local archive.

EzyCourse has no public REST API, so this works in two modes:

1. --normalize : merge the CSV exports you downloaded from the EzyCourse
   admin dashboard (students + per-course enrollments) into
   students/normalized.json. Works today, no API access needed.

2. --crawl : walk the internal API the EzyCourse dashboard SPA uses, save
   every course/chapter/lesson as JSON and download every asset. The
   endpoint paths below are placeholders until verified against a HAR
   capture of the dashboard (see runbook/ezycourse-migration.md). The
   script authenticates with your own session cookie / bearer token.

Usage:
    python3 ezycourse_export.py --normalize --out ezycourse_export
    EZY_COOKIE='...' python3 ezycourse_export.py --crawl \
        --base-url https://YOURSCHOOL.ezycourse.com --out ezycourse_export

Videos are usually served as HLS streams; if a media URL points at a
.m3u8 playlist the script shells out to yt-dlp (pip install yt-dlp).
Downloads are resumable: files already on disk are skipped.
"""

import argparse
import csv
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("pip install requests (and yt-dlp for video downloads)")

# ---------------------------------------------------------------------------
# Internal API endpoints — VERIFY AGAINST HAR CAPTURE BEFORE FIRST --crawl RUN.
# Open DevTools > Network while browsing the EzyCourse admin, click through a
# course curriculum and one lesson of each type, then update these paths to
# match the requests you see (and AUTH_STYLE below to match their headers).
# ---------------------------------------------------------------------------
ENDPOINTS = {
    "courses": "/api/v1/courses?page={page}",
    "course_detail": "/api/v1/courses/{course_id}",
    "curriculum": "/api/v1/courses/{course_id}/chapters",
    "lesson_detail": "/api/v1/lessons/{lesson_id}",
}
AUTH_STYLE = "cookie"  # "cookie" (EZY_COOKIE env) or "bearer" (EZY_TOKEN env)
REQUEST_DELAY = 0.5  # seconds between API calls; be gentle


def log(*args):
    print(*args, flush=True)


class EzyClient:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers["User-Agent"] = "ezycourse-export (account owner data export)"
        if AUTH_STYLE == "cookie":
            cookie = os.environ.get("EZY_COOKIE")
            if not cookie:
                sys.exit("Set EZY_COOKIE to your authenticated EzyCourse session cookie")
            self.session.headers["Cookie"] = cookie
        else:
            token = os.environ.get("EZY_TOKEN")
            if not token:
                sys.exit("Set EZY_TOKEN to your EzyCourse bearer token")
            self.session.headers["Authorization"] = f"Bearer {token}"

    def get_json(self, path, **fmt):
        url = self.base_url + path.format(**fmt)
        time.sleep(REQUEST_DELAY)
        resp = self.session.get(url, timeout=60)
        if resp.status_code in (401, 403):
            sys.exit(f"AUTH_FAILED {url} — refresh your session cookie/token")
        resp.raise_for_status()
        return resp.json()

    def download(self, url, dest: Path):
        if dest.exists() and dest.stat().st_size > 0:
            return "skipped"
        dest.parent.mkdir(parents=True, exist_ok=True)
        if ".m3u8" in url:
            return self._download_hls(url, dest)
        time.sleep(REQUEST_DELAY)
        with self.session.get(url, stream=True, timeout=300) as resp:
            resp.raise_for_status()
            tmp = dest.with_suffix(dest.suffix + ".part")
            with open(tmp, "wb") as fh:
                for chunk in resp.iter_content(chunk_size=1 << 20):
                    fh.write(chunk)
            tmp.rename(dest)
        return "downloaded"

    def _download_hls(self, url, dest: Path):
        if not shutil.which("yt-dlp"):
            raise RuntimeError("yt-dlp not installed (needed for HLS video)")
        cmd = ["yt-dlp", "--no-progress", "-o", str(dest.with_suffix(".mp4")), url]
        cookie = os.environ.get("EZY_COOKIE")
        if cookie:
            cmd += ["--add-header", f"Cookie: {cookie}"]
        subprocess.run(cmd, check=True)
        return "downloaded"


def safe_name(text):
    return re.sub(r"[^A-Za-z0-9._-]+", "_", str(text)).strip("_")[:120] or "unnamed"


# ---------------------------------------------------------------------------
# --crawl : course content + assets via the internal API
# ---------------------------------------------------------------------------

def find_asset_urls(obj, found=None):
    """Recursively pull anything that looks like a media/file URL out of a
    lesson payload. Field names vary, so match on URL shape instead."""
    if found is None:
        found = []
    if isinstance(obj, dict):
        for v in obj.values():
            find_asset_urls(v, found)
    elif isinstance(obj, list):
        for v in obj:
            find_asset_urls(v, found)
    elif isinstance(obj, str) and re.match(r"https?://\S+\.(mp4|m3u8|pdf|png|jpe?g|gif|webp|mp3|zip|docx?|pptx?|xlsx?)(\?\S*)?$", obj, re.I):
        if obj not in found:
            found.append(obj)
    return found


def crawl(client: EzyClient, out: Path):
    courses_dir = out / "courses"
    courses_dir.mkdir(parents=True, exist_ok=True)
    summary = {"courses": 0, "lessons": 0, "assets_ok": 0, "assets_failed": 0}

    page, courses = 1, []
    while True:
        data = client.get_json(ENDPOINTS["courses"], page=page)
        batch = data if isinstance(data, list) else data.get("data") or data.get("courses") or []
        if not batch:
            break
        courses.extend(batch)
        if isinstance(data, list) or not (data.get("next_page") or data.get("next")):
            break
        page += 1
    log("COURSES_FOUND", len(courses))

    for course in courses:
        cid = course.get("id") or course.get("course_id")
        cdir = courses_dir / safe_name(cid)
        cdir.mkdir(parents=True, exist_ok=True)
        detail = client.get_json(ENDPOINTS["course_detail"], course_id=cid)
        curriculum = client.get_json(ENDPOINTS["curriculum"], course_id=cid)

        chapters = curriculum if isinstance(curriculum, list) else curriculum.get("data") or []
        lessons_out, failed = [], []
        for chapter in chapters:
            for lesson in chapter.get("lessons") or chapter.get("lectures") or []:
                lid = lesson.get("id") or lesson.get("lesson_id")
                try:
                    lesson_detail = client.get_json(ENDPOINTS["lesson_detail"], lesson_id=lid)
                except Exception as exc:
                    failed.append({"lesson_id": lid, "error": str(exc)})
                    continue
                lesson_detail["_chapter_id"] = chapter.get("id")
                lessons_out.append(lesson_detail)
                summary["lessons"] += 1
                for url in find_asset_urls(lesson_detail):
                    fname = safe_name(f"{lid}_" + url.split("/")[-1].split("?")[0])
                    try:
                        client.download(url, cdir / "assets" / fname)
                        summary["assets_ok"] += 1
                    except Exception as exc:
                        failed.append({"lesson_id": lid, "url": url, "error": str(exc)})
                        summary["assets_failed"] += 1

        (cdir / "course.json").write_text(json.dumps(
            {"course": detail, "chapters": chapters, "lessons": lessons_out},
            indent=2, default=str))
        if failed:
            (cdir / "assets_failed.json").write_text(json.dumps(failed, indent=2))
        summary["courses"] += 1
        log("COURSE_OK", cid, course.get("title") or course.get("name"))
    return summary


# ---------------------------------------------------------------------------
# --normalize : merge admin-dashboard CSV exports into normalized.json
# ---------------------------------------------------------------------------

def read_csv(path):
    with open(path, newline="", encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh))


def pick(row, *candidates):
    lowered = {k.strip().lower(): v for k, v in row.items() if k}
    for cand in candidates:
        if lowered.get(cand):
            return lowered[cand].strip()
    return ""


def normalize(out: Path):
    students_dir = out / "students"
    users, enrollments = {}, []

    students_csv = students_dir / "students.csv"
    if students_csv.exists():
        for row in read_csv(students_csv):
            email = pick(row, "email", "student email", "user email").lower()
            if not email:
                continue
            full_name = pick(row, "name", "full name", "student name")
            first = pick(row, "first name", "first_name") or (full_name.split(" ")[0] if full_name else email)
            last = pick(row, "last name", "last_name") or " ".join(full_name.split(" ")[1:])
            users[email] = {"email": email, "first_name": first, "last_name": last}

    enroll_dir = students_dir / "enrollments"
    if enroll_dir.is_dir():
        for csv_path in sorted(enroll_dir.glob("*.csv")):
            course_title = csv_path.stem.replace("_", " ")
            for row in read_csv(csv_path):
                email = pick(row, "email", "student email", "user email").lower()
                if not email:
                    continue
                users.setdefault(email, {"email": email,
                                         "first_name": pick(row, "name", "student name") or email,
                                         "last_name": ""})
                enrollments.append({
                    "email": email,
                    "course": pick(row, "course", "course name", "course title") or course_title,
                    "start_date": pick(row, "start date", "enrolled at", "enrollment date"),
                    "finish_date": pick(row, "finish date", "completed at", "completion date"),
                    "progress": pick(row, "progress", "completion", "progress (%)", "status"),
                })

    result = {"users": sorted(users.values(), key=lambda u: u["email"]),
              "enrollments": enrollments}
    (students_dir / "normalized.json").write_text(json.dumps(result, indent=2))
    log("NORMALIZED users", len(users), "enrollments", len(enrollments))
    return {"users": len(users), "enrollments": len(enrollments)}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="ezycourse_export")
    ap.add_argument("--base-url", help="https://YOURSCHOOL.ezycourse.com")
    ap.add_argument("--crawl", action="store_true", help="export course content + assets via internal API")
    ap.add_argument("--normalize", action="store_true", help="merge dashboard CSV exports into normalized.json")
    args = ap.parse_args()
    if not (args.crawl or args.normalize):
        ap.error("nothing to do: pass --crawl and/or --normalize")

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    manifest = {"source": args.base_url, "exported_at": time.strftime("%Y-%m-%d %H:%M:%S")}

    if args.normalize:
        manifest["students"] = normalize(out)
    if args.crawl:
        if not args.base_url:
            ap.error("--crawl requires --base-url")
        manifest["content"] = crawl(EzyClient(args.base_url), out)

    (out / "manifest.json").write_text(json.dumps(manifest, indent=2))
    log("EXPORT_OK", json.dumps(manifest))


if __name__ == "__main__":
    main()
