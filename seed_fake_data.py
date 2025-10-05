import requests
import random
from faker import Faker

API_BASE = "http://127.0.0.1:8000"
fake = Faker()

FIELDS_OF_STUDY = [
    "science", "technology", "engineering", "math",
    "liberal arts", "pre-med", "pre-law", "art",
    "other", "undecided"
]
NJ_COLLEGES_MENTORS = ["Bloomfield College of Montclair State University",
"Caldwell University",
"Centenary University",
"Drew University",
"Fairleigh Dickinson University",
"Felician University",
"Georgian Court University",
"Kean University",
"Monmouth University",
"Montclair State University",
"New Jersey City University",
"New Jersey Institute of Technology",
"Pillar College",
"Princeton University",
"Ramapo College of New Jersey",
"Rider University",
"Rowan College at Burlington County",
"Rowan College of South Jersey",
"Rowan University",
"Rutgers University Camden",
"Rutgers University New Brunswick",
"Rutgers University Newark",
"Saint Elizabeth University",
"Saint Peter’s University",
"Seton Hall University",
"Stevens Institute of Technology",
"Stockton University",
"The College of New Jersey",
"Thomas Edison State University",
"Union College of Union County, NJ",
"William Paterson University of New Jersey"
]
NJ_COLLEGES_STUDENTS = [
    "Atlantic Cape Community College",
  "Bergen Community College",
  "Bloomfield College of Montclair State University",
  "Brookdale Community College",
  "Caldwell University",
  "Camden County College",
  "Centenary University",
  "County College of Morris",
  "Drew University",
  "Essex County College",
  "Fairleigh Dickinson University",
  "Felician University",
  "Georgian Court University",
  "Hudson County Community College",
  "Kean University",
  "Mercer County Community College",
  "Middlesex Community College",
  "Monmouth University",
  "Montclair State University",
  "New Jersey City University",
  "New Jersey Institute of Technology",
  "Ocean County College",
  "Passaic County Community College",
  "Pillar College",
  "Princeton University",
  "Ramapo College of New Jersey",
  "Raritan Valley Community College",
  "Rider University",
  "Rowan College at Burlington County",
  "Rowan College of South Jersey",
  "Rowan University",
  "Rutgers University Camden",
  "Rutgers University New Brunswick",
  "Rutgers University Newark",
  "Saint Elizabeth University",
  "Saint Peter’s University",
  "Salem Community College",
  "Seton Hall University",
  "Stevens Institute of Technology",
  "Stockton University",
  "Sussex County Community College",
  "The College of New Jersey",
  "Thomas Edison State University",
  "Union College of Union County, NJ",
  "Warren County Community College",
  "William Paterson University of New Jersey"
]

def signup_fake_user():
    role = random.choice(["Student", "Student", "Mentor"])
    name = fake.name()
    email = fake.unique.email()
    password = "password123"
    previous_school = ""
    field = random.choice(FIELDS_OF_STUDY)
    if(role == "Student"): school = random.choice(NJ_COLLEGES_STUDENTS)
    if(role == "Mentor"): 
        school = random.choice(NJ_COLLEGES_MENTORS)
        previous_school = random.choice(NJ_COLLEGES_MENTORS)
    payload = {
        "name": name,
        "email": email,
        "password": password,
        "role": role,
        "school": school,
        "previous_school": previous_school,
        "area_of_study": field,
    }

    try:
        r = requests.post(f"{API_BASE}/signup", json=payload)
        if r.status_code == 200:
            data = r.json()
            print(f"✅ Created {role}: {data['email']} ({school}, {field})")
            return data
        else:
            print(f"❌ Failed ({r.status_code}): {r.text}")
    except Exception as e:
        print(f"⚠️ Error: {e}")

def main():
    print("🚀 Seeding fake users...")
    for _ in range(100):
        signup_fake_user()

    print("🎉 Done seeding demo data!")

if __name__ == "__main__":
    main()
