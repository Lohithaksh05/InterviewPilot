from fastapi import APIRouter, HTTPException
from ..database.mongodb import get_database, is_connected
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/debug/mongodb")
async def debug_mongodb():
    """Debug endpoint to test MongoDB connection"""
    try:
        # Check if MongoDB is connected
        if not is_connected():
            return {"status": "error", "message": "MongoDB not connected"}
        
        # Try to access database
        db = get_database()
        if db is None:
            return {"status": "error", "message": "Database instance is None"}
        
        # Try a simple database operation
        result = await db.command("ping")
        
        return {
            "status": "success", 
            "message": "MongoDB connection working",
            "ping_result": result
        }
    except Exception as e:
        logger.error(f"MongoDB debug error: {str(e)}")
        return {
            "status": "error", 
            "message": f"MongoDB error: {str(e)}"
        }
