from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from ..models.user_models import UserCreate, UserLogin, Token, UserResponse
from ..services.auth_service import auth_service, get_current_active_user
from ..models.user_models import User
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/signup", response_model=Token)
async def signup(user_data: UserCreate):
    """Register a new user"""
    try:
        # Create user
        user = await auth_service.create_user(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            password=user_data.password
        )
        
        # Create access token
        access_token_expires = timedelta(minutes=30)
        access_token = auth_service.create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        user_response = UserResponse(
            id=str(user.id),
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during signup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during signup"
        )

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Authenticate user and return access token"""
    user = await auth_service.authenticate_user(user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = auth_service.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        is_active=user.is_active,
        created_at=user.created_at
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: User = Depends(get_current_active_user)):
    """Refresh access token"""
    access_token_expires = timedelta(minutes=30)
    access_token = auth_service.create_access_token(
        data={"sub": str(current_user.id)}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )
