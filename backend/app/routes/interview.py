from fastapi import APIRouter, HTTPException, Depends
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Any
from ..services.gemini_service import GeminiService
from ..services.interview_service import InterviewService
from ..services.auth_service import get_current_user
from ..agents.interviewer_agents import InterviewerFactory
from ..models.interview_models import InterviewSession, InterviewerType, DifficultyLevel, Answer, Feedback
from ..models.user_models import User
from ..database import get_database, is_connected
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def _get_interviewer_type_for_question_index(question_index: int, question_interviewer_types: list) -> str:
    """
    Get the interviewer type that should handle a specific question.
    
    Args:
        question_index: 0-based index of the current question
        question_interviewer_types: List of interviewer types for each question
        
    Returns:
        The interviewer type that should handle this question
    """
    if not question_interviewer_types or question_index >= len(question_interviewer_types):
        return 'hr'  # Default fallback
    
    return question_interviewer_types[question_index]

def _get_interviewer_type_for_question_index_from_distribution(question_index: int, question_distribution: dict) -> str:
    """
    Determine which interviewer type should handle a specific question based on 
    the template's question distribution (legacy support).
    
    Args:
        question_index: 0-based index of the current question
        question_distribution: Dict mapping interviewer types to question counts
        
    Returns:
        The interviewer type that should handle this question
    """
    if not question_distribution:
        return 'hr'  # Default fallback
    
    # Create ordered list of interviewer types based on distribution
    ordered_types = []
    for interviewer_type, count in question_distribution.items():
        ordered_types.extend([interviewer_type] * count)
    
    # Return the interviewer type for this specific question index
    if question_index < len(ordered_types):
        return ordered_types[question_index]
    else:
        # Fallback if index is out of range
        return list(question_distribution.keys())[0] if question_distribution else 'hr'

# Initialize services
try:
    gemini_service = GeminiService()
    interview_service = InterviewService()
except Exception as e:
    logger.error(f"Failed to initialize services: {str(e)}")
    gemini_service = None
    interview_service = None

@router.post("/start")
async def start_interview(request: dict, current_user: User = Depends(get_current_user)):
    """Start a new interview session"""
    
    # Debug logging
    logger.info(f"Received interview request: {request}")
    
    if not gemini_service or not interview_service:
        raise HTTPException(
            status_code=500,
            detail="Services not available. Please check configuration."
        )
    try:
        interviewer_type = request.get('interviewer_type')
        difficulty = request.get('difficulty', 'medium')  # Default to medium
        job_description = request.get('job_description', '')
        resume_text = request.get('resume_text', '')
        num_questions = request.get('num_questions', 5)
        selected_template = request.get('selected_template')  # New: template data
        
        if not all([interviewer_type, resume_text]):
            raise HTTPException(
                status_code=400,
                detail="interviewer_type and resume_text are required"
            )
        
        # Job description is only required for non-template interviews
        if not selected_template and not job_description:
            raise HTTPException(
                status_code=400,
                detail="job_description is required when not using a template"
            )
        
        # Validate interviewer type
        try:
            interviewer_enum = InterviewerType(interviewer_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid interviewer type. Must be one of: {[t.value for t in InterviewerType]}"
            )
        
        # Validate difficulty level
        try:
            difficulty_enum = DifficultyLevel(difficulty)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid difficulty level. Must be one of: {[d.value for d in DifficultyLevel]}"
            )
          # Generate session ID
        session_id = str(uuid.uuid4())
          # Generate questions - use template if available
        if selected_template:
            logger.info(f"Using template: {selected_template.get('name', 'Unknown')} for multi-agent question generation")
            
            # Get question distribution from template
            question_distribution = selected_template.get('question_distribution', {})
            template_interviewer_types = selected_template.get('interviewer_types', ['hr', 'tech_lead', 'behavioral'])
            template_total_questions = sum(question_distribution.values()) or num_questions
            
            # Use template's question count (capped at reasonable limit)
            actual_num_questions = min(template_total_questions, 15)  # Cap at 15 questions
            
            # Generate questions using template distribution
            questions = await gemini_service.generate_multi_agent_questions_with_distribution(
                resume_text, job_description, selected_template, question_distribution, actual_num_questions
            )
            
            # Create interviewer type mapping for each question based on the template distribution
            question_interviewer_types = []
            for interviewer_type, count in question_distribution.items():
                question_interviewer_types.extend([interviewer_type] * count)
            
            # Ensure we have the right number of mappings
            question_interviewer_types = question_interviewer_types[:len(questions)]
            
            # For template-based interviews, use the job role as the interviewer type identifier
            template_job_role = selected_template.get('job_role', 'Template Interview')
            session_interviewer_type = template_job_role  # Store job role as interviewer type for templates
                
        else:
            logger.info("Using standard question generation (no template)")
            # Create interviewer agent and generate questions
            interviewer = InterviewerFactory.create_interviewer(interviewer_enum, gemini_service)
            questions = await interviewer.generate_questions(resume_text, job_description, difficulty, num_questions)
            session_interviewer_type = interviewer_enum
            question_interviewer_types = None  # Not applicable for single-agent interviews
            template_interviewer_types = None        # Prepare session data
        session_data = {
            "interviewer_type": session_interviewer_type,
            "difficulty": difficulty_enum,
            "job_description": job_description,
            "resume_text": resume_text,
            "questions": questions,
            "duration_minutes": request.get('duration_minutes') or (60 if selected_template else 30),
            "time_limit_enabled": True,  # Enable timer by default
            # Template-related data
            "is_template_based": bool(selected_template),
            "template_id": selected_template.get('id') if selected_template else None,
            "template_name": selected_template.get('name') if selected_template else None,
            "template_job_role": selected_template.get('job_role') if selected_template else None,
            "template_question_distribution": selected_template.get('question_distribution', {}) if selected_template else None,
            "template_interviewer_types": template_interviewer_types,
            "question_interviewer_types": question_interviewer_types,
            "template_settings": {
                "duration_minutes": selected_template.get('duration_minutes'),
                "key_skills": selected_template.get('key_skills', []),
                "evaluation_criteria": selected_template.get('evaluation_criteria', [])
            } if selected_template else None
        }# Store session in database
        session = await interview_service.create_session(current_user, session_data)
        
        # Use the session_id from the created session object
        actual_session_id = session.session_id
        
        return {
            "session_id": actual_session_id,
            "interviewer_type": interviewer_type,
            "difficulty": difficulty,
            "questions": questions,
            "total_questions": len(questions),
            "current_question": 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting interview: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error starting interview: {str(e)}"
        )

