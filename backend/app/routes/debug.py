from fastapi import APIRouter, HTTPException, Depends
import logging
import os
from datetime import datetime
from decouple import config
from ..services.auth_service import get_current_user
from ..models.user_models import User
from ..services.interview_service import InterviewService
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/cors-test")
async def cors_test():
    """Simple endpoint to test CORS from frontend"""
    return {
        "status": "success",
        "message": "CORS is working!",
        "timestamp": "2025-06-13",
        "backend_url": "https://interviewpilot.onrender.com"
    }

@router.get("/mongodb")
async def debug_mongodb():
    """Debug endpoint to test MongoDB connection"""
    try:
        # Check environment and import the correct MongoDB module
        is_render = os.getenv('RENDER') or config('PORT', default='8000') == '10000'
        mongodb_url = config("MONGODB_URL", default="mongodb://localhost:27017/interviewpilot")
        
        if is_render:
            from ..database.mongodb_render import MongoDB, get_database, is_connected
            env_name = "render"
        else:
            from ..database.mongodb import MongoDB, get_database, is_connected
            env_name = "local"
        
        # Mask password in URL for security
        masked_url = mongodb_url
        if '@' in mongodb_url:
            parts = mongodb_url.split('@')
            if len(parts) > 1:
                user_pass = parts[0].split('//')[-1]
                if ':' in user_pass:
                    user, password = user_pass.split(':', 1)
                    masked_url = mongodb_url.replace(password, '***')
        
        debug_info = {
            "environment": env_name,
            "mongodb_url": masked_url,
            "client_exists": MongoDB.client is not None,
            "database_exists": MongoDB.database is not None,
            "is_connected_check": is_connected()
        }
        
        # Check if MongoDB client exists
        if MongoDB.client is None:
            return {
                "status": "error", 
                "message": "MongoDB client not initialized",
                "debug_info": debug_info,
                "solution": "Check startup logs for MongoDB connection errors"
            }
        
        # Check if database exists
        if MongoDB.database is None:
            return {
                "status": "error", 
                "message": "MongoDB database instance is None",
                "debug_info": debug_info,
                "solution": "Database not set after client initialization"
            }
        
        # Try to ping the database
        try:
            result = await MongoDB.client.admin.command("ping")
            debug_info["ping_result"] = result
            
            # Try to access the database
            db = get_database()
            if db is None:
                return {
                    "status": "error", 
                    "message": "get_database() returned None",
                    "debug_info": debug_info
                }
            
            # Try a simple database operation
            collections = await db.list_collection_names()
            debug_info["collections"] = collections
            
            return {
                "status": "success", 
                "message": "MongoDB connection working perfectly!",
                "debug_info": debug_info
            }
            
        except Exception as ping_error:
            debug_info["ping_error"] = str(ping_error)
            return {
                "status": "error", 
                "message": f"MongoDB ping failed: {str(ping_error)}",
                "debug_info": debug_info
            }
        
    except Exception as e:
        logger.error(f"MongoDB debug error: {str(e)}")
        return {
            "status": "error", 
            "message": f"Debug endpoint error: {str(e)}",
            "debug_info": {"error": str(e)}
        }

@router.get("/test-session-creation")
async def test_session_creation(current_user: User = Depends(get_current_user)):
    """Test session creation to debug database storage issues"""
    try:
        interview_service = InterviewService()
        
        # Test session data
        session_data = {
            "interviewer_type": "hr",
            "difficulty": "medium",
            "job_description": "Test job description",
            "resume_text": "Test resume",
            "questions": ["Test question 1", "Test question 2"]
        }
        
        # Create session
        session = await interview_service.create_session(current_user, session_data)
        
        # Try to retrieve the session to verify it was saved
        retrieved_session = await interview_service.get_session(session.session_id, str(current_user.id))
        
        # Check database connection
        is_render = os.getenv('RENDER') or config('PORT', default='8000') == '10000'
        if is_render:
            from ..database.mongodb_render import get_database, is_connected
        else:
            from ..database.mongodb import get_database, is_connected
            
        db_connected = is_connected()
        
        if db_connected:
            db = get_database()
            sessions_collection = db.interview_sessions
            # Count total sessions for this user
            session_count = await sessions_collection.count_documents({"user_id": str(current_user.id)})
        else:
            session_count = 0
        
        return {
            "status": "success",
            "created_session": {
                "session_id": session.session_id,
                "user_id": session.user_id,
                "interviewer_type": session.interviewer_type
            },
            "retrieved_session_exists": retrieved_session is not None,
            "database_connected": db_connected,
            "total_sessions_for_user": session_count,
            "user_id": str(current_user.id)
        }
        
    except Exception as e:
        logger.error(f"Error in test session creation: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "user_id": str(current_user.id) if current_user else "no_user"
        }

