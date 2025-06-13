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
        # Debug: Print the actual URL being used (mask password)
        masked_url = MONGODB_URL
        if '@' in MONGODB_URL:
            parts = MONGODB_URL.split('@')
            if len(parts) > 1:
                user_pass = parts[0].split('//')[-1]
                if ':' in user_pass:
                    user, password = user_pass.split(':', 1)
                    masked_url = MONGODB_URL.replace(password, '***')
        
        print(f"DEBUG: Attempting to connect to MongoDB with URL: {masked_url}")
        logger.info(f"Attempting to connect to MongoDB")
        
        # Try different connection strategies for Render compatibility
        if 'mongodb+srv://' in MONGODB_URL:
            print("DEBUG: Configuring for MongoDB Atlas on Render...")
            
            # Strategy 1: Basic SRV connection (most reliable for Atlas)
            try:
                print("DEBUG: Trying basic SRV connection (Strategy 1)...")
                MongoDB.client = motor.motor_asyncio.AsyncIOMotorClient(
                    MONGODB_URL,
                    serverSelectionTimeoutMS=30000,
                    connectTimeoutMS=20000,
                    socketTimeoutMS=20000,
                    maxPoolSize=10,
                    minPoolSize=1,
                    retryWrites=True
                )
                MongoDB.database = MongoDB.client[DATABASE_NAME]
                
                # Test the connection
                print("DEBUG: Testing basic SRV connection...")
                result = await MongoDB.client.admin.command('ping')
                print(f"DEBUG: Ping result: {result}")
                logger.info(f"Successfully connected to MongoDB with basic SRV!")
                print(f"DEBUG: Successfully connected to MongoDB with basic SRV!")
                return
                
            except Exception as e1:
                print(f"DEBUG: Basic SRV connection failed: {e1}")
                
                # Strategy 2: SRV with explicit SSL settings
                try:
                    print("DEBUG: Trying SRV with explicit SSL settings (Strategy 2)...")
                    MongoDB.client = motor.motor_asyncio.AsyncIOMotorClient(
                        MONGODB_URL,
                        serverSelectionTimeoutMS=30000,
                        connectTimeoutMS=20000,
                        socketTimeoutMS=20000,
                        maxPoolSize=10,
                        ssl=True,
                        ssl_cert_reqs='CERT_NONE'  # Disable certificate verification
                    )
                    MongoDB.database = MongoDB.client[DATABASE_NAME]
                    
                    # Test the connection
                    print("DEBUG: Testing SRV with SSL settings...")
                    result = await MongoDB.client.admin.command('ping')
                    print(f"DEBUG: Ping result: {result}")
                    logger.info(f"Successfully connected to MongoDB with SSL settings!")
                    print(f"DEBUG: Successfully connected to MongoDB with SSL settings!")
                    return
                    
                except Exception as e2:
                    print(f"DEBUG: SSL settings connection failed: {e2}")
                    
                    # Strategy 3: Minimal connection options
                    try:
                        print("DEBUG: Trying minimal connection options (Strategy 3)...")
                        MongoDB.client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
                        MongoDB.database = MongoDB.client[DATABASE_NAME]
                        
                        # Test the connection with longer timeout
                        print("DEBUG: Testing minimal connection...")
                        result = await MongoDB.client.admin.command('ping')
                        print(f"DEBUG: Ping result: {result}")
                        logger.info(f"Successfully connected to MongoDB with minimal options!")
                        print(f"DEBUG: Successfully connected to MongoDB with minimal options!")
                        return
                    except Exception as e3:
                        print(f"DEBUG: Minimal connection failed: {e3}")
                        print(f"DEBUG: All MongoDB Atlas connection strategies failed")
                        # Don't raise - let the app continue without MongoDB
                        logger.error(f"All MongoDB connection strategies failed: {e3}")
                        return
                        
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
            print("DEBUG: Testing local MongoDB connection...")
            result = await MongoDB.client.admin.command('ping')
            print(f"DEBUG: Local ping result: {result}")
            logger.info(f"Successfully connected to local MongoDB!")
            print(f"DEBUG: Successfully connected to local MongoDB!")
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        print(f"DEBUG: MongoDB connection error: {str(e)}")
        print(f"DEBUG: Continuing without MongoDB connection...")
        # For Render deployment, continue without MongoDB rather than crashing
        # But make sure client and database are None so debug endpoint shows correct status
        MongoDB.client = None
        MongoDB.database = None

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
