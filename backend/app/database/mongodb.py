import motor.motor_asyncio
from decouple import config
import logging

logger = logging.getLogger(__name__)

class MongoDB:
    client: motor.motor_asyncio.AsyncIOMotorClient = None
    database = None

# MongoDB configuration
MONGODB_URL = config("MONGODB_URL", default="mongodb://localhost:27017/interviewpilot")
DATABASE_NAME = config("DATABASE_NAME", default="interviewpilot")

async def connect_to_mongo():
    """Create database connection"""
    try:
        # Debug: Print the actual URL being used
        print(f"DEBUG: Attempting to connect to MongoDB with URL: {MONGODB_URL}")
        logger.info(f"Attempting to connect to MongoDB with URL: {MONGODB_URL}")
        
        MongoDB.client = motor.motor_asyncio.AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=5000  # 5 second timeout
        )
        MongoDB.database = MongoDB.client[DATABASE_NAME]
        
        # Test the connection
        await MongoDB.client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB at {MONGODB_URL}")
        print(f"DEBUG: Successfully connected to MongoDB!")
        
    except Exception as e:
        logger.warning(f"Failed to connect to MongoDB: {str(e)}")
        print(f"DEBUG: Failed to connect to MongoDB: {str(e)}")
        logger.info("Note: You can use MongoDB Atlas or install MongoDB locally")
        # Don't raise the exception, let the app continue

async def close_mongo_connection():
    """Close database connection"""
    if MongoDB.client:
        MongoDB.client.close()
        logger.info("Disconnected from MongoDB")

def get_database():
    """Get database instance"""
    return MongoDB.database

def is_connected():
    """Check if MongoDB is connected"""
    return MongoDB.database is not None