@router.post("/start-session/{session_id}")
async def start_interview_session(session_id: str, current_user: User = Depends(get_current_user)):
    """Mark interview session as started with current timestamp"""
    
    if not interview_service:
        raise HTTPException(
            status_code=500,
            detail="Interview service not available."
        )
    
    try:
        success = await interview_service.mark_interview_started(session_id, str(current_user.id))
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Interview session not found or could not be started"
            )
        
        return {
            "success": True,
            "message": "Interview session started",
            "session_id": session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting interview session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error starting interview session: {str(e)}"
        )

@router.get("/session/{session_id}")
async def get_session(session_id: str, current_user: User = Depends(get_current_user)):
    """Get interview session details"""
    
    if not interview_service:
        raise HTTPException(
            status_code=500,
            detail="Interview service not available."
    )
    
    session = await interview_service.get_session(session_id, str(current_user.id))
    
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found"
        )
    
    return {
        "session_id": session_id,
        "interviewer_type": session.interviewer_type.value if hasattr(session.interviewer_type, 'value') else str(session.interviewer_type),
        "difficulty": session.difficulty.value,
        "questions": session.questions,
        "answers": session.answers,
        "feedback": session.feedback,
        "current_question": len(session.answers),
        "total_questions": len(session.questions),
        "completed": len(session.answers) >= len(session.questions)
    }

