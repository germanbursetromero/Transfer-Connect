# matching.py - algorithm which matches students with mentors based off desired school 
# and ranks them based off area of studuy and previous school

from sqlalchemy.orm import Session
from . import models
from sqlalchemy import func

def find_matches(db: Session, student_id: int, desired_university: str, intended_area_of_study: str, college: str):
    """
    Returns mentors at or related to the student's desired university,
    ranked by how well they match the student's area of study and prior school.
    """
    # normalize safely
    desired_university = (desired_university or "").strip().lower()
    intended_area_of_study = (intended_area_of_study or "").strip().lower()
    college = (college or "").strip().lower()

    # use partial, case-insensitive match for university
    mentors = db.query(models.Mentor).filter(
        func.lower(models.Mentor.university).like(f"%{desired_university}%")
    ).all()

    student = db.query(models.Student).filter(models.Student.user_id == student_id).first()
    if not student:
        return []

    ranked = []
    for mentor in mentors:
        score = 0
        mentor_area = (mentor.area_of_study or "").lower()
        mentor_prev = (getattr(mentor, "previous_school", "") or "").lower()
        student_college = (student.college or "").lower()

        # boost score for matching area of study
        if mentor_area and intended_area_of_study and mentor_area == intended_area_of_study:
            score += 2

        # boost score for having transferred from the same college
        if mentor_prev and student_college and mentor_prev == student_college:
            score += 1

        ranked.append((score, mentor))

    # sort by highest score first
    ranked.sort(key=lambda x: x[0], reverse=True)
    return [mentor for score, mentor in ranked]