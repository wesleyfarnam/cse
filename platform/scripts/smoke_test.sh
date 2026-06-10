#!/bin/bash
set -e
BASE="http://127.0.0.1:8000"
H='Host: demo-federation.localhost'
JAR=/tmp/coach_cookies.txt
COURSE="certified-kickboxing-coach-level-1"
QUIZ="level-1-final-exam"

echo "== 1. Login as coach =="
curl -s -c $JAR -H "$H" -X POST "$BASE/api/method/login" \
  -d "usr=coach@demofed.test&pwd=CoachDemo_1" | head -c 200; echo

echo "== 2. Enroll in course =="
curl -s -b $JAR -H "$H" -H "Content-Type: application/json" -X POST "$BASE/api/method/frappe.client.insert" \
  -d "{\"doc\":{\"doctype\":\"LMS Enrollment\",\"course\":\"$COURSE\",\"member\":\"coach@demofed.test\"}}" | head -c 200; echo

echo "== 3. Complete lessons =="
for L in "0004 Ring & Gear Safety" "0005 Injury Prevention Basics" "0007 DKF Competition Rules" "0008 Coaching the Athlete Pathway" "0009 Final Exam"; do
  curl -s -b $JAR -H "$H" -X POST "$BASE/api/method/lms.lms.doctype.course_lesson.course_lesson.save_progress" \
    --data-urlencode "lesson=$L" --data-urlencode "course=$COURSE" | head -c 80; echo " <- $L"
done

echo "== 4. Submit quiz =="
RESULTS='[{"question_name":"QTS-2026-00002","answer":["Mouthguard"]},{"question_name":"QTS-2026-00003","answer":["Roundhouse kick to the body","Straight punch to the head"]}]'
curl -s -b $JAR -H "$H" -X POST "$BASE/api/method/lms.lms.doctype.lms_quiz.lms_quiz.submit_quiz" \
  --data-urlencode "quiz=$QUIZ" --data-urlencode "results=$RESULTS"; echo

echo "== 5. Claim certificate =="
curl -s -b $JAR -H "$H" -X POST "$BASE/api/method/lms.lms.doctype.lms_certificate.lms_certificate.create_certificate" \
  --data-urlencode "course=$COURSE"; echo