@router.post("/answer")
async def submit_answer(request: dict, current_user: User = Depends(get_current_user)):
    """Submit an answer to a question"""
    
    if not gemini_service or not interview_service:
        raise HTTPException(
            status_code=500,
            detail="Services not available. Please check configuration."
        )
    
    try:
        session_id = request.get('session_id')
        answer = request.get('answer', '')
        
        if not session_id or not answer.strip():
            raise HTTPException(
                status_code=400,
                detail="session_id and answer are required"
            )
          # Get session from database
        session = await interview_service.get_session(session_id, str(current_user.id))
        
        if not session:
            raise HTTPException(
                status_code=404,
                detail="Interview session not found"
            )
        
        current_question_index = len(session.answers)
        
        if current_question_index >= len(session.questions):
            raise HTTPException(
                status_code=400,
                detail="All questions have been answered"
            )
        
        current_question = session.questions[current_question_index]        # Handle template-based interviews vs regular interviews
        if getattr(session, 'is_template_based', False):
            # For template-based interviews, determine the appropriate interviewer type for this question
            # First try to use the stored question_interviewer_types mapping
            question_interviewer_types = getattr(session, 'question_interviewer_types', None)
            
            if question_interviewer_types:
                # Use the direct mapping stored in the session
                selected_interviewer_type_str = _get_interviewer_type_for_question_index(
                    current_question_index, question_interviewer_types
                )
            else:
                # Fallback: calculate from template question distribution
                template_question_distribution = getattr(session, 'template_question_distribution', {})
                
                if template_question_distribution:
                    selected_interviewer_type_str = _get_interviewer_type_for_question_index_from_distribution(
                        current_question_index, template_question_distribution
                    )
                else:
                    # Final fallback: round-robin through template interviewer types
                    template_interviewer_types = getattr(session, 'template_interviewer_types', ['hr', 'tech_lead', 'behavioral'])
                    total_types = len(template_interviewer_types)
                    interviewer_type_index = current_question_index % total_types
                    selected_interviewer_type_str = template_interviewer_types[interviewer_type_index]
            
            logger.info(f"Using {selected_interviewer_type_str} interviewer for question {current_question_index} in template-based interview")
            
            try:
                evaluation_interviewer_type = InterviewerType(selected_interviewer_type_str)
            except ValueError:
                # Default to HR if the type is not recognized
                evaluation_interviewer_type = InterviewerType.HR
        else:
            # For regular interviews, use the session's interviewer type
            if hasattr(session.interviewer_type, 'value'):
                evaluation_interviewer_type = session.interviewer_type
            else:
                # If it's a string, try to convert to enum
                try:
                    evaluation_interviewer_type = InterviewerType(session.interviewer_type)
                except ValueError:
                    # Default to HR if conversion fails
                    evaluation_interviewer_type = InterviewerType.HR
        
        # Create interviewer agent and evaluate answer
        interviewer = InterviewerFactory.create_interviewer(evaluation_interviewer_type, gemini_service)
        evaluation = await interviewer.evaluate_answer(
            current_question, 
            answer, 
            session.job_description
        )
        
        # Update session with new answer and feedback
        await interview_service.add_answer(session_id, str(current_user.id), answer, evaluation)
        
        return {
            "session_id": session_id,
            "question": current_question,
            "answer": answer,
            "evaluation": evaluation,
            "current_question": current_question_index + 1,
            "total_questions": len(session.questions),
            "completed": (current_question_index + 1) >= len(session.questions)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting answer: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error submitting answer: {str(e)}"
        )

