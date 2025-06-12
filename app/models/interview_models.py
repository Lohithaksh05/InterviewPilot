from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum

class InterviewerType(str, Enum):
    HR = "hr"
    TECH_LEAD = "tech_lead"
    BEHAVIORAL = "behavioral"

class InterviewSession(BaseModel):
    session_id: str
    interviewer_type: InterviewerType
    job_description: str
    resume_text: str
    questions: List[str] = []
    answers: List[str] = []
    feedback: List[str] = []
    score: Optional[float] = None
    created_at: str

class Question(BaseModel):
    question: str
    interviewer_type: InterviewerType
    category: str
    difficulty: str

class Answer(BaseModel):
    session_id: str
    question: str
    answer: str
    
class Feedback(BaseModel):
    answer: str
    feedback: str
    score: float
    suggestions: List[str]

class ResumeData(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    experience: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    raw_text: str

class JobDescription(BaseModel):
    title: str
    company: str
    requirements: List[str]
    responsibilities: List[str]
    skills_required: List[str]
    raw_text: str
