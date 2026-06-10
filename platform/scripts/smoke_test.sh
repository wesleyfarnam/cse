#!/bin/bash
# End-to-end learner smoke test: login -> enroll -> lessons -> quiz -> certificate.
# Run on the server hosting the site (needs the bench's python for ID discovery).
#
#   SITE=demo-federation.localhost BASE=http://127.0.0.1:8000 bash smoke_test.sh
#
# Lesson and question IDs differ per install, so they are discovered live via
# dump_ids.py rather than hardcoded.
set -e
SITE="${SITE:-demo-federation.localhost}"
BASE="${BASE:-http://127.0.0.1:8000}"
COACH="${COACH:-coach@demofed.test}"
COACH_PW="${COACH_PW:-CoachDemo_1}"
PY="${PY:-/home/frappe/frappe-bench/env/bin/python}"
DIR="$(cd "$(dirname "$0")" && pwd)"
H="Host: $SITE"
JAR=$(mktemp)

echo "== 0. Discover course/lesson/question IDs =="
IDS=$(SITE=$SITE "$PY" "$DIR/run_on_site.py" "$DIR/dump_ids.py" | tail -1)
COURSE=$(echo "$IDS" | python3 -c "import sys,json; print(json.load(sys.stdin)['course'])")
QUIZ=$(echo "$IDS" | python3 -c "import sys,json; print(json.load(sys.stdin)['quiz'])")
RESULTS=$(echo "$IDS" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(json.dumps([{'question_name': q['name'], 'answer': q['correct']} for q in d['questions']]))")
echo "course=$COURSE quiz=$QUIZ"

echo "== 1. Login as coach =="
curl -s -c "$JAR" -H "$H" -X POST "$BASE/api/method/login" \
  -d "usr=$COACH&pwd=$COACH_PW" | head -c 200; echo

echo "== 2. Enroll in course =="
curl -s -b "$JAR" -H "$H" -H "Content-Type: application/json" -X POST "$BASE/api/method/frappe.client.insert" \
  -d "{\"doc\":{\"doctype\":\"LMS Enrollment\",\"course\":\"$COURSE\",\"member\":\"$COACH\"}}" | head -c 200; echo

echo "== 3. Complete lessons =="
echo "$IDS" | python3 -c "
import sys, json
for l in json.load(sys.stdin)['lessons']:
    print(l['name'])" | while IFS= read -r L; do
  curl -s -b "$JAR" -H "$H" -X POST "$BASE/api/method/lms.lms.doctype.course_lesson.course_lesson.save_progress" \
    --data-urlencode "lesson=$L" --data-urlencode "course=$COURSE" | head -c 80; echo " <- $L"
done

echo "== 4. Submit quiz (correct answers from ID dump) =="
curl -s -b "$JAR" -H "$H" -X POST "$BASE/api/method/lms.lms.doctype.lms_quiz.lms_quiz.submit_quiz" \
  --data-urlencode "quiz=$QUIZ" --data-urlencode "results=$RESULTS"; echo

echo "== 5. Claim certificate (must show expiry_date = issue_date + 1 year) =="
curl -s -b "$JAR" -H "$H" -X POST "$BASE/api/method/lms.lms.doctype.lms_certificate.lms_certificate.create_certificate" \
  --data-urlencode "course=$COURSE"; echo
rm -f "$JAR"