@router.post("/test-session")
async def test_session_creation(current_user: User = Depends(get_current_user)):
    """Debug endpoint to test session creation"""
    try:
        from ..database import is_connected, get_database
        interview_service = InterviewService()
        
        # Check MongoDB connection status
        mongodb_connected = is_connected()
        logger.info(f"MongoDB connection status: {mongodb_connected}")
        
        # Create a test session
        test_session_data = {
            "interviewer_type": "hr",
            "difficulty": "easy",
            "job_description": "Debug test job description",
            "resume_text": "Debug test resume text",
            "questions": ["Test question 1", "Test question 2"]
        }
        
        session = await interview_service.create_session(current_user, test_session_data)
        
        # Verify the session was created by trying to retrieve it
        retrieved_session = await interview_service.get_session(session.session_id, str(current_user.id))
        
        # If MongoDB is connected, also check if session exists in database
        database_check = None
        if mongodb_connected:
            try:
                db = get_database()
                sessions_collection = db.interview_sessions
                db_session = await sessions_collection.find_one({"session_id": session.session_id})
                database_check = db_session is not None
            except Exception as e:
                database_check = f"Error: {str(e)}"
        
        return {
            "status": "success",
            "message": "Test session created and verified",
            "mongodb_connected": mongodb_connected,
            "session_id": session.session_id,
            "user_id": str(current_user.id),
            "retrieved_via_service": retrieved_session is not None,
            "exists_in_database": database_check,
            "session_data": {
                "interviewer_type": session.interviewer_type,
                "difficulty": session.difficulty,
                "questions_count": len(session.questions)
            }
        }
        
    except Exception as e:
        logger.error(f"Error creating test session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Session creation failed: {str(e)}")

@router.get("/recordings")
async def debug_recordings():
    """Debug endpoint to check recordings in database"""
    try:
        from ..database import get_database, is_connected
        from ..database.memory_db import memory_db
        
        result = {
            "mongodb_connected": is_connected(),
            "recordings_count": 0,
            "recordings": []
        }
        
        if is_connected():
            db = get_database()
            recordings_collection = db.interview_recordings
            
            # Count total recordings
            count = await recordings_collection.count_documents({})
            result["recordings_count"] = count
            
            # Get first 10 recordings (without audio_data for brevity)
            cursor = recordings_collection.find({}).limit(10)
            recordings = []
            async for recording in cursor:
                recording_copy = recording.copy()
                recording_copy.pop("audio_data", None)  # Remove large audio data
                recording_copy["_id"] = str(recording_copy["_id"])  # Convert ObjectId to string
                recordings.append(recording_copy)
            
            result["recordings"] = recordings
        else:
            # Check memory database
            if hasattr(memory_db, 'recordings'):
                result["recordings_count"] = len(memory_db.recordings)
                result["recordings"] = [
                    {k: v for k, v in recording.items() if k != "audio_data"}
                    for recording in list(memory_db.recordings.values())[:10]
                ]
            else:
                result["recordings_count"] = 0
                result["recordings"] = []
        
        return result
        
    except Exception as e:
        logger.error(f"Debug recordings error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Debug error: {str(e)}")

@router.get("/current-user")
async def debug_current_user(current_user: User = Depends(get_current_user)):
    """Debug endpoint to check current user information"""
    try:
        return {
            "user_id": str(current_user.id),
            "username": getattr(current_user, 'username', 'N/A'),
            "email": getattr(current_user, 'email', 'N/A'),
            "user_object": {
                "id": str(current_user.id),
                "attributes": [attr for attr in dir(current_user) if not attr.startswith('_')]
            }
        }
    except Exception as e:
        logger.error(f"Debug current user error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Debug error: {str(e)}")

@router.post("/create-test-recording")
async def create_test_recording(current_user: User = Depends(get_current_user)):
    """Create a test recording for the current user for testing purposes"""
    try:
        import base64
        from ..services.interview_service import InterviewService
        
        interview_service = InterviewService()
        
        # Create dummy audio data (small base64 encoded audio)
        dummy_audio = base64.b64encode(b"dummy audio data for testing").decode('utf-8')
        
        recording_data = {
            'user_id': str(current_user.id),
            'session_id': 'test-session-' + str(current_user.id),
            'question_index': 0,
            'audio_data': dummy_audio,
            'duration': 5.0,
            'transcript': 'This is a test recording for voice analysis',
            'file_size': len(dummy_audio),
            'mime_type': 'audio/webm',
            'created_at': datetime.now()
        }
        
        recording_id = await interview_service.save_recording(recording_data)
        
        return {
            "success": True,
            "recording_id": recording_id,
            "user_id": str(current_user.id),
            "message": "Test recording created successfully"
        }
        
    except Exception as e:
        logger.error(f"Error creating test recording: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating test recording: {str(e)}")
