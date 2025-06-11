from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from app.routes import interview, agents, resume, auth
from app.services.gemini_service import GeminiService
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from decouple import config
import os

# Initialize FastAPI app
app = FastAPI(
    title="InterviewPilot API",
    description="AI-powered interview preparation platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server (CRA)
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",  # Vite dev server alternate
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])

# Database event handlers
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

@app.get("/")
async def root():
    return {"message": "Welcome to InterviewPilot API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
