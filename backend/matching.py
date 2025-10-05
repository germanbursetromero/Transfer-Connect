# backend/matching.py
from sqlalchemy.orm import Session
from . import models
from sqlalchemy import func

def find_matches(db: Session, student_id: int, desired_university: str, intended_area_of_study: str, college: str):
    """
    Returns the mentors that match the student's info ranked by how well they match
    """
    # ✅ Normalize all inputs safely
    desired_university = (desired_university or "").lower()
    intended_area_of_study = (intended_area_of_study or "").lower()
    college = (college or "").lower()

    # ✅ get mentors at chosen university (only compare lowercased)
    mentors = db.query(models.Mentor).filter(
        func.lower(models.Mentor.university) == desired_university
    ).all()

    # ✅ get student info
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        return []

    # ✅ iterate through mentors and score them safely
    ranked = []
    for mentor in mentors:
        score = 0

        mentor_area = (mentor.area_of_study or "").lower()
        mentor_prev = (getattr(mentor, "previous_school", "") or "").lower()
        student_college = (student.college or "").lower()

        if mentor_area and intended_area_of_study and mentor_area == intended_area_of_study:
            score += 1

        if mentor_prev and student_college and mentor_prev == student_college:
            score += 1

        ranked.append((score, mentor))

    # ✅ sort mentors by match quality
    ranked.sort(key=lambda x: x[0], reverse=True)
    return [mentor for score, mentor in ranked]
