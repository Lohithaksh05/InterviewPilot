from .resume import router as resume_router
from .agents import router as agents_router  
from .interview import router as interview_router
from .auth import router as auth_router
from .debug import router as debug_router

__all__ = ['resume_router', 'agents_router', 'interview_router', 'auth_router', 'debug_router']
