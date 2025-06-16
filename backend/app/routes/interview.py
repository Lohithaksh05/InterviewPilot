from fastapi import APIRouter, HTTPException, Depends
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Any
from ..services.gemini_service import GeminiService
from ..services.interview_service import InterviewService
from ..services.auth_service import get_current_user
from ..agents.interviewer_agents import InterviewerFactory
from ..models.interview_models import InterviewSession, InterviewerType, DifficultyLevel, Answer, Feedback
from ..models.user_models import User
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

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
            logger.info(f"Using template: {selected_template.get('name', 'Unknown')} for question generation")
            
            # Use template settings instead of user-provided settings
            template_total_questions = sum(selected_template.get('question_distribution', {}).values()) or num_questions
            template_primary_interviewer = selected_template.get('interviewer_types', [interviewer_type])[0]
            
            # Use template's question count (capped at reasonable limit)
            actual_num_questions = min(template_total_questions, 15)  # Cap at 15 questions
            
            questions = await gemini_service.generate_questions_with_template(
                resume_text, job_description, selected_template, actual_num_questions
            )
            
            # Use template's primary interviewer type for session
            try:
                template_interviewer_enum = InterviewerType(template_primary_interviewer)
                session_interviewer_type = template_interviewer_enum
            except ValueError:
                session_interviewer_type = interviewer_enum  # Fallback to user selection
                
        else:
            logger.info("Using standard question generation (no template)")
            # Create interviewer agent and generate questions
            interviewer = InterviewerFactory.create_interviewer(interviewer_enum, gemini_service)
            questions = await interviewer.generate_questions(resume_text, job_description, difficulty, num_questions)
            session_interviewer_type = interviewer_enum        # Prepare session data
        session_data = {
            "interviewer_type": session_interviewer_type,
            "difficulty": difficulty_enum,
            "job_description": job_description,
            "resume_text": resume_text,
            "questions": questions,
            "duration_minutes": request.get('duration_minutes') or (selected_template.get('duration_minutes') if selected_template else None),
            "time_limit_enabled": True,  # Enable timer by default
            "template_used": selected_template.get('name') if selected_template else None,
            "template_settings": {
                "duration_minutes": selected_template.get('duration_minutes'),
                "key_skills": selected_template.get('key_skills', []),
                "evaluation_criteria": selected_template.get('evaluation_criteria', [])
            } if selected_template else None
        }
        
        # Store session in database
        session = await interview_service.create_session(current_user, session_data)
        
        return {
            "session_id": session.session_id,
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
        "interviewer_type": session.interviewer_type.value,
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
        
        current_question = session.questions[current_question_index]
        
        # Create interviewer agent and evaluate answer
        interviewer = InterviewerFactory.create_interviewer(session.interviewer_type, gemini_service)
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
        summary = await gemini_service.generate_interview_summary(
            session.questions,
            session.answers,
            session.interviewer_type.value
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
        
        return {
            "session_id": session_id,
            "interviewer_type": session.interviewer_type.value,
            "difficulty": session.difficulty.value,
            "total_questions": len(session.questions),
            "answered_questions": len(session.answers),
            "average_score": round(average_score, 2),
            "individual_feedback": session.feedback,
            "overall_summary": summary,
            "timing": timing_info,
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
            sessions_list.append({
                "session_id": session.session_id,
                "interviewer_type": session.interviewer_type.value,
                "difficulty": session.difficulty.value,
                "created_at": session.created_at,
                "total_questions": len(session.questions),
                "answered_questions": len(session.answers),
                "completed": session.completed if hasattr(session, 'completed') else len(session.answers) >= len(session.questions)
            })
        
        return {
            "sessions": sorted(sessions_list, key=lambda x: x['created_at'], reverse=True),
            "total_sessions": len(sessions_list)
        }
        
    except Exception as e:
        logger.error(f"Error listing sessions: {str(e)}")
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
async def get_recording(recording_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific recording with audio data"""
    if not interview_service:
        raise HTTPException(
            status_code=500,
            detail="Interview service not available."
        )
    
    try:
        logger.info(f"Fetching recording with ID: {recording_id}")
        
        recording = await interview_service.get_recording(recording_id)
        
        if not recording:
            logger.warning(f"Recording not found for ID: {recording_id}")
            raise HTTPException(status_code=404, detail="Recording not found")
        
        logger.info(f"Found recording for ID: {recording_id}, session: {recording.get('session_id')}")
        
        # Verify the recording belongs to the current user
        # We need to check if the session belongs to the user
        session = await interview_service.get_session(recording.get('session_id'), str(current_user.id))
        if not session:
            logger.warning(f"Access denied for recording {recording_id} - session not found or not owned by user")
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "success": True,
            "recording": recording
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recording {recording_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting recording: {str(e)}"
        )
