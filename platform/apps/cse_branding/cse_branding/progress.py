# Copyright (c) 2026, Combat Sports Education and contributors
# For license information, please see license.txt
"""
Student progress aggregation for the CSE Batch 3 "Progress" screen.

Lives in cse_branding (not frappe/lms) so the sealed LMS Python source is
untouched. The LMS Vue frontend calls the whitelisted `student_progress`
method and renders the Batch 3 design (per-discipline rings, all-time stats,
milestones).

Hours trained is an ESTIMATE: Course Lesson has no duration field, so we bill
each completed lesson at MINUTES_PER_LESSON. Surfaced honestly in the UI.
"""

import frappe

MINUTES_PER_LESSON = 12

# tag/keyword -> discipline pill colour key used by the frontend
def _disc_key(name):
	t = (name or "").lower()
	if any(k in t for k in ("box", "kick", "strik", "muay", "thai")):
		return "red"
	if any(k in t for k in ("bjj", "jiu", "jitsu", "grappl", "guard", "wrestl")):
		return "blue"
	return "neutral"


def _fmt_hm(minutes):
	minutes = int(minutes or 0)
	h, m = divmod(minutes, 60)
	if h and m:
		return f"{h}h {m}m"
	if h:
		return f"{h}h"
	return f"{m}m"


@frappe.whitelist()
def student_progress():
	user = frappe.session.user
	if not user or user == "Guest":
		frappe.throw("Login required")

	enrollments = frappe.get_all(
		"LMS Enrollment",
		filters={"member": user},
		fields=["course", "progress"],
	)

	disciplines = {}
	for e in enrollments:
		course = frappe.db.get_value(
			"LMS Course", e.course, ["title", "tags", "lessons"], as_dict=True
		) or {}
		tags = [t.strip() for t in (course.get("tags") or "").split(",") if t.strip()]
		disc_name = tags[0] if tags else "General"
		total = course.get("lessons") or frappe.db.count(
			"Course Lesson", {"course": e.course}
		)
		done = frappe.db.count(
			"LMS Course Progress",
			{"member": user, "course": e.course, "status": "Complete"},
		)
		d = disciplines.setdefault(
			disc_name,
			{
				"name": disc_name,
				"key": _disc_key(disc_name),
				"lessons_done": 0,
				"lessons_total": 0,
				"courses_active": 0,
			},
		)
		d["lessons_done"] += done
		d["lessons_total"] += total
		d["courses_active"] += 1

	discipline_cards = []
	for d in disciplines.values():
		pct = (
			round(d["lessons_done"] / d["lessons_total"] * 100)
			if d["lessons_total"]
			else 0
		)
		mins = d["lessons_done"] * MINUTES_PER_LESSON
		discipline_cards.append(
			{
				"name": d["name"],
				"key": d["key"],
				"percent": pct,
				"lessons_done": d["lessons_done"],
				"lessons_total": d["lessons_total"],
				"courses_active": d["courses_active"],
				"trained": _fmt_hm(mins),
			}
		)
	discipline_cards.sort(key=lambda c: c["percent"], reverse=True)

	# ---- all-time ----
	total_done = frappe.db.count(
		"LMS Course Progress", {"member": user, "status": "Complete"}
	)
	all_time = {
		"lessons": total_done,
		"trained": _fmt_hm(total_done * MINUTES_PER_LESSON),
		"estimated": True,
	}

	# ---- milestones (computed from real activity) ----
	completions = frappe.get_all(
		"LMS Course Progress",
		filters={"member": user, "status": "Complete"},
		fields=["creation"],
		order_by="creation asc",
	)
	first_date = completions[0].creation if completions else None
	distinct_days = len({str(c.creation)[:10] for c in completions})
	completed_courses = [e for e in enrollments if (e.progress or 0) >= 100]
	cert_count = frappe.db.count("LMS Certificate", {"member": user})

	def _month(dt):
		return frappe.utils.formatdate(dt, "MMM yyyy") if dt else ""

	milestones = [
		{
			"key": "first-lesson",
			"title": "First lesson done",
			"subtitle": _month(first_date) if first_date else "Complete a lesson to earn it",
			"earned": bool(total_done),
			"icon": "check",
		},
		{
			"key": "streak",
			"title": "7-day streak",
			"subtitle": "Train 7 different days"
			if distinct_days < 7
			else f"{distinct_days} active days",
			"earned": distinct_days >= 7,
			"icon": "calendar",
		},
		{
			"key": "module-master",
			"title": "Course complete",
			"subtitle": f"{len(completed_courses)} finished"
			if completed_courses
			else "Finish a course at 100%",
			"earned": bool(completed_courses),
			"icon": "target",
		},
		{
			"key": "first-cert",
			"title": "First certificate",
			"subtitle": f"{cert_count} earned"
			if cert_count
			else "Finish a course to earn it",
			"earned": bool(cert_count),
			"icon": "award",
		},
	]

	return {
		"disciplines": discipline_cards,
		"all_time": all_time,
		"milestones": milestones,
	}


