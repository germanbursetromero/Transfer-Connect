from fastapi import FastAPI, Depends, Body, HTTPException
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

# get all users
@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

# get specific user
@app.get("/users/{users_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    return user

# sign up user
@app.post("/signup")
def signup(
    name: str = Body(...),
    email: str = Body(...),
    password: str = Body(...),
    role: str = Body(...),
    school: str = Body(None),
    area_of_study: str = Body(None),
    db: Session = Depends(get_db)
    ):
    # check if email already exists
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(name=name, email=email, password=password, role=role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if role.lower() == "mentor":
        mentor = models.Mentor(
            university=school,
            area_of_study=area_of_study,
            bio="",
            user_id=new_user.id,
        )
        db.add(mentor)
    elif role.lower() == "student":
        student = models.Student(
            school=school,
            user_id=new_user.id,
        )
        db.add(student)

    db.commit()
    return {"id": new_user.id, "email": new_user.email, "role": new_user.role}

# login user
@app.post("/login")
def login(email: str = Body(...), password: str = Body(...), db: Session = Depends(get_db)):
    user = db.query(models.user).filter(models.User.email == email).first()
    if not user or user.password != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"id": user.id, "email": user.email, "role":user.role}

# New endpoint to run algortihm
@app.get("/matches/{student_id}")
def get_matches(student_id:int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    return find_matches(db, 
                        student_id, 
                        student.desired_school, 
                        student.intended_area_of_study,
                        student.college)
