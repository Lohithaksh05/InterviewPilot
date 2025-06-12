import motor.motor_asyncio
from decouple import config
import logging
import asyncio

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
        
        # Enhanced MongoDB client configuration for cloud deployment
        MongoDB.client = motor.motor_asyncio.AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=30000,  # Increased timeout to 30 seconds
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            maxPoolSize=10,
            retryWrites=True,
            w='majority',
            # SSL/TLS configuration
            tls=True,
            tlsInsecure=False,
            tlsAllowInvalidCertificates=False,
            tlsAllowInvalidHostnames=False
        )
        MongoDB.database = MongoDB.client[DATABASE_NAME]
        
        # Test the connection with retries
        max_retries = 3
        for attempt in range(max_retries):
            try:
                await MongoDB.client.admin.command('ping')
                logger.info(f"Successfully connected to MongoDB at {MONGODB_URL}")
                print(f"DEBUG: Successfully connected to MongoDB on attempt {attempt + 1}!")
                return
            except Exception as retry_error:
                print(f"DEBUG: Connection attempt {attempt + 1} failed: {retry_error}")
                if attempt == max_retries - 1:
                    raise retry_error
                await asyncio.sleep(2)  # Wait 2 seconds before retry
        
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