def _coach_name(course):
	rows = frappe.get_all(
		"Course Instructor",
		filters={"parent": course},
		fields=["instructor"],
		order_by="idx asc",
		limit=1,
	)
	if not rows:
		return None
	return frappe.db.get_value("User", rows[0].instructor, "full_name") or rows[0].instructor


@frappe.whitelist()
def student_dashboard():
	user = frappe.session.user
	if not user or user == "Guest":
		frappe.throw("Login required")

	full_name = frappe.db.get_value("User", user, "full_name") or ""
	first_name = full_name.split(" ")[0] if full_name else ""

	enrollments = frappe.get_all(
		"LMS Enrollment",
		filters={"member": user},
		fields=["course", "progress", "current_lesson", "modified"],
		order_by="modified desc",
	)

	# ---- Continue training: most-recent in-progress course ----
	cont = None
	in_progress = [e for e in enrollments if 0 <= (e.progress or 0) < 100]
	pick = in_progress[0] if in_progress else (enrollments[0] if enrollments else None)
	if pick:
		course = frappe.db.get_value(
			"LMS Course", pick.course, ["title", "image", "tags", "lessons"], as_dict=True
		) or {}
		total = course.get("lessons") or 0
		done = frappe.db.count(
			"LMS Course Progress",
			{"member": user, "course": pick.course, "status": "Complete"},
		)
		tags = [t.strip() for t in (course.get("tags") or "").split(",") if t.strip()]
		cont = {
			"course": pick.course,
			"title": course.get("title"),
			"image": course.get("image"),
			"discipline": tags[0] if tags else None,
			"disc_key": _disc_key(tags[0]) if tags else "neutral",
			"coach": _coach_name(pick.course),
			"progress": round(pick.progress or 0),
			"lessons_done": done,
			"lessons_total": total,
			"remaining": max(total - done, 0),
		}

	# ---- This week: streak dots for the last 7 days ----
	completions = frappe.get_all(
		"LMS Course Progress",
		filters={"member": user, "status": "Complete"},
		fields=["creation"],
	)
	days_done = {str(c.creation)[:10] for c in completions}
	today = frappe.utils.getdate()
	week = []
	for i in range(6, -1, -1):
		d = frappe.utils.add_days(today, -i)
		week.append({"label": d.strftime("%a")[0], "done": str(d) in days_done})
	streak = 0
	for i in range(0, 30):
		d = str(frappe.utils.add_days(today, -i))
		if d in days_done:
			streak += 1
		elif i == 0:
			continue  # today not yet trained doesn't break an existing streak
		else:
			break

	# ---- Recommended: published courses the user isn't enrolled in ----
	enrolled_names = [e.course for e in enrollments]
	rec_filters = {"published": 1}
	if enrolled_names:
		rec_filters["name"] = ["not in", enrolled_names]
	rec_rows = frappe.get_all(
		"LMS Course",
		filters=rec_filters,
		fields=["name", "title", "image", "tags", "enrollments"],
		order_by="enrollments desc, modified desc",
		limit=3,
	)
	recommended = []
	for r in rec_rows:
		tags = [t.strip() for t in (r.get("tags") or "").split(",") if t.strip()]
		recommended.append(
			{
				"name": r.name,
				"title": r.title,
				"image": r.image,
				"discipline": tags[0] if tags else None,
				"disc_key": _disc_key(tags[0]) if tags else "neutral",
				"coach": _coach_name(r.name),
			}
		)

	return {
		"first_name": first_name,
		"continue_training": cont,
		"week": week,
		"streak": streak,
		"recommended": recommended,
	}
