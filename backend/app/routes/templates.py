from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from pydantic import BaseModel
from ..services.template_service import InterviewTemplateService
from ..services.gemini_service import GeminiService
from ..services.auth_service import get_current_user
from ..models.template_models import InterviewTemplate, JobRole
from ..models.user_models import User
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
template_service = InterviewTemplateService()
gemini_service = GeminiService()

class StartInterviewRequest(BaseModel):
    template_id: str
    resume_text: str = ""
    job_description: str = ""
    customizations: Dict[str, Any] = {}

@router.get("/")
async def get_all_templates():
    """Get all available interview templates"""
    try:
        templates = template_service.get_all_templates()
        return {
            "templates": [template.dict() for template in templates],
            "count": len(templates)
        }
    except Exception as e:
        logger.error(f"Error fetching templates: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch templates")

@router.get("/test")
async def test_templates_endpoint():
    """Test endpoint to verify templates router is working"""
    return {"message": "Templates router is working!", "status": "success"}

@router.get("/{template_id}")
async def get_template(template_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific interview template"""
    try:
        template = template_service.get_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {"template": template.dict()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching template {template_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch template")

@router.get("/role/{job_role}")
async def get_templates_by_role(job_role: str, current_user: User = Depends(get_current_user)):
    """Get templates for a specific job role"""
    try:
        # Validate job role
        try:
            role_enum = JobRole(job_role)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid job role: {job_role}")
        
        templates = template_service.get_templates_by_role(role_enum)
        return {
            "templates": [template.dict() for template in templates],
            "job_role": job_role,
            "count": len(templates)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching templates for role {job_role}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch templates for role")

@router.post("/templates/{template_id}/customize")
async def customize_template(
    template_id: str, 
    customizations: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Customize an interview template"""
    try:
        customized_template = template_service.customize_template(template_id, customizations)
        return {"template": customized_template.dict()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error customizing template {template_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to customize template")

@router.post("/templates/{template_id}/generate-interview")
async def generate_interview_from_template(
    template_id: str,
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Generate an interview session based on a template"""
    try:
        template = template_service.get_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        resume_text = request.get("resume_text", "")
        job_description = request.get("job_description", "")
        
        if not resume_text or not job_description:
            raise HTTPException(
                status_code=400, 
                detail="resume_text and job_description are required"
            )
        
        # Generate interview structure
        interview_structure = template_service.generate_questions_from_template(
            template, resume_text, job_description
        )
        
        # Generate actual questions using Gemini for each interviewer type
        generated_questions = {}
        
        for interviewer_type, config in interview_structure["questions_by_interviewer"].items():
            questions = await gemini_service.generate_questions(
                resume_text=resume_text,
                job_description=job_description,
                interviewer_type=interviewer_type,
                difficulty="medium",  # Can be customized later
                num_questions=config["question_count"]
            )
            
            generated_questions[interviewer_type] = {
                "questions": questions,
                "categories": config["categories"],
                "difficulty_mix": config["difficulty_mix"]
            }
        
        return {
            "template_info": template.dict(),
            "interview_structure": interview_structure,
            "generated_questions": generated_questions,
            "estimated_duration": template.duration_minutes,
            "evaluation_criteria": template.evaluation_criteria
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating interview from template {template_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate interview from template")

@router.get("/job-roles")
async def get_job_roles(current_user: User = Depends(get_current_user)):
    """Get all available job roles"""
    try:
        roles = [{"value": role.value, "label": role.value.replace("_", " ").title()} 
                for role in JobRole]
        return {"job_roles": roles}
    except Exception as e:
        logger.error(f"Error fetching job roles: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch job roles")

@router.post("/start-interview")
async def start_interview_with_template(request: StartInterviewRequest):
    """Start an interview session using a template"""
    try:
        # Get the template
        template = template_service.get_template(request.template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Apply any customizations
        if request.customizations:
            template = template_service.customize_template(request.template_id, request.customizations)
        
        # Generate interview structure
        interview_structure = template_service.generate_questions_from_template(
            template, request.resume_text, request.job_description
        )
        
        return {
            "message": "Interview session prepared",
            "template_id": request.template_id,
            "interview_structure": interview_structure,
            "next_step": "Use the interview structure to begin the interview"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting interview with template {request.template_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start interview with template")
