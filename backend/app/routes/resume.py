from fastapi import APIRouter, UploadFile, File, HTTPException
from ..services.resume_parser import ResumeParser
from ..models.interview_models import ResumeData
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

resume_parser = ResumeParser()

@router.post("/upload", response_model=ResumeData)
async def upload_resume(file: UploadFile = File(...)):
    """Upload and parse a resume file"""
    
    # Validate file type
    if not file.filename.endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX, and TXT files are supported"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Parse resume
        parsed_data = await resume_parser.parse_resume(content, file.filename)
        
        return ResumeData(**parsed_data)
        
    except Exception as e:
        logger.error(f"Error processing resume: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing resume: {str(e)}"
        )

@router.post("/parse-text", response_model=ResumeData)
async def parse_resume_text(resume_text: dict):
    """Parse resume from raw text"""
    
    try:
        text = resume_text.get('text', '')
        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Resume text cannot be empty"
            )
        
        # Create a fake filename for text parsing
        parsed_data = await resume_parser.parse_resume(
            text.encode('utf-8'), 
            'resume.txt'
        )
        
        return ResumeData(**parsed_data)
        
    except Exception as e:
        logger.error(f"Error parsing resume text: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing resume text: {str(e)}"
        )
