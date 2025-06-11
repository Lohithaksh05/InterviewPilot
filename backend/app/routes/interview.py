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
        
        if not all([interviewer_type, job_description, resume_text]):
            raise HTTPException(
                status_code=400,
                detail="interviewer_type, job_description, and resume_text are required"
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
          # Create interviewer agent and generate questions
        interviewer = InterviewerFactory.create_interviewer(interviewer_enum, gemini_service)
        questions = await interviewer.generate_questions(resume_text, job_description, difficulty, num_questions)
        
        # Prepare session data
        session_data = {
            "interviewer_type": interviewer_enum,
            "difficulty": difficulty_enum,
            "job_description": job_description,
            "resume_text": resume_text,
            "questions": questions
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
        
        return {
            "session_id": session_id,
            "interviewer_type": session.interviewer_type.value,
            "difficulty": session.difficulty.value,
            "total_questions": len(session.questions),
            "answered_questions": len(session.answers),
            "average_score": round(average_score, 2),
            "individual_feedback": session.feedback,
            "overall_summary": summary,
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
