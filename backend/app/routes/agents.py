from fastapi import APIRouter, HTTPException
from typing import List
from ..agents.interviewer_agents import InterviewerFactory
from ..services.gemini_service import GeminiService
from ..models.interview_models import InterviewerType, DifficultyLevel
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize Gemini service
try:
    gemini_service = GeminiService()
except Exception as e:
    logger.error(f"Failed to initialize Gemini service: {str(e)}")
    gemini_service = None

@router.get("/types")
async def get_interviewer_types():
    """Get all available interviewer types"""
    return {
        "interviewer_types": [
            {
                "type": "hr",
                "name": "HR Interviewer",
                "description": "Focuses on cultural fit, communication skills, and soft skills",
                "focus_areas": [
                    "Cultural fit and values alignment",
                    "Communication and interpersonal skills", 
                    "Career goals and motivation",
                    "Work-life balance and team dynamics",
                    "Company culture adaptation"
                ]
            },
            {
                "type": "tech_lead", 
                "name": "Technical Lead",
                "description": "Focuses on technical expertise, problem-solving, and system design",
                "focus_areas": [
                    "Technical expertise and depth",
                    "Problem-solving methodology",
                    "System design and architecture",
                    "Code quality and best practices",
                    "Technology stack proficiency"
                ]
            },
            {
                "type": "behavioral",
                "name": "Behavioral Interviewer", 
                "description": "Focuses on past experiences and situational responses using STAR method",
                "focus_areas": [
                    "Leadership and influence",
                    "Conflict resolution and teamwork",
                    "Adaptability and learning agility",
                    "Decision-making under pressure",
                    "Achievement orientation and results"
                ]
            }        ]
    }

@router.get("/difficulty-levels")
async def get_difficulty_levels():
    """Get all available difficulty levels"""
    return {
        "difficulty_levels": [
            {
                "level": "easy",
                "name": "Easy",
                "description": "Basic questions suitable for entry-level positions and straightforward scenarios",
                "characteristics": [
                    "Fundamental concepts and practices",
                    "Simple behavioral scenarios",
                    "Clear yes/no situations",
                    "Basic technical knowledge"
                ]
            },
            {
                "level": "medium",
                "name": "Medium", 
                "description": "Moderate complexity questions for mid-level positions with situational judgment",
                "characteristics": [
                    "Intermediate technical concepts",
                    "Multi-step problem solving",
                    "Team dynamics scenarios",
                    "Trade-off discussions"
                ]
            },
            {
                "level": "hard",
                "name": "Hard",
                "description": "Complex questions for senior positions requiring strategic thinking and leadership",
                "characteristics": [
                    "Advanced system architecture",
                    "High-stakes leadership situations",
                    "Complex stakeholder management",
                    "Strategic decision making"
                ]
            }
        ]
    }

@router.post("/questions")
async def generate_questions(request: dict):
    """Generate interview questions for a specific interviewer type"""
    
    if not gemini_service:
        raise HTTPException(
            status_code=500,
            detail="Gemini service not available. Please check your API key configuration."
        )
    try:
        interviewer_type = request.get('interviewer_type')
        difficulty = request.get('difficulty', 'medium')  # Default to medium
        resume_text = request.get('resume_text', '')
        job_description = request.get('job_description', '')
        num_questions = request.get('num_questions', 5)
        
        if not interviewer_type:
            raise HTTPException(
                status_code=400,
                detail="interviewer_type is required"
            )
        
        if not resume_text or not job_description:
            raise HTTPException(
                status_code=400,
                detail="Both resume_text and job_description are required"
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
        
        # Create interviewer agent
        interviewer = InterviewerFactory.create_interviewer(interviewer_enum, gemini_service)
        
        # Generate questions
        questions = await interviewer.generate_questions(
            resume_text, 
            job_description, 
            difficulty,
            num_questions
        )
        
        return {
            "interviewer_type": interviewer_type,
            "difficulty": difficulty,
            "questions": questions,
            "total_questions": len(questions)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating questions: {str(e)}"
        )

@router.post("/evaluate")
async def evaluate_answer(request: dict):
    """Evaluate an interview answer"""
    
    if not gemini_service:
        raise HTTPException(
            status_code=500,
            detail="Gemini service not available. Please check your API key configuration."
        )
    
    try:
        interviewer_type = request.get('interviewer_type')
        question = request.get('question', '')
        answer = request.get('answer', '')
        job_description = request.get('job_description', '')
        
        if not all([interviewer_type, question, answer, job_description]):
            raise HTTPException(
                status_code=400,
                detail="interviewer_type, question, answer, and job_description are all required"
            )
        
        # Validate interviewer type
        try:
            interviewer_enum = InterviewerType(interviewer_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid interviewer type. Must be one of: {[t.value for t in InterviewerType]}"
            )
        
        # Create interviewer agent
        interviewer = InterviewerFactory.create_interviewer(interviewer_enum, gemini_service)
        
        # Evaluate answer
        evaluation = await interviewer.evaluate_answer(question, answer, job_description)
        
        return {
            "interviewer_type": interviewer_type,
            "question": question,
            "evaluation": evaluation
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error evaluating answer: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error evaluating answer: {str(e)}"
        )

@router.post("/follow-up")
async def generate_follow_up(request: dict):
    """Generate a follow-up question based on the answer"""
    
    if not gemini_service:
        raise HTTPException(
            status_code=500,
            detail="Gemini service not available. Please check your API key configuration."
        )
    
    try:
        interviewer_type = request.get('interviewer_type')
        original_question = request.get('original_question', '')
        answer = request.get('answer', '')
        
        if not all([interviewer_type, original_question, answer]):
            raise HTTPException(
                status_code=400,
                detail="interviewer_type, original_question, and answer are all required"
            )
        
        # Validate interviewer type
        try:
            interviewer_enum = InterviewerType(interviewer_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid interviewer type. Must be one of: {[t.value for t in InterviewerType]}"
            )
        
        # Create interviewer agent
        interviewer = InterviewerFactory.create_interviewer(interviewer_enum, gemini_service)
        
        # Generate follow-up question
        follow_up = await interviewer.get_follow_up_question(original_question, answer)
        
        return {
            "interviewer_type": interviewer_type,
            "original_question": original_question,
            "follow_up_question": follow_up.strip()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating follow-up question: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating follow-up question: {str(e)}"
        )
