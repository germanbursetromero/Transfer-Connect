# backend/main.py
from fastapi import FastAPI, Depends, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import Base, engine, SessionLocal
from backend import models
from backend.matching import find_matches

# Create database tables
Base.metadata.create_all(bind=engine)
app = FastAPI()

# Allow React frontend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "Hello, Transfer Connect!"}


# ✅ SIGNUP (now takes full name)
@app.post("/signup")
def signup(
    name: str = Body(...),
    email: str = Body(...),
    password: str = Body(...),
    role: str = Body(...),
    previous_school: str = Body(None),
    school: str = Body(None),
    area_of_study: str = Body(None),
    db: Session = Depends(get_db)
):

    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(name=name, email=email, password=password, role=role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if role and role.lower() == "mentor":
        mentor = models.Mentor(
            university=school,
            area_of_study=area_of_study,
            bio="",
            previous_school=previous_school,
            user_id=new_user.id,
        )
        db.add(mentor)
    elif role and role.lower() == "student":
        student = models.Student(
            college=school,
            intended_area_of_study=area_of_study,
            desired_school=None,
            user_id=new_user.id,
        )
        db.add(student)

    db.commit()
    return {"id": new_user.id, "email": new_user.email, "role": new_user.role}


# ✅ LOGIN
@app.post("/login")
def login(email: str = Body(...), password: str = Body(...), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or user.password != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"id": user.id, "email": user.email, "role": user.role}
# ✅ GET USER PROFILE
@app.get("/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile_data = {
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }

    if user.role.lower() == "mentor":
        mentor = db.query(models.Mentor).filter(models.Mentor.user_id == user_id).first()
        if mentor:
            profile_data.update({
                "school": mentor.university,
                "field_of_study": mentor.area_of_study,
                "bio": mentor.bio,
                "previous_school": mentor.previous_school,
            })

    elif user.role.lower() == "student":
        student = db.query(models.Student).filter(models.Student.user_id == user_id).first()
        if student:
            profile_data.update({
                "school": student.college,
                "field_of_study": student.intended_area_of_study,
            })

    return profile_data


# ✅ UPDATE PROFILE (adds bio + previous school support)
@app.put("/update_profile/{user_id}")
def update_profile(
    user_id: int,
    email: str = Body(None),
    name: str = Body(None),
    role: str = Body(None),
    school: str = Body(None),
    field_of_study: str = Body(None),
    bio: str = Body(None),
    previous_school: str = Body(None),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if name:
        user.name = name
    if email:
        user.email = email
    if role:
        user.role = role
    

    role_lower = role.lower() if role else None

    if role_lower == "mentor":
        student = db.query(models.Student).filter(models.Student.user_id == user_id).first()
        if student:
            db.delete(student)
        mentor = db.query(models.Mentor).filter(models.Mentor.user_id == user_id).first()
        if not mentor:
            mentor = models.Mentor(user_id=user_id)
            db.add(mentor)
        if school:
            mentor.university = school
        if field_of_study:
            mentor.area_of_study = field_of_study
        if bio is not None:
            mentor.bio = bio
        if previous_school:
            mentor.previous_school = previous_school

    elif role_lower == "student":
        mentor = db.query(models.Mentor).filter(models.Mentor.user_id == user_id).first()
        if mentor:
            db.delete(mentor)
        student = db.query(models.Student).filter(models.Student.user_id == user_id).first()
        if not student:
            student = models.Student(user_id=user_id)
            db.add(student)
        if school:
            student.college = school
        if field_of_study:
            student.intended_area_of_study = field_of_study

    db.commit()
    return {"status": "success", "message": "Profile updated"}


# ✅ MODEL for updating desired school
class DesiredSchoolUpdate(BaseModel):
    desired_school: str


# ✅ UPDATE desired school
@app.put("/update_desired_school/{user_id}")
def update_desired_school(
    user_id: int,
    update: DesiredSchoolUpdate,
    db: Session = Depends(get_db)
):
    student = db.query(models.Student).filter(models.Student.user_id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.desired_school = update.desired_school
    db.commit()
    db.refresh(student)

    return {"status": "success", "desired_school": student.desired_school}


# ✅ MATCHES (includes mentor info)
@app.get("/matches/{student_id}")
def get_matches(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.user_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    matches = find_matches(
        db,
        student_id,
        desired_university=student.desired_school or "",
        intended_area_of_study=student.intended_area_of_study or "",
        college=student.college or "",
    )

    formatted = []
    for mentor in matches:
        user = db.query(models.User).filter(models.User.id == mentor.user_id).first()
        formatted.append({
            "id": mentor.id,
            "name": user.name if user else "Unknown",
            "email": user.email if user else "Unknown",
            "university": mentor.university,
            "area_of_study": mentor.area_of_study,
            "bio": mentor.bio,
            "previous_school": mentor.previous_school,
        })

    return formatted
