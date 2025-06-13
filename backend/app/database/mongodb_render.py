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
        masked_url = MONGODB_URL.replace(MONGODB_URL.split('@')[0].split('//')[1].split(':')[1], '***')
        print(f"DEBUG: Attempting to connect to MongoDB with URL: {masked_url}")
        logger.info(f"Attempting to connect to MongoDB")
        
        # Try different connection strategies for Render compatibility
        if 'mongodb+srv://' in MONGODB_URL:
            print("DEBUG: Configuring for MongoDB Atlas on Render...")
            
            # Strategy 1: Convert SRV to standard connection string
            try:
                print("DEBUG: Trying standard MongoDB connection string...")
                # Convert mongodb+srv to standard mongodb connection
                standard_url = MONGODB_URL.replace('mongodb+srv://', 'mongodb://')
                # Remove the SRV suffix and add standard MongoDB ports
                if '.mongodb.net/' in standard_url:
                    standard_url = standard_url.replace('.mongodb.net/', '.mongodb.net:27017/')
                
                MongoDB.client = motor.motor_asyncio.AsyncIOMotorClient(
                    standard_url,
                    serverSelectionTimeoutMS=30000,
                    connectTimeoutMS=30000,
                    socketTimeoutMS=30000,
                    maxPoolSize=5
                )
                MongoDB.database = MongoDB.client[DATABASE_NAME]
                
                # Test the connection
                print("DEBUG: Testing standard MongoDB connection...")
                await MongoDB.client.admin.command('ping')
                logger.info(f"Successfully connected to MongoDB with standard connection!")
                print(f"DEBUG: Successfully connected to MongoDB with standard connection!")
                return
                
            except Exception as e1:
                print(f"DEBUG: Standard connection failed: {e1}")
                
                # Strategy 2: SRV with no SSL
                try:
                    print("DEBUG: Trying SRV without SSL...")
                    MongoDB.client = motor.motor_asyncio.AsyncIOMotorClient(
                        MONGODB_URL,
                        serverSelectionTimeoutMS=30000,
                        connectTimeoutMS=30000,
                        socketTimeoutMS=30000,
                        maxPoolSize=5,
                        ssl=False  # Disable SSL entirely
                    )
                    MongoDB.database = MongoDB.client[DATABASE_NAME]
                    
                    # Test the connection
                    await MongoDB.client.admin.command('ping')
                    logger.info(f"Successfully connected to MongoDB without SSL!")
                    print(f"DEBUG: Successfully connected to MongoDB without SSL!")
                    return
                    
                except Exception as e2:
                    print(f"DEBUG: No-SSL connection failed: {e2}")
                    
                    # Strategy 3: Basic SRV connection (let MongoDB handle SSL automatically)
                    try:
                        print("DEBUG: Trying basic SRV connection...")
                        MongoDB.client = motor.motor_asyncio.AsyncIOMotorClient(
                            MONGODB_URL,
                            serverSelectionTimeoutMS=60000
                        )
                        MongoDB.database = MongoDB.client[DATABASE_NAME]
                        
                        # Test the connection
                        await MongoDB.client.admin.command('ping')
                        logger.info(f"Successfully connected to MongoDB with basic SRV!")
                        print(f"DEBUG: Successfully connected to MongoDB with basic SRV!")
                        return
                        
                    except Exception as e3:
                        print(f"DEBUG: Basic SRV connection failed: {e3}")
                        raise e3
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
        print(f"DEBUG: All MongoDB connection strategies failed")
        print(f"DEBUG: Continuing without MongoDB connection...")
        # For Render deployment, continue without MongoDB rather than crashing

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
