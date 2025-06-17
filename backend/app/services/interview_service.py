from typing import List, Optional, Dict, Any
from datetime import datetime
from ..database import get_database, is_connected
from ..database.memory_db import memory_db
from ..models.interview_models import InterviewSession, InterviewSummary, get_ist_now
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
            id=session_id,  # MongoDB _id
            session_id=session_id,  # Explicit session_id field
            user_id=str(user.id),
            interviewer_type=session_data["interviewer_type"],
            difficulty=session_data["difficulty"],
            job_description=session_data["job_description"],
            resume_text=session_data["resume_text"],
            questions=session_data.get("questions", []),
            duration_minutes=session_data.get("duration_minutes", 30),
            time_limit_enabled=session_data.get("time_limit_enabled", True),
            is_template_based=session_data.get("is_template_based", False),
            template_id=session_data.get("template_id"),
            template_name=session_data.get("template_name"),
            template_job_role=session_data.get("template_job_role"),
            template_question_distribution=session_data.get("template_question_distribution"),
            template_interviewer_types=session_data.get("template_interviewer_types"),
            question_interviewer_types=session_data.get("question_interviewer_types"),
            created_at=get_ist_now(),
            updated_at=get_ist_now()
        )
        
        try:
            if is_connected():
                db = get_database()
                sessions_collection = db.interview_sessions
                session_dict = session.dict(by_alias=True)
                session_dict["_id"] = session_id
                session_dict["session_id"] = session_id
                result = await sessions_collection.insert_one(session_dict)
                logger.info(f"Session {session_id} successfully saved to MongoDB")
                # Return the session object with confirmed session_id
                session.session_id = session_id
                return session
            else:
                logger.warning("MongoDB not connected - using memory database")
                session_dict = session.dict()
                memory_db.create_session(session_dict)
                return session
        except Exception as e:
            logger.error(f"Error creating session in MongoDB: {str(e)}")
            session_dict = session.dict()
            memory_db.create_session(session_dict)
            return session

    async def get_session(self, session_id: str, user_id: str = None) -> Optional[InterviewSession]:
        """Get interview session by ID"""
        logger.info(f"Fetching session: session_id={session_id}")
        try:
            if is_connected():
                db = get_database()
                sessions_collection = db.interview_sessions
                # Query by session_id only
                session_data = await sessions_collection.find_one({
                    "session_id": session_id
                })
                if not session_data:
                    # Fallback: try by _id
                    session_data = await sessions_collection.find_one({
                        "_id": session_id
                    })
                if session_data:
                    logger.info(f"Session found: {session_data.get('session_id', 'unknown')}")
                    return InterviewSession(**session_data)
                else:
                    logger.warning(f"No session found for session_id={session_id}")
            else:
                session_data = memory_db.find_session(session_id, user_id)
                if session_data:
                    return InterviewSession(**session_data)
        except Exception as e:
            logger.error(f"Error getting session: {str(e)}")
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
                        "$set": {"updated_at": get_ist_now()}
                    }
                )
                return result.modified_count > 0
            else:
                # Use in-memory database
                session_data = memory_db.find_session(session_id, user_id)
                if session_data:
                    session_data["answers"].append(answer)
                    session_data["feedback"].append(feedback)
                    session_data["updated_at"] = get_ist_now()
                    return True
        except Exception as e:
            logger.error(f"Error adding answer: {str(e)}")            # Fallback to memory database
            session_data = memory_db.find_session(session_id, user_id)
            if session_data:
                session_data["answers"].append(answer)
                session_data["feedback"].append(feedback)
                session_data["updated_at"] = get_ist_now()
                return True
        
        return False

    async def mark_interview_started(self, session_id: str, user_id: str) -> bool:
        """Mark interview as started with current timestamp"""
        try:
            start_time = get_ist_now()
            
            if is_connected():
                # Use MongoDB
                db = get_database()
                sessions_collection = db.interview_sessions
                
                result = await sessions_collection.update_one(
                    {"session_id": session_id, "user_id": user_id},
                    {
                        "$set": {
                            "started_at": start_time,
                            "updated_at": start_time
                        }
                    }
                )
                return result.modified_count > 0           
            else:
                # Use in-memory database
                session_data = memory_db.find_session(session_id, user_id)
                if session_data:
                    session_data["started_at"] = start_time
                    session_data["updated_at"] = start_time
                    return True
            return False
        except Exception as e:
            logger.error(f"Error marking interview as started: {str(e)}")
            return False

    async def complete_interview(self, session_id: str, user_id: str, time_left_minutes: int = 0) -> bool:
        """Mark interview as completed and calculate minutes taken"""
        try:
            logger.info(f"Completing interview {session_id} for user {user_id}")
            
            # Get the session to check duration
            session = await self.get_session(session_id, user_id)
            if not session:
                logger.error(f"Session {session_id} not found for user {user_id}")
                return False            # Calculate minutes taken: original_duration - time_left
            original_duration = session.duration_minutes
            if not original_duration:
                # Fallback: calculate based on interview parameters
                num_questions = len(session.questions) or 5
                # Simple calculation: 3-5 minutes per question + buffer
                original_duration = max(20, min(60, num_questions * 4 + 10))
                logger.warning(f"No duration_minutes set for session {session_id}, calculated {original_duration} minutes based on {num_questions} questions")
            
            minutes_taken = original_duration - time_left_minutes
            
            logger.info(f"Interview took {minutes_taken} minutes (original: {original_duration}, time left: {time_left_minutes})")
            
            if is_connected():
                # Use MongoDB
                db = get_database()
                sessions_collection = db.interview_sessions
                
                update_data = {
                    "completed": True,
                    "minutes_taken": minutes_taken,
                    "updated_at": get_ist_now()
                }
                
                logger.info(f"Updating MongoDB with data: {update_data}")
                
                result = await sessions_collection.update_one(
                    {"session_id": session_id, "user_id": user_id},
                    {"$set": update_data}
                )
                
                logger.info(f"MongoDB update result: modified_count={result.modified_count}, matched_count={result.matched_count}")
                return result.modified_count > 0
            else:
                # Use in-memory database
                session_data = memory_db.find_session(session_id, user_id)
                if session_data:
                    session_data["completed"] = True
                    session_data["minutes_taken"] = minutes_taken
                    session_data["updated_at"] = get_ist_now()
                    return True
            return False
        except Exception as e:
            logger.error(f"Error completing interview: {str(e)}")
            return False

    async def update_session_completion(self, session_id: str, user_id: str, completed: bool) -> bool:
        """Update session completion status"""
        try:
            if is_connected():
                # Use MongoDB
                db = get_database()
                sessions_collection = db.interview_sessions
                
                result = await sessions_collection.update_one(
                    {"session_id": session_id, "user_id": user_id},                    {
                        "$set": {
                            "completed": completed,
                            "updated_at": get_ist_now()
                        }
                    }
                )
                return result.modified_count > 0
            else:
                # Use in-memory database
                session_data = memory_db.find_session(session_id, user_id)
                if session_data:
                    session_data["completed"] = completed
                    session_data["updated_at"] = get_ist_now()
                    return True
        except Exception as e:
            logger.error(f"Error updating session completion: {str(e)}")            # Fallback to memory database
            session_data = memory_db.find_session(session_id, user_id)
            if session_data:
                session_data["completed"] = completed
                session_data["updated_at"] = get_ist_now()
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
                    try:
                        # Handle both old and new session formats
                        if 'session_id' not in session_data and '_id' in session_data:
                            session_data['session_id'] = str(session_data['_id'])
                          # Ensure required fields exist with defaults
                        session_data.setdefault('is_template_based', False)
                        session_data.setdefault('template_id', None)
                        session_data.setdefault('template_name', None)
                        session_data.setdefault('template_job_role', None)
                        session_data.setdefault('template_question_distribution', None)
                        session_data.setdefault('template_interviewer_types', None)
                        session_data.setdefault('question_interviewer_types', None)
                        session_data.setdefault('started_at', None)
                        session_data.setdefault('ended_at', None)
                        session_data.setdefault('duration_minutes', 30)
                        session_data.setdefault('time_limit_enabled', True)
                        
                        sessions.append(InterviewSession(**session_data))
                    except Exception as e:
                        logger.warning(f"Skipping invalid session data: {str(e)}")
                        continue
                        
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
        """Delete a session and all its related recordings"""
        try:
            if is_connected():
                # Use MongoDB
                db = get_database()
                sessions_collection = db.interview_sessions
                recordings_collection = db.interview_recordings
                
                # First, delete all recordings associated with this session
                recordings_result = await recordings_collection.delete_many({
                    "session_id": session_id
                })
                logger.info(f"Deleted {recordings_result.deleted_count} recordings for session {session_id}")
                
                # Then delete the session itself
                session_result = await sessions_collection.delete_one({
                    "session_id": session_id,
                    "user_id": user_id
                })
                
                session_deleted = session_result.deleted_count > 0
                if session_deleted:
                    logger.info(f"Successfully deleted session {session_id} and {recordings_result.deleted_count} associated recordings")
                else:
                    logger.warning(f"Session {session_id} not found or not owned by user {user_id}")
                
                return session_deleted
            else:
                # Use in-memory database
                # Delete recordings from memory
                if hasattr(memory_db, 'recordings'):
                    recordings_to_delete = [rid for rid, rec in memory_db.recordings.items() 
                                          if rec.get('session_id') == session_id]
                    for rid in recordings_to_delete:
                        del memory_db.recordings[rid]
                    logger.info(f"Deleted {len(recordings_to_delete)} recordings from memory for session {session_id}")
                
                # Delete session from memory
                return memory_db.delete_session(session_id, user_id)
        except Exception as e:
            logger.error(f"Error deleting session and recordings: {str(e)}")
            # Fallback to memory database
            # Delete recordings from memory
            if hasattr(memory_db, 'recordings'):
                recordings_to_delete = [rid for rid, rec in memory_db.recordings.items() 
                                      if rec.get('session_id') == session_id]
                for rid in recordings_to_delete:
                    del memory_db.recordings[rid]
            
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

    async def get_session_recordings_count(self, session_id: str) -> int:
        """Get count of recordings for a session (for delete confirmation)"""
        try:
            if is_connected():
                # Use MongoDB
                db = get_database()
                recordings_collection = db.interview_recordings
                count = await recordings_collection.count_documents({"session_id": session_id})
                return count
            else:
                # Use in-memory database
                if hasattr(memory_db, 'recordings'):
                    count = sum(1 for rec in memory_db.recordings.values() 
                              if rec.get('session_id') == session_id)
                    return count
                return 0
        except Exception as e:
            logger.error(f"Error counting session recordings: {str(e)}")
            return 0

    async def get_user_recordings(self, user_id: str) -> list:
        """Get all interview recordings for a user across all sessions"""
        try:
            if is_connected():
                db = get_database()
                recordings_collection = db.interview_recordings
                cursor = recordings_collection.find({"user_id": user_id})
                recordings = []
                async for recording in cursor:
                    recording_id = recording.get('_id', str(recording.get('_id')))
                    recording["recording_id"] = recording_id
                    recording.pop("audio_data", None)
                    recordings.append(recording)
                return recordings
            else:
                if not hasattr(memory_db, 'recordings'):
                    return []
                recordings = []
                for recording_id, recording in memory_db.recordings.items():
                    if recording.get('user_id') == user_id:
                        rec_copy = recording.copy()
                        rec_copy.pop("audio_data", None)
                        rec_copy['_id'] = recording_id
                        recordings.append(rec_copy)
                return recordings
        except Exception as e:
            logger.error(f"Error getting user recordings: {str(e)}")
            raise
