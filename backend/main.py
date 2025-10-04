from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from backend.database import Base, engine, SessionLocal
from backend import models
from backend.matching import find_matches

# Create the database tables
Base.metadata.create_all(bind=engine)

# Create the FastAPI app instance
app = FastAPI()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Root endpoint
@app.get("/")
def root():
    return {"message": "Hello, Transfer Connect!"}

# A simple test endpoint
@app.get("/ping")
def ping():
    return {"status": "ok", "message": "pong"}

# New endpoint to run algortihm
@app.get("/matches/{student_id}")
def get_matches(student_id:int,
                desired_university: str,
                intended_area_of_study: str,
                previous_school: str,
                db: Session = Depends(get_db)):
    mentors = find_matches(db, student_id, desired_university, intended_area_of_study, previous_school)
    return [
        {
            "id": m.id,
            "name": m.name,
            "email": m.email,
            "institution": m.institution,
            "area_of_study": m.area_of_study,
            "bio": m.bio,
            "previous_school": m.previous_school
        }
        for m in mentors
    ]
