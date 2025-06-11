"""
In-memory database implementation for testing
This simulates MongoDB operations using Python dictionaries
"""
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid

class InMemoryDB:
    def __init__(self):
        self.users: Dict[str, Dict] = {}
        self.sessions: Dict[str, Dict] = {}
        
    # User operations
    def create_user(self, user_data: Dict) -> Dict:
        user_id = str(uuid.uuid4())
        user = {
            "_id": user_id,
            "id": user_id,
            **user_data,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        self.users[user_id] = user
        return user
    
    def find_user_by_email(self, email: str) -> Optional[Dict]:
        for user in self.users.values():
            if user.get("email") == email:
                return user
        return None
    
    def find_user_by_username(self, username: str) -> Optional[Dict]:
        for user in self.users.values():
            if user.get("username") == username:
                return user
        return None
    
    def find_user_by_id(self, user_id: str) -> Optional[Dict]:
        return self.users.get(user_id)
    
    def update_user(self, user_id: str, update_data: Dict) -> bool:
        if user_id in self.users:
            self.users[user_id].update(update_data)
            self.users[user_id]["updated_at"] = datetime.utcnow()
            return True
        return False
    
    # Session operations
    def create_session(self, session_data: Dict) -> Dict:
        session_id = session_data.get("session_id", str(uuid.uuid4()))
        session = {
            "_id": session_id,
            **session_data,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        self.sessions[session_id] = session
        return session
    
    def find_session(self, session_id: str, user_id: str) -> Optional[Dict]:
        session = self.sessions.get(session_id)
        if session and session.get("user_id") == user_id:
            return session
        return None
    
    def find_sessions_by_user(self, user_id: str) -> List[Dict]:
        return [session for session in self.sessions.values() 
                if session.get("user_id") == user_id]
    
    def update_session(self, session_id: str, user_id: str, update_data: Dict) -> bool:
        session = self.sessions.get(session_id)
        if session and session.get("user_id") == user_id:
            session.update(update_data)
            session["updated_at"] = datetime.utcnow()
            return True
        return False
    
    def delete_session(self, session_id: str, user_id: str) -> bool:
        session = self.sessions.get(session_id)
        if session and session.get("user_id") == user_id:
            del self.sessions[session_id]
            return True
        return False

# Global in-memory database instance
memory_db = InMemoryDB()
