"""
MongoDB Connection Test for Render Deployment
"""
import asyncio
import motor.motor_asyncio
from decouple import config
import ssl
import certifi

# Get MongoDB URL from environment
MONGODB_URL = config("MONGODB_URL", default="mongodb://localhost:27017/interviewpilot")
DATABASE_NAME = config("DATABASE_NAME", default="interviewpilot")

async def test_mongodb_connection():
    """Test different MongoDB connection strategies"""
    
    print(f"Testing MongoDB connection...")
    print(f"Database: {DATABASE_NAME}")
    
    # Mask password for logging
    masked_url = MONGODB_URL
    if '@' in MONGODB_URL:
        parts = MONGODB_URL.split('@')
        auth_part = parts[0].split('//')[-1]
        if ':' in auth_part:
            username = auth_part.split(':')[0]
            masked_url = MONGODB_URL.replace(auth_part, f"{username}:***")
    print(f"URL: {masked_url}")
    
    if 'mongodb+srv://' in MONGODB_URL:
        print("\n=== Testing MongoDB Atlas SRV Connection ===")
        
        # Strategy 1: Basic connection with certifi SSL context
        try:
            print("Strategy 1: Using certifi SSL context...")
            client = motor.motor_asyncio.AsyncIOMotorClient(
                MONGODB_URL,
                serverSelectionTimeoutMS=30000,
                tlsCAFile=certifi.where()
            )
            db = client[DATABASE_NAME]
            await client.admin.command('ping')
            print("✅ SUCCESS: Strategy 1 worked!")
            client.close()
            return "certifi_ssl"
        except Exception as e:
            print(f"❌ Strategy 1 failed: {e}")
        
        # Strategy 2: Disable SSL certificate verification
        try:
            print("Strategy 2: Disabling SSL verification...")
            client = motor.motor_asyncio.AsyncIOMotorClient(
                MONGODB_URL,
                serverSelectionTimeoutMS=30000,
                tls=True,
                tlsAllowInvalidCertificates=True,
                tlsAllowInvalidHostnames=True
            )
            db = client[DATABASE_NAME]
            await client.admin.command('ping')
            print("✅ SUCCESS: Strategy 2 worked!")
            client.close()
            return "disabled_ssl_verification"
        except Exception as e:
            print(f"❌ Strategy 2 failed: {e}")
        
        # Strategy 3: No explicit SSL settings (let MongoDB handle it)
        try:
            print("Strategy 3: Default MongoDB settings...")
            client = motor.motor_asyncio.AsyncIOMotorClient(
                MONGODB_URL,
                serverSelectionTimeoutMS=30000
            )
            db = client[DATABASE_NAME]
            await client.admin.command('ping')
            print("✅ SUCCESS: Strategy 3 worked!")
            client.close()
            return "default_settings"
        except Exception as e:
            print(f"❌ Strategy 3 failed: {e}")
        
        # Strategy 4: Convert to standard connection string
        try:
            print("Strategy 4: Converting SRV to standard connection...")
            # This is a simplified conversion - in reality you'd need to resolve SRV records
            standard_url = MONGODB_URL.replace('mongodb+srv://', 'mongodb://')
            if '.mongodb.net/' in standard_url:
                # Add standard ports for Atlas
                standard_url = standard_url.replace('.mongodb.net/', '.mongodb.net:27017/')
            
            client = motor.motor_asyncio.AsyncIOMotorClient(
                standard_url,
                serverSelectionTimeoutMS=30000
            )
            db = client[DATABASE_NAME]
            await client.admin.command('ping')
            print("✅ SUCCESS: Strategy 4 worked!")
            client.close()
            return "standard_connection"
        except Exception as e:
            print(f"❌ Strategy 4 failed: {e}")
        
        print("❌ All MongoDB Atlas strategies failed")
        return None
    
    else:
        print("\n=== Testing Local MongoDB Connection ===")
        try:
            client = motor.motor_asyncio.AsyncIOMotorClient(
                MONGODB_URL,
                serverSelectionTimeoutMS=10000
            )
            db = client[DATABASE_NAME]
            await client.admin.command('ping')
            print("✅ SUCCESS: Local MongoDB connection worked!")
            client.close()
            return "local_connection"
        except Exception as e:
            print(f"❌ Local MongoDB failed: {e}")
            return None

if __name__ == "__main__":
    result = asyncio.run(test_mongodb_connection())
    print(f"\nResult: {result}")
