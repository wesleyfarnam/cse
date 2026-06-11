import frappe, json

frappe.set_user("Administrator")
COURSE = "Certified Kickboxing Coach - Level 1"

if not frappe.db.exists("LMS Course", {"title": COURSE}):
    frappe.get_doc({
        "doctype": "LMS Course",
        "title": COURSE,
        "short_introduction": "Foundation certification for kickboxing coaches of the Demo Kickboxing Federation.",
        "description": "<p>This course certifies coaches in DKF fundamentals: safety, rules, and coaching methodology. Pass the final exam to earn your Level 1 certificate (valid for one year).</p>",
        "enable_certification": 1,
        "published": 1,
        "instructors": [{"instructor": "Administrator"}],
    }).insert(ignore_permissions=True)
course_name = frappe.db.get_value("LMS Course", {"title": COURSE})

def para(text):
    return json.dumps({"blocks": [{"type": "paragraph", "data": {"text": text}}]})

def ensure_chapter(title):
    name = frappe.db.exists("Course Chapter", {"title": title, "course": course_name})
    if not name:
        name = frappe.get_doc({"doctype": "Course Chapter", "title": title, "course": course_name}).insert(ignore_permissions=True).name
    course = frappe.get_doc("LMS Course", course_name)
    if not any(c.chapter == name for c in course.chapters):
        course.append("chapters", {"chapter": name})
        course.save(ignore_permissions=True)
    return name

def ensure_lesson(title, content, chapter_name):
    name = frappe.db.exists("Course Lesson", {"title": title, "course": course_name})
    if not name:
        name = frappe.get_doc({"doctype": "Course Lesson", "title": title, "chapter": chapter_name,
                               "course": course_name, "content": content}).insert(ignore_permissions=True).name
    ch = frappe.get_doc("Course Chapter", chapter_name)
    if not any(le.lesson == name for le in ch.lessons):
        ch.append("lessons", {"lesson": name})
        ch.save(ignore_permissions=True)
    return name

ch1 = ensure_chapter("Module 1: Safety & Equipment")
ensure_lesson("Ring & Gear Safety", para("Coaches must inspect gloves, wraps, headgear and the training area before every session. Never allow sparring without a mouthguard."), ch1)
ensure_lesson("Injury Prevention Basics", para("Warm-up protocols, hydration, and recognizing concussion symptoms. When in doubt, sit the athlete out."), ch1)
ch2 = ensure_chapter("Module 2: Rules & Coaching Method")
ensure_lesson("DKF Competition Rules", para("Scoring zones, legal techniques, fouls, and the role of the ring official under DKF rules."), ch2)
ensure_lesson("Coaching the Athlete Pathway", para("Structuring sessions: technical drills, pad work, conditioning, and periodization across a season."), ch2)

QUIZ_TITLE = "Level 1 Final Exam"
questions_spec = [
    {"question": "Which item is mandatory for all sparring sessions?", "multiple": 0,
     "options": [("Mouthguard", 1), ("Ankle weights", 0), ("Jump rope", 0), ("Resistance bands", 0)]},
    {"question": "Which of the following are legal scoring techniques under DKF rules? (Select all that apply)", "multiple": 1,
     "options": [("Roundhouse kick to the body", 1), ("Straight punch to the head", 1), ("Elbow strike to the spine", 0), ("Knee to the groin", 0)]},
]
quiz_name = frappe.db.exists("LMS Quiz", {"title": QUIZ_TITLE})
if not quiz_name:
    quiz = frappe.get_doc({"doctype": "LMS Quiz", "title": QUIZ_TITLE, "course": course_name,
                           "passing_percentage": 70, "total_marks": len(questions_spec)})
    for q in questions_spec:
        qdoc = {"doctype": "LMS Question", "question": q["question"], "type": "Choices", "multiple": q["multiple"]}
        for i, (opt, correct) in enumerate(q["options"], start=1):
            qdoc[f"option_{i}"] = opt
            qdoc[f"is_correct_{i}"] = correct
        qd = frappe.get_doc(qdoc).insert(ignore_permissions=True)
        quiz.append("questions", {"question": qd.name, "marks": 1})
    quiz_name = quiz.insert(ignore_permissions=True).name

exam_content = json.dumps({"blocks": [
    {"type": "paragraph", "data": {"text": "Pass this exam (70%+) to earn your Level 1 certificate."}},
    {"type": "quiz", "data": {"quiz": quiz_name, "title": QUIZ_TITLE}},
]})
ensure_lesson("Final Exam", exam_content, ch2)

frappe.db.commit()
print("COURSE_OK", course_name, quiz_name)
