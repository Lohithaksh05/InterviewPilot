from typing import List, Optional, Dict, Any
from datetime import datetime
from ..database import get_database
from ..database.memory_db import memory_db
from ..database.mongodb import is_connected
from ..models.interview_models import InterviewSession, InterviewSummary
from ..models.user_models import User
import uuid
import logging

logger = logging.getLogger(__name__)

class InterviewService:
    def __init__(self):
        pass

    async def create_session(self, user: User, session_data: dict) -> InterviewSession:
        """Create a new interview session"""
        session_id = str(uuid.uuid4())
        
        session = InterviewSession(
            id=session_id,  # Set the MongoDB _id to the same value as session_id
            session_id=session_id,
            user_id=str(user.id),
            interviewer_type=session_data["interviewer_type"],
            difficulty=session_data["difficulty"],
            job_description=session_data["job_description"],
            resume_text=session_data["resume_text"],
            questions=session_data.get("questions", []),            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        try:
            if is_connected():
                # Use MongoDB
                db = get_database()
                sessions_collection = db.interview_sessions
                session_dict = session.dict(by_alias=True)
                result = await sessions_collection.insert_one(session_dict)
                logger.info(f"Created session {session_id} in MongoDB")
            else:
                # Use in-memory database
                session_dict = session.dict()
                memory_db.create_session(session_dict)
                logger.info(f"Created session {session_id} in memory database")
        except Exception as e:
            logger.error(f"Error creating session: {str(e)}")
            # Fallback to memory database
            session_dict = session.dict()
            memory_db.create_session(session_dict)
            logger.info(f"Created session {session_id} in memory database (fallback)")
        
        return session

    async def get_session(self, session_id: str, user_id: str) -> Optional[InterviewSession]:
        """Get interview session by ID for specific user"""
        try:
            if is_connected():
                # Use MongoDB
                db = get_database()
                sessions_collection = db.interview_sessions
                
                session_data = await sessions_collection.find_one({
                    "session_id": session_id,
                    "user_id": user_id
                })
                
                if session_data:
                    return InterviewSession(**session_data)
            else:
                # Use in-memory database
                session_data = memory_db.find_session(session_id, user_id)
                if session_data:
                    return InterviewSession(**session_data)
        except Exception as e:
            logger.error(f"Error getting session: {str(e)}")
            # Fallback to memory database
            session_data = memory_db.find_session(session_id, user_id)
            if session_data:
                return InterviewSession(**session_data)
        
        return None

    async def add_answer(self, session_id: str, user_id: str, answer: str, feedback: dict) -> bool:
        """Add answer and feedback to session"""
        try:
            if is_connected():
                # Use MongoDB
                db = get_database()
                sessions_collection = db.interview_sessions
                
                result = await sessions_collection.update_one(
                    {"session_id": session_id, "user_id": user_id},
                    {
                        "$push": {
                            "answers": answer,
                            "feedback": feedback
                        },
                        "$set": {"updated_at": datetime.utcnow()}
                    }
                )
                return result.modified_count > 0
            else:
                # Use in-memory database
                session_data = memory_db.find_session(session_id, user_id)
                if session_data:
                    session_data["answers"].append(answer)
                    session_data["feedback"].append(feedback)
                    session_data["updated_at"] = datetime.utcnow()
                    return True
        except Exception as e:
            logger.error(f"Error adding answer: {str(e)}")
            # Fallback to memory database
            session_data = memory_db.find_session(session_id, user_id)
            if session_data:
                session_data["answers"].append(answer)
                session_data["feedback"].append(feedback)
                session_data["updated_at"] = datetime.utcnow()
                return True
        
        return False

    async def update_session_completion(self, session_id: str, user_id: str, completed: bool) -> bool:
        """Update session completion status"""
        try:
            if is_connected():
                # Use MongoDB
                db = get_database()
                sessions_collection = db.interview_sessions
                
                result = await sessions_collection.update_one(
                    {"session_id": session_id, "user_id": user_id},
                    {
                        "$set": {
                            "completed": completed,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                return result.modified_count > 0
            else:
                # Use in-memory database
                session_data = memory_db.find_session(session_id, user_id)
                if session_data:
                    session_data["completed"] = completed
                    session_data["updated_at"] = datetime.utcnow()
                    return True
        except Exception as e:
            logger.error(f"Error updating session completion: {str(e)}")
            # Fallback to memory database
            session_data = memory_db.find_session(session_id, user_id)
            if session_data:
                session_data["completed"] = completed
                session_data["updated_at"] = datetime.utcnow()
                return True
        
        return False

    async def get_user_sessions(self, user_id: str) -> List[InterviewSession]:
        """Get all sessions for a user"""
        try:
            if is_connected():
                # Use MongoDB
                db = get_database()
                sessions_collection = db.interview_sessions
                
                cursor = sessions_collection.find({"user_id": user_id})
                sessions = []
                async for session_data in cursor:
                    sessions.append(InterviewSession(**session_data))
                return sessions
            else:
                # Use in-memory database
                sessions_data = memory_db.find_sessions_by_user(user_id)
                return [InterviewSession(**session) for session in sessions_data]
        except Exception as e:
            logger.error(f"Error getting user sessions: {str(e)}")
            # Fallback to memory database
            sessions_data = memory_db.find_sessions_by_user(user_id)
            return [InterviewSession(**session) for session in sessions_data]

    async def delete_session(self, session_id: str, user_id: str) -> bool:
        """Delete a session"""
        try:
            if is_connected():
                # Use MongoDB
                db = get_database()
                sessions_collection = db.interview_sessions
                
                result = await sessions_collection.delete_one({
                    "session_id": session_id,
                    "user_id": user_id
                })
                return result.deleted_count > 0
            else:
                # Use in-memory database
                return memory_db.delete_session(session_id, user_id)
        except Exception as e:
            logger.error(f"Error deleting session: {str(e)}")
            # Fallback to memory database
            return memory_db.delete_session(session_id, user_id)

    async def get_user_stats(self, user_id: str) -> dict:
        """Get user statistics"""
        try:
            sessions = await self.get_user_sessions(user_id)
            
            total_sessions = len(sessions)
            completed_sessions = sum(1 for s in sessions if getattr(s, 'completed', False))
            total_questions = sum(len(s.questions) for s in sessions)
            total_answers = sum(len(s.answers) for s in sessions)
            
            # Calculate average score
            all_feedback = []
            for session in sessions:
                for feedback in session.feedback:
                    if isinstance(feedback, dict) and 'score' in feedback:
                        try:
                            score = float(feedback['score'])
                            all_feedback.append(score)
                        except (ValueError, TypeError):
                            continue
            
            avg_score = sum(all_feedback) / len(all_feedback) if all_feedback else 0
            
            return {
                "total_sessions": total_sessions,
                "completed_sessions": completed_sessions,
                "total_questions": total_questions,
                "total_answers": total_answers,
                "average_score": round(avg_score, 2),
                "completion_rate": round(completed_sessions / total_sessions * 100, 1) if total_sessions > 0 else 0
            }
        except Exception as e:
            logger.error(f"Error getting user stats: {str(e)}")
            return {
                "total_sessions": 0,
                "completed_sessions": 0,
                "total_questions": 0,
                "total_answers": 0,
                "average_score": 0,
                "completion_rate": 0
            }

    async def save_recording(self, recording_data: dict) -> str:
        """Save audio recording to database"""
        try:
            from ..models.interview_models import InterviewRecording
            
            # Generate custom recording ID
            recording_id = str(uuid.uuid4())
            
            # Create recording document
            recording = InterviewRecording(
                recording_id=recording_id,  # Use custom string ID
                user_id=str(recording_data['user_id']),  # Keep as string
                session_id=str(recording_data['session_id']),  # Keep as string
                question_index=recording_data['question_index'],
                audio_data=recording_data['audio_data'],
                duration=recording_data['duration'],
                transcript=recording_data.get('transcript', ''),
                file_size=recording_data['file_size'],
                mime_type=recording_data['mime_type'],                created_at=recording_data['created_at']
            )
            
            if is_connected():
                # Use MongoDB
                db = get_database()
                recordings_collection = db.interview_recordings
                result = await recordings_collection.insert_one(recording.dict(by_alias=True))
                logger.info(f"Recording saved to MongoDB for session: {recording_data['session_id']}")
            else:
                # Use in-memory database (simplified storage)
                if not hasattr(memory_db, 'recordings'):
                    memory_db.recordings = {}
                memory_db.recordings[recording_id] = recording.dict()
                logger.info(f"Recording saved to memory database")
                
            return recording_id
            
        except Exception as e:
            logger.error(f"Error saving recording: {str(e)}")
            raise

    async def get_session_recordings(self, session_id: str) -> List[dict]:
        """Get all recordings for a specific session"""
        try:
            if is_connected():
                # Use MongoDB
                db = get_database()
                recordings_collection = db.interview_recordings
                
                # Query by session_id as string (no ObjectId conversion needed)
                cursor = recordings_collection.find({
                    "session_id": session_id
                }).sort("question_index", 1)
                recordings = []
                async for recording in cursor:
                    # Use recording_id if available, otherwise use _id
                    recording_id = recording.get('_id', str(recording.get('_id')))
                    recording["recording_id"] = recording_id
                    recording["user_id"] = str(recording["user_id"])
                    # session_id is already a string, no conversion needed
                    # Don't include large audio_data in list response
                    recording.pop("audio_data", None)
                    recordings.append(recording)
                    
                return recordings
            else:
                # Use in-memory database
                if not hasattr(memory_db, 'recordings'):
                    return []
                    
                recordings = []
                for recording_id, recording in memory_db.recordings.items():
                    if recording.get('session_id') == session_id:
                        # Don't include large audio_data in list response
                        recording_copy = recording.copy()
                        recording_copy.pop("audio_data", None)
                        recording_copy['_id'] = recording_id
                        recordings.append(recording_copy)
                # Sort by question_index
                recordings.sort(key=lambda x: x.get('question_index', 0))
                logger.info(f"Retrieved {len(recordings)} recordings for session {session_id} from memory")
                return recordings
                
        except Exception as e:
            logger.error(f"Error getting session recordings: {str(e)}")
            raise

    async def get_recording(self, recording_id: str) -> Optional[dict]:
        """Get a specific recording including audio data"""
        try:
            if is_connected():
                # Use MongoDB
                db = get_database()
                recordings_collection = db.interview_recordings
                
                # Query by recording_id field instead of _id ObjectId
                query = {"_id": recording_id}  # Since recording_id is stored as _id
                
                recording = await recordings_collection.find_one(query)
                
                if recording:
                    recording["recording_id"] = str(recording["_id"])
                    recording["user_id"] = str(recording["user_id"])
                    # session_id is already a string, no conversion needed
                    return recording
                else:
                    return None
            else:
                # Use in-memory database
                if hasattr(memory_db, 'recordings') and recording_id in memory_db.recordings:
                    recording = memory_db.recordings[recording_id].copy()
                    recording['_id'] = recording_id
                    return recording
                else:
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting recording {recording_id}: {str(e)}")
            return None
