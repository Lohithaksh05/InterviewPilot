from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from decouple import config
from ..database import get_database
from ..database.memory_db import memory_db
from ..database.mongodb import is_connected
from ..models.user_models import User, TokenData
import logging

logger = logging.getLogger(__name__)

# Configuration
SECRET_KEY = config("JWT_SECRET_KEY", default="your-secret-key-here-change-in-production")
ALGORITHM = config("JWT_ALGORITHM", default="HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(config("ACCESS_TOKEN_EXPIRE_MINUTES", default="30"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

class AuthService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        return self.pwd_context.hash(password)

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email from database"""
        try:
            if is_connected():
                # Use MongoDB
                db = get_database()
                users_collection = db.users
                
                user_data = await users_collection.find_one({"email": email})
                if user_data:
                    return User(**user_data)
            else:
                # Use in-memory database
                user_data = memory_db.find_user_by_email(email)
                if user_data:
                    return User(**user_data)
        except Exception as e:
            logger.error(f"Error getting user by email: {str(e)}")
            # Fallback to memory database
            user_data = memory_db.find_user_by_email(email)
            if user_data:
                return User(**user_data)
        
        return None

    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username from database"""
        try:
            if is_connected():
                # Use MongoDB
                db = get_database()
                users_collection = db.users
                
                user_data = await users_collection.find_one({"username": username})
                if user_data:
                    return User(**user_data)
            else:
                # Use in-memory database
                user_data = memory_db.find_user_by_username(username)
                if user_data:
                    return User(**user_data)
        except Exception as e:
            logger.error(f"Error getting user by username: {str(e)}")
            # Fallback to memory database
            user_data = memory_db.find_user_by_username(username)
            if user_data:
                return User(**user_data)
        
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID from database"""
        try:
            if is_connected():
                # Use MongoDB
                from bson import ObjectId
                db = get_database()
                users_collection = db.users
                
                user_data = await users_collection.find_one({"_id": ObjectId(user_id)})
                if user_data:
                    return User(**user_data)
            else:
                # Use in-memory database
                user_data = memory_db.find_user_by_id(user_id)
                if user_data:
                    return User(**user_data)
        except Exception as e:
            logger.error(f"Error getting user by ID {user_id}: {str(e)}")
            # Fallback to memory database
            user_data = memory_db.find_user_by_id(user_id)
            if user_data:
                return User(**user_data)
        
        return None

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = await self.get_user_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user

    async def create_user(self, email: str, username: str, full_name: str, password: str) -> User:
        """Create a new user"""
        # Check if user already exists
        existing_user = await self.get_user_by_email(email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        existing_username = await self.get_user_by_username(username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Create user
        hashed_password = self.get_password_hash(password)
        user_data = {
            "email": email,
            "username": username,
            "full_name": full_name,
            "hashed_password": hashed_password,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        try:
            if is_connected():
                # Use MongoDB
                db = get_database()
                users_collection = db.users
                
                result = await users_collection.insert_one(user_data)
                user_data["_id"] = result.inserted_id
                
                return User(**user_data)
            else:
                # Use in-memory database
                user = memory_db.create_user(user_data)
                return User(**user)
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            # Fallback to memory database
            user = memory_db.create_user(user_data)
            return User(**user)

# Create auth service instance
auth_service = AuthService()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception
    
    user = await auth_service.get_user_by_id(user_id=token_data.user_id)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
