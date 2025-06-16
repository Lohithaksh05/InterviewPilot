from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from app.routes import interview, agents, resume, templates, analytics, voice_analysis
from app.services.gemini_service import GeminiService
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
        "http://localhost:3000",  # React dev server (old)
        "http://localhost:5173",  # Vite dev server (current)
        "http://127.0.0.1:5173",  # Alternative localhost
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(templates.router, prefix="/api/templates", tags=["templates"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(voice_analysis.router, prefix="/api/voice-analysis", tags=["voice-analysis"])

@app.get("/")
async def root():
    return {"message": "Welcome to InterviewPilot API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
