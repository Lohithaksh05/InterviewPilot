from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from enum import Enum

class JobRole(str, Enum):
    SOFTWARE_ENGINEER = "software_engineer"
    PRODUCT_MANAGER = "product_manager"
    DATA_SCIENTIST = "data_scientist"
    UI_UX_DESIGNER = "ui_ux_designer"
    MARKETING_MANAGER = "marketing_manager"
    SALES_REPRESENTATIVE = "sales_representative"
    BUSINESS_ANALYST = "business_analyst"
    PROJECT_MANAGER = "project_manager"
    CUSTOMER_SUCCESS = "customer_success"
    HR_GENERALIST = "hr_generalist"

class QuestionCategory(str, Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    SITUATIONAL = "situational"
    CULTURAL_FIT = "cultural_fit"
    PROBLEM_SOLVING = "problem_solving"
    LEADERSHIP = "leadership"
    COMMUNICATION = "communication"

class InterviewTemplate(BaseModel):
    id: str
    job_role: JobRole
    name: str
    description: str
    duration_minutes: int
    question_distribution: Dict[str, int]  # {"technical": 5, "behavioral": 3, "situational": 2}
    difficulty_breakdown: Dict[str, int]  # {"easy": 3, "medium": 5, "hard": 2}
    interviewer_types: List[str]  # ["tech_lead", "hr", "behavioral"]
    key_skills: List[str]
    common_questions: List[Dict[str, Any]]
    evaluation_criteria: List[str]
    industry_focus: Optional[str] = None
    experience_level: str = "mid"  # junior, mid, senior
    sample_questions: List[str] = []

class TemplateQuestion(BaseModel):
    question_text: str
    category: QuestionCategory
    difficulty: str
    interviewer_type: str
    expected_answer_length: str  # "short", "medium", "long"
    evaluation_points: List[str]
    follow_up_questions: Optional[List[str]] = None

class UserTemplate(BaseModel):
    user_id: str
    template_id: str
    customizations: Dict[str, Any]
    usage_count: int = 0
    last_used: Optional[str] = None
    performance_history: List[Dict[str, Any]] = []
