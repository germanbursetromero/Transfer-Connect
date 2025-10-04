from backend.database import SessionLocal, engine
from backend import models

models.Base.metadata.create_all(bind = engine)

db = SessionLocal()

# clear old data (for fresh test runs)
db.query(models.Mentor).delete()
db.query(models.Student).delete()
db.query(models.User).delete()
db.commit()

# create test mentors
mentor1 = models.User(email="john@rutgers.edu", name="John", role="mentor")
mentor2 = models.User(email="liam@princeton.edu", name="Liam", role="mentor")
mentor3 = models.User(email="jaylin@princeton.edu", name="Jaylin", role="mentor")
mentor4 = models.User(email="billy@rowan.edu", name="Billy", role="mentor")

# create test transfer students

student1 = models.User(email="charlie@rvcc.edu", name="Charlie", role="student")
student2 = models.User(email="jackson@uccc", name="Jackson", role="student")
student3 = models.User(email="mark@rvcc.edu", name="Mark", role="student")
student4 = models.user(email="john@mccc", name="John", role="student")

db.add_all([mentor1, mentor2, mentor3, mentor4, student1, student2, student3, student4])
db.commit()

# mentor profiles
m1_profile = models.Mentor(user_id=mentor1.id,
                           university="Rutgers",
                           area_of_study="technology",
                           bio="Transfered from RVCC into Rutgers, happy to help with anything!",
                           mentor_email=mentor1.email)

m2_profile = models.Mentor(user_id=mentor2.id,
                           university="Rutgers",
                           area_of_study="engineering",
                           bio="Transfered from RVCC into Princeton, I'll help you achieve your goals!",
                           mentor_email=mentor2.email)

m3_profile = models.Mentor(user_id=mentor3.id,
                           university="Rutgers",
                           area_of_study="liberal arts",
                           bio="Transfered from UCC into Rutgers, happy to assist!",
                           mentor_email=mentor3.email)

m4_profile = models.Mentor(user_id=mentor4.id,
                           university="Rutgers",
                           area_of_study="engineering",
                           bio="Transfered from MCCC into Rowan University, I'll help you out!",
                           mentor_email=mentor4.email)

# create student profile
s1_profile = models.Student(user_id=student1.id,
                            college="RVCC",
                            intended_area_of_study="liberal arts",
                            student_email=student1.email)

s2_profile = models.Student(user_id=student2.id,
                            college="UCCC",
                            intended_area_of_study="engineering",
                            student_email=student2.email)

s3_profile = models.Student(user_id=student3.id,
                            college="RVCC",
                            intended_area_of_study="engineering",
                            student_email=student3.email)

s4_profile = models.Student(user_id=student4.id,
                            college="MCCC",
                            intended_area_of_study="technology",
                            student_email=student4.email)

db.add_all([m2_profile, m2_profile, m3_profile, m4_profile, s1_profile, s2_profile, s3_profile, s4_profile])
db.commit()



db.close()
print("✅ Seed data inserted successfully")


