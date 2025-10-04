from fastapi import FastAPI
from backend.database import Base, engine
from backend import models

Base.metadata.create_all(bind=engine)

# Create the FastAPI app instance
app = FastAPI()

# Root endpoint
@app.get("/")
def root():
    return {"message": "Hello, Transfer Connect!"}

# A simple test endpoint
@app.get("/ping")
def ping():
    return {"status": "ok", "message": "pong"}
