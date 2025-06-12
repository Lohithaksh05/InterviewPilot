import motor.motor_asyncio
from decouple import config
import logging
import asyncio
import ssl

logger = logging.getLogger(__name__)

class MongoDB:
    client = None
    database = None

# MongoDB configuration
MONGODB_URL = config("MONGODB_URL", default="mongodb://localhost:27017/interviewpilot")
DATABASE_NAME = config("DATABASE_NAME", default="interviewpilot")

async def connect_to_mongo():
    """Create database connection with Render-compatible SSL handling"""
    try:
        # Debug: Print the actual URL being used
        print(f"DEBUG: Attempting to connect to MongoDB with URL: {MONGODB_URL}")
        logger.info(f"Attempting to connect to MongoDB with URL: {MONGODB_URL}")
        
        # Render-compatible MongoDB client configuration
        connection_options = {
            'serverSelectionTimeoutMS': 30000,
            'connectTimeoutMS': 30000,
            'socketTimeoutMS': 30000,
            'maxPoolSize': 10,
            'retryWrites': True,
            'w': 'majority'
        }
        
        # Special SSL configuration for MongoDB Atlas on Render
        if 'mongodb+srv://' in MONGODB_URL:
            # Option 1: Try with minimal TLS settings (most compatible with Render)
            connection_options.update({
                'tls': True,
                'tlsInsecure': True  # This bypasses certificate validation entirely
            })
        print("DEBUG: Attempting connection with Render-compatible SSL settings...")
        MongoDB.client = motor.motor_asyncio.AsyncIOMotorClient(
            MONGODB_URL,
            **connection_options
        )
        MongoDB.database = MongoDB.client[DATABASE_NAME]
        
        # Test the connection with retries
        max_retries = 5
        for attempt in range(max_retries):
            try:
                # Use a shorter timeout for ping
                await asyncio.wait_for(
                    MongoDB.client.admin.command('ping'), 
                    timeout=10.0
                )
                logger.info(f"Successfully connected to MongoDB at {MONGODB_URL}")
                print(f"DEBUG: Successfully connected to MongoDB on attempt {attempt + 1}!")
                return
            except Exception as retry_error:
                print(f"DEBUG: Connection attempt {attempt + 1} failed: {retry_error}")
                if attempt == max_retries - 1:
                    # Try one more time with even more permissive settings
                    print("DEBUG: Trying with most permissive SSL settings...")
                    try:
                        MongoDB.client = motor.motor_asyncio.AsyncIOMotorClient(
                            MONGODB_URL,
                            serverSelectionTimeoutMS=60000,
                            connectTimeoutMS=60000,
                            socketTimeoutMS=60000,
                            tls=True,
                            tlsInsecure=True
                        )
                        MongoDB.database = MongoDB.client[DATABASE_NAME]
                        await asyncio.wait_for(
                            MongoDB.client.admin.command('ping'), 
                            timeout=30.0
                        )
                        print("DEBUG: Connected with permissive SSL settings!")
                        return
                    except Exception as final_error:
                        print(f"DEBUG: Final attempt failed: {final_error}")
                        raise final_error
                await asyncio.sleep(3)  # Wait 3 seconds before retry
        
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
