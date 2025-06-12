from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
from ..services.gemini_service import GeminiService
from ..agents.interviewer_agents import InterviewerFactory
from ..models.interview_models import InterviewSession, InterviewerType, Answer, Feedback
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory storage for demo (in production, use a database)
interview_sessions: Dict[str, InterviewSession] = {}

# Initialize Gemini service
try:
    gemini_service = GeminiService()
except Exception as e:
    logger.error(f"Failed to initialize Gemini service: {str(e)}")
    gemini_service = None

@router.post("/start")
async def start_interview(request: dict):
    """Start a new interview session"""
    
    if not gemini_service:
        raise HTTPException(
            status_code=500,
            detail="Gemini service not available. Please check your API key configuration."
        )
    
    try:
        interviewer_type = request.get('interviewer_type')
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
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Create interviewer agent and generate questions
        interviewer = InterviewerFactory.create_interviewer(interviewer_enum, gemini_service)
        questions = await interviewer.generate_questions(resume_text, job_description, num_questions)
        
        # Create interview session
        session = InterviewSession(
            session_id=session_id,
            interviewer_type=interviewer_enum,
            job_description=job_description,
            resume_text=resume_text,
            questions=questions,
            created_at=datetime.now().isoformat()
        )
        
        # Store session
        interview_sessions[session_id] = session
        
        return {
            "session_id": session_id,
            "interviewer_type": interviewer_type,
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
async def get_session(session_id: str):
    """Get interview session details"""
    
    if session_id not in interview_sessions:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found"
        )
    
    session = interview_sessions[session_id]
    
    return {
        "session_id": session_id,
        "interviewer_type": session.interviewer_type.value,
        "questions": session.questions,
        "answers": session.answers,
        "feedback": session.feedback,
        "current_question": len(session.answers),
        "total_questions": len(session.questions),
        "completed": len(session.answers) >= len(session.questions)
    }

@router.post("/answer")
async def submit_answer(request: dict):
    """Submit an answer to a question"""
    
    if not gemini_service:
        raise HTTPException(
            status_code=500,
            detail="Gemini service not available. Please check your API key configuration."
        )
    
    try:
        session_id = request.get('session_id')
        answer = request.get('answer', '')
        
        if not session_id or not answer.strip():
            raise HTTPException(
                status_code=400,
                detail="session_id and answer are required"
            )
        
        if session_id not in interview_sessions:
            raise HTTPException(
                status_code=404,
                detail="Interview session not found"
            )
        
        session = interview_sessions[session_id]
        current_question_index = len(session.answers)
        
        if current_question_index >= len(session.questions):
            raise HTTPException(
                status_code=400,
                detail="All questions have been answered"
            )
        
        current_question = session.questions[current_question_index]
        
        # Add answer to session
        session.answers.append(answer)
        
        # Create interviewer agent and evaluate answer
        interviewer = InterviewerFactory.create_interviewer(session.interviewer_type, gemini_service)
        evaluation = await interviewer.evaluate_answer(
            current_question, 
            answer, 
            session.job_description
        )
        
        # Add feedback to session
        session.feedback.append(evaluation)
        
        # Update session
        interview_sessions[session_id] = session
        
        return {
            "session_id": session_id,
            "question": current_question,
            "answer": answer,
            "evaluation": evaluation,
            "current_question": len(session.answers),
            "total_questions": len(session.questions),
            "completed": len(session.answers) >= len(session.questions)
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
async def get_interview_summary(session_id: str):
    """Get comprehensive interview summary"""
    
    if not gemini_service:
        raise HTTPException(
            status_code=500,
            detail="Gemini service not available. Please check your API key configuration."
        )
    
    try:
        if session_id not in interview_sessions:
            raise HTTPException(
                status_code=404,
                detail="Interview session not found"
            )
        
        session = interview_sessions[session_id]
        
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
        
        return {
            "session_id": session_id,
            "interviewer_type": session.interviewer_type.value,
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
async def list_sessions():
    """List all interview sessions"""
    
    sessions_list = []
    for session_id, session in interview_sessions.items():
        sessions_list.append({
            "session_id": session_id,
            "interviewer_type": session.interviewer_type.value,
            "created_at": session.created_at,
            "total_questions": len(session.questions),
            "answered_questions": len(session.answers),
            "completed": len(session.answers) >= len(session.questions)
        })
    
    return {
        "sessions": sorted(sessions_list, key=lambda x: x['created_at'], reverse=True),
        "total_sessions": len(sessions_list)
    }

@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete an interview session"""
    
    if session_id not in interview_sessions:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found"
        )
    
    del interview_sessions[session_id]
    
    return {
        "message": "Interview session deleted successfully",
        "session_id": session_id
    }
