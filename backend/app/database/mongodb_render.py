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
    """Create database connection with Render-specific SSL configuration"""
    try:
        # Debug: Print the actual URL being used
        print(f"DEBUG: Attempting to connect to MongoDB with URL: {MONGODB_URL}")
        logger.info(f"Attempting to connect to MongoDB with URL: {MONGODB_URL}")
        
        # Render-optimized connection settings
        if 'mongodb+srv://' in MONGODB_URL:
            # For MongoDB Atlas on Render - use most permissive SSL settings
            print("DEBUG: Configuring for MongoDB Atlas on Render...")
            MongoDB.client = motor.motor_asyncio.AsyncIOMotorClient(
                MONGODB_URL,
                serverSelectionTimeoutMS=60000,
                connectTimeoutMS=60000,
                socketTimeoutMS=60000,
                maxPoolSize=5,  # Reduced pool size for free tier
                retryWrites=True,
                w='majority',
                tls=True,
                tlsInsecure=True,  # Bypass SSL certificate validation
                directConnection=False,  # Use replica set
                ssl_cert_reqs=None  # No certificate requirements
            )
        else:
            # For local MongoDB
            print("DEBUG: Configuring for local MongoDB...")
            MongoDB.client = motor.motor_asyncio.AsyncIOMotorClient(
                MONGODB_URL,
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000
            )
        
        MongoDB.database = MongoDB.client[DATABASE_NAME]
        
        # Test the connection
        print("DEBUG: Testing MongoDB connection...")
        await MongoDB.client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB!")
        print(f"DEBUG: Successfully connected to MongoDB!")
        
    except Exception as e:
        logger.warning(f"Failed to connect to MongoDB: {str(e)}")
        print(f"DEBUG: MongoDB connection failed: {str(e)}")
        # For Render deployment, continue without MongoDB rather than crashing
        print("DEBUG: Continuing without MongoDB connection...")

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
