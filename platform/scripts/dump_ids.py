import frappe, json
course = frappe.db.get_value("LMS Course", {"title": "Certified Kickboxing Coach - Level 1"})
lessons = frappe.get_all("Course Lesson", {"course": course}, ["name", "title"], order_by="creation")
quiz = frappe.db.get_value("LMS Quiz", {"title": "Level 1 Final Exam"})
qq = frappe.get_all("LMS Quiz Question", {"parent": quiz}, ["question"], order_by="idx")
qs = []
for row in qq:
    q = frappe.get_doc("LMS Question", row.question)
    correct = [q.get(f"option_{i}") for i in range(1, 5) if q.get(f"is_correct_{i}")]
    qs.append({"name": q.name, "multiple": q.multiple, "correct": correct})
print(json.dumps({"course": course, "quiz": quiz, "lessons": lessons, "questions": qs}, default=str))
