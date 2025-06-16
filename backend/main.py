from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from app.routes.interview import router as interview_router
from app.routes.agents import router as agents_router
from app.routes.resume import router as resume_router
from app.routes.auth import router as auth_router
from app.routes.debug import router as debug_router
print("DEBUG: Importing templates router...")
from app.routes.templates import router as templates_router
print("DEBUG: Templates router imported successfully")

print("DEBUG: Importing voice analysis router...")
from app.routes.voice_analysis import router as voice_analysis_router
print("DEBUG: Voice analysis router imported successfully")
from app.services.gemini_service import GeminiService
from app.models.template_models import JobRole
from decouple import config
import os

# Import MongoDB connection based on environment
is_render = os.getenv('RENDER') or config('PORT', default='8000') == '10000'
if is_render:
    print("DEBUG: Using Render-optimized MongoDB connection...")
    from app.database.mongodb_render import connect_to_mongo, close_mongo_connection
else:
    print("DEBUG: Using standard MongoDB connection...")
    from app.database.mongodb import connect_to_mongo, close_mongo_connection

# Initialize FastAPI app
app = FastAPI(
    title="InterviewPilot API",
    description="AI-powered interview preparation platform",
    version="1.0.0"
)

# Get environment-specific CORS origins (simplified for personal use)
allowed_origins = config('ALLOWED_ORIGINS', default='*').split(',')

# CORS middleware - Allow both development and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173", 
        "https://interviewpilot-ruddy.vercel.app",
        "https://*.vercel.app",
        "*"  # Fallback for any other origins
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
print("DEBUG: Including auth router...")
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
print("DEBUG: Including interview router...")
app.include_router(interview_router, prefix="/api/interview", tags=["interview"])
print("DEBUG: Including agents router...")
app.include_router(agents_router, prefix="/api/agents", tags=["agents"])
print("DEBUG: Including resume router...")
app.include_router(resume_router, prefix="/api/resume", tags=["resume"])
print("DEBUG: Including templates router...")
app.include_router(templates_router, prefix="/api/templates", tags=["templates"])
print("DEBUG: Including voice analysis router...")
app.include_router(voice_analysis_router, prefix="/api/voice", tags=["voice-analysis"])
print("DEBUG: Including debug router...")
app.include_router(debug_router, prefix="/api/debug", tags=["debug"])
print("DEBUG: All routers included successfully")

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

@app.get("/api/test")
async def test_endpoint():
    return {"message": "Direct test endpoint working", "status": "success"}

@app.get("/api/job-roles")
async def get_job_roles():
    """Get all available job roles"""
    try:
        job_roles = [
            {
                "value": role.value,
                "label": role.value.replace("_", " ").title()
            }
            for role in JobRole
        ]
        return {
            "job_roles": job_roles,
            "count": len(job_roles)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch job roles: {str(e)}")

if __name__ == "__main__":
    # Get port from environment variable (Render uses PORT=10000)
    port = int(config('PORT', default='8000'))
    host = config('HOST', default='0.0.0.0')
    debug = config('DEBUG', default=True, cast=bool)
    
    print(f"DEBUG: Starting server on {host}:{port}")
    uvicorn.run(
        "main:app", 
        host=host, 
        port=port, 
        reload=debug
    )
