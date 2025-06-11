import motor.motor_asyncio
from decouple import config
import logging

logger = logging.getLogger(__name__)

class MongoDB:
    client: motor.motor_asyncio.AsyncIOMotorClient = None
    database = None

# MongoDB configuration
MONGODB_URL = config("MONGODB_URL", default="mongodb://localhost:27017")
DATABASE_NAME = config("DATABASE_NAME", default="interviewpilot")

async def connect_to_mongo():
    """Create database connection"""
    try:
        MongoDB.client = motor.motor_asyncio.AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=5000  # 5 second timeout
        )
        MongoDB.database = MongoDB.client[DATABASE_NAME]
        
        # Test the connection
        await MongoDB.client.admin.command('ping')
        logger.info(f"Connected to MongoDB at {MONGODB_URL}")
        
    except Exception as e:
        logger.warning(f"Failed to connect to MongoDB: {str(e)}")
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
