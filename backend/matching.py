from sqlalchemy.orm import Session
from . import models

def find_matches(db: Session, student_id: int, desired_university: str, intended_area_of_study: str, previous_school: str):
    """
    Returns the mentors that match the student's info ranked by how well they match
    """

    # get mentors at chosen university
    mentors = db.query(models.Mentor).filter(models.Mentor.university == desired_university).all()

    # get student info
    student = db.query(models.Student).filter(models.Student.id == student_id).first()

    # iterating through mentors and finding best matches based off score
    ranked = []
    for mentor in mentors:
        score = 0

        if mentor.area_of_study.lower() == intended_area_of_study.lower():
            score += 1

        if mentor.previous_school.lower() == student.college.lower():
            score += 1
        ranked.append((score, mentor))

    ranked.sort(key=lambda x: x[0], reverse=True)

    return [mentor for score, mentor in ranked]