@router.post("/complete/{session_id}")
async def complete_interview(session_id: str, request: dict = {}, current_user: User = Depends(get_current_user)):
    """Complete an interview session and record timing"""
    
    if not interview_service:
        raise HTTPException(
            status_code=500,
            detail="Interview service not available."
        )
    
    try:
        # Get time left from request (in minutes)
        time_left_minutes = request.get('time_left_minutes', 0)
        
        # Mark interview as completed
        success = await interview_service.complete_interview(session_id, str(current_user.id), time_left_minutes)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Interview session not found or could not be completed"
            )
        
        return {
            "success": True,
            "message": "Interview completed successfully",
            "session_id": session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing interview {session_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error completing interview: {str(e)}"
        )

@router.get("/summary/{session_id}")
async def get_interview_summary(session_id: str, current_user: User = Depends(get_current_user)):
    """Get comprehensive interview summary"""
    
    if not gemini_service or not interview_service:
        raise HTTPException(
            status_code=500,
            detail="Services not available. Please check configuration."
        )
    
    try:
        # Get session from database
        session = await interview_service.get_session(session_id, str(current_user.id))
        
        if not session:
            raise HTTPException(
                status_code=404,
                detail="Interview session not found"
            )
        
        if len(session.answers) == 0:
            raise HTTPException(
                status_code=400,
                detail="No answers submitted yet"
            )
          # Generate comprehensive summary
        # Handle interviewer type for both enum and string types
        interviewer_type_for_summary = session.interviewer_type
        if hasattr(session.interviewer_type, 'value'):
            interviewer_type_for_summary = session.interviewer_type.value
        elif isinstance(session.interviewer_type, str):
            interviewer_type_for_summary = session.interviewer_type
        else:
            interviewer_type_for_summary = 'hr'  # Default fallback
        
        summary = await gemini_service.generate_interview_summary(
            session.questions,
            session.answers,
            interviewer_type_for_summary
        )
        
        # Calculate overall score from individual feedback
        total_score = 0
        valid_scores = 0
        
        for feedback in session.feedback:
            if isinstance(feedback, dict) and 'score' in feedback:
                try:
                    score = float(feedback['score'])
                    total_score += score
                    valid_scores += 1
                except (ValueError, TypeError):
                    continue
        
        average_score = total_score / valid_scores if valid_scores > 0 else 0
          # Update session with completion status
        await interview_service.update_session_completion(session_id, str(current_user.id), True)
          # Calculate timing information
        timing_info = {}
        if hasattr(session, 'minutes_taken') and session.minutes_taken is not None:
            timing_info["minutes_taken"] = session.minutes_taken
            timing_info["duration_formatted"] = f"{session.minutes_taken} minutes"
        else:
            timing_info["duration_formatted"] = "N/A"
          # Handle difficulty for both enum and string types
        difficulty_for_response = session.difficulty
        if hasattr(session.difficulty, 'value'):
            difficulty_for_response = session.difficulty.value
        elif isinstance(session.difficulty, str):
            difficulty_for_response = session.difficulty
        else:
            difficulty_for_response = 'medium'  # Default fallback
        
        return {
            "session_id": session_id,
            "interviewer_type": interviewer_type_for_summary,
            "difficulty": difficulty_for_response,
            "total_questions": len(session.questions),
            "answered_questions": len(session.answers),
            "average_score": round(average_score, 2),
            "individual_feedback": session.feedback,
            "overall_summary": summary,
            "timing": timing_info,
            # Add template info for template-based interviews
            "is_template_based": getattr(session, 'is_template_based', False),
            "template_name": getattr(session, 'template_name', None),
            "template_job_role": getattr(session, 'template_job_role', None),
            "qa_pairs": [
                {
                    "question": q,
                    "answer": a,
                    "feedback": f
                }
                for q, a, f in zip(session.questions, session.answers, session.feedback)
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating summary: {str(e)}"
        )

@router.get("/sessions")
async def list_sessions(current_user: User = Depends(get_current_user)):
    """List all interview sessions for the current user"""
    
    if not interview_service:
        raise HTTPException(
            status_code=500,
            detail="Interview service not available."
        )
    
    try:
        sessions = await interview_service.get_user_sessions(str(current_user.id))
        
        sessions_list = []
        for session in sessions:
            try:
                # Handle both enum and string interviewer types
                interviewer_type_value = session.interviewer_type.value if hasattr(session.interviewer_type, 'value') else str(session.interviewer_type)
                
                # Safely get session attributes with fallbacks
                session_data = {
                    "session_id": getattr(session, 'session_id', str(session.id) if session.id else 'unknown'),
                    "interviewer_type": interviewer_type_value,
                    "difficulty": session.difficulty.value if hasattr(session.difficulty, 'value') else str(session.difficulty),
                    "created_at": getattr(session, 'created_at', datetime.now()),
                    "total_questions": len(getattr(session, 'questions', [])),
                    "answered_questions": len(getattr(session, 'answers', [])),
                    "completed": getattr(session, 'completed', False) if hasattr(session, 'completed') else len(getattr(session, 'answers', [])) >= len(getattr(session, 'questions', [])),
                    # Template information
                    "is_template_based": getattr(session, 'is_template_based', False),
                    "template_id": getattr(session, 'template_id', None),
                    "template_name": getattr(session, 'template_name', None),
                    "template_job_role": getattr(session, 'template_job_role', None),
                    "duration_minutes": getattr(session, 'duration_minutes', 30)
                }
                
                sessions_list.append(session_data)
            except Exception as session_error:
                logger.warning(f"Error processing session {getattr(session, 'session_id', 'unknown')}: {str(session_error)}")
                continue
        
        return {
            "sessions": sorted(sessions_list, key=lambda x: x['created_at'], reverse=True),
            "total_sessions": len(sessions_list)
        }
        
    except Exception as e:
        logger.error(f"Error listing sessions: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error listing sessions: {str(e)}"
        )

@router.delete("/session/{session_id}")
async def delete_session(session_id: str, current_user: User = Depends(get_current_user)):
    """Delete an interview session"""
    
    if not interview_service:
        raise HTTPException(
            status_code=500,
            detail="Interview service not available."
        )
    
    try:
        # Check if session exists and belongs to user
        session = await interview_service.get_session(session_id, str(current_user.id))
        
        if not session:
            raise HTTPException(
                status_code=404,
                detail="Interview session not found"
            )
        
        # Delete session
        await interview_service.delete_session(session_id, str(current_user.id))
        
        return {
            "message": "Interview session deleted successfully",
            "session_id": session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting session: {str(e)}"
        )

@router.get("/stats")
async def get_user_stats(current_user: User = Depends(get_current_user)):
    """Get user interview statistics"""
    
    if not interview_service:
        raise HTTPException(
            status_code=500,
            detail="Interview service not available."
        )
    
    try:
        stats = await interview_service.get_user_stats(str(current_user.id))
        return stats
        
    except Exception as e:
        logger.error(f"Error getting user stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting user stats: {str(e)}"
        )

@router.post("/save-recording")
@router.post("/save-recording")
async def save_recording(request: dict, current_user: User = Depends(get_current_user)):
    """Save audio recording for an interview session""" 
    
    if not interview_service:
        raise HTTPException(
            status_code=500,
            detail="Interview service not available."
        )
        
    try:
        session_id = request.get('session_id')
        question_index = request.get('question_index')
        audio_data = request.get('audio_data')  # Base64 encoded
        duration = request.get('duration')
        transcript = request.get('transcript', '')
        file_size = request.get('file_size')
        mime_type = request.get('mime_type', 'audio/webm')
          # Debug logging
        logger.info(f"Received recording request: session_id={session_id}, question_index={question_index}, "
                   f"audio_data_length={len(audio_data) if audio_data else 0}, duration={duration}, "
                   f"transcript='{transcript}', transcript_length={len(transcript) if transcript else 0}, "
                   f"file_size={file_size}, mime_type={mime_type}")
        
        # Validate required fields
        missing_fields = []
        if not session_id:
            missing_fields.append('session_id')
        if question_index is None:
            missing_fields.append('question_index')
        if not audio_data:
            missing_fields.append('audio_data')
        if duration is None:
            missing_fields.append('duration')
        if file_size is None:
            missing_fields.append('file_size')
            
        if missing_fields:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        # Validate session exists and belongs to user
        session = await interview_service.get_session(session_id, str(current_user.id))
        if not session:
            raise HTTPException(status_code=404, detail="Interview session not found")
        
        if str(session.user_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Access denied")
          # Save recording
        recording_data = {
            'user_id': str(current_user.id),  # Convert PyObjectId to string
            'session_id': session_id,
            'question_index': question_index,
            'audio_data': audio_data,
            'duration': duration,
            'transcript': transcript,
            'file_size': file_size,
            'mime_type': mime_type,
            'created_at': datetime.now()
        }
        
        recording_id = await interview_service.save_recording(recording_data)
        
        return {
            "success": True,
            "recording_id": str(recording_id),
            "message": "Recording saved successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving recording: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error saving recording: {str(e)}"
        )

@router.get("/recordings/{session_id}")
async def get_session_recordings(session_id: str, current_user: User = Depends(get_current_user)):
    """Get all recordings for a specific interview session"""
    if not interview_service:
        raise HTTPException(
            status_code=500,
            detail="Interview service not available."
        )
    
    try:
        # Validate session exists and belongs to user
        session = await interview_service.get_session(session_id, str(current_user.id))
        if not session:
            raise HTTPException(status_code=404, detail="Interview session not found")
        
        if str(session.user_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        recordings = await interview_service.get_session_recordings(session_id)
        
        return {
            "success": True,
            "recordings": recordings
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recordings: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting recordings: {str(e)}"
        )

@router.get("/recording/{recording_id}")
async def get_user_recording(recording_id: str, current_user: User = Depends(get_current_user)):
    """Fetch a single interview recording (including audio_data) by recording_id for the current user"""
    try:
        recording = await interview_service.get_recording(recording_id)
        if not recording:
            raise HTTPException(status_code=404, detail="Recording not found")
        # Security: Only allow access to user's own recordings
        if str(recording.get("user_id")) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Access denied")
        return {
            "success": True,
            "recording": recording
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user recording: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user recording")

@router.get("/recordings")
async def list_user_recordings(current_user: User = Depends(get_current_user)):
    """List all interview recordings (temporarily showing all recordings for testing)"""
    try:
        # For now, get all recordings to test the voice page functionality
        if is_connected():
            db = get_database()
            recordings_collection = db.interview_recordings
            cursor = recordings_collection.find({})
            recordings = []
            async for recording in cursor:
                recording_id = recording.get('_id', str(recording.get('_id')))
                recording["recording_id"] = recording_id
                recording.pop("audio_data", None)  # Remove large audio data
                recording["_id"] = str(recording["_id"])  # Convert ObjectId to string
                recordings.append(recording)
            return {"recordings": recordings}
        else:
            # Use memory database fallback
            recordings = await interview_service.get_user_recordings(current_user.id)
            return {"recordings": recordings}
    except Exception as e:
        logger.error(f"Error listing recordings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list recordings")
