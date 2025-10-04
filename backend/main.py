from fastapi import FastAPI

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
