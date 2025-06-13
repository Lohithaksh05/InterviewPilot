from fastapi import APIRouter, HTTPException
import logging
import os
from decouple import config

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
