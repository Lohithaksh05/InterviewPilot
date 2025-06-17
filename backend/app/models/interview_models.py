from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any, Union
from typing_extensions import Annotated
from enum import Enum
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from pydantic import GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema

# Indian Standard Time (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now():
    """Get current time in Indian Standard Time as naive datetime"""
    # Get current UTC time
    now_utc = datetime.now(timezone.utc)
    # Convert to IST and strip timezone info for storage as naive local time
    ist_time = now_utc.astimezone(IST)
    return ist_time.replace(tzinfo=None)

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetJsonSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(
        cls, _schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {"type": "string"}

class InterviewerType(str, Enum):
    HR = "hr"
    TECH_LEAD = "tech_lead"
    BEHAVIORAL = "behavioral"

class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

def serialize_datetime(dt):
    """Custom datetime serializer that preserves timezone info"""
    if dt is None:
        return None
    # If datetime has timezone info, format it properly
    if dt.tzinfo is not None:
        return dt.isoformat()
    else:
        # If no timezone info, assume it's IST and add timezone
        ist_dt = dt.replace(tzinfo=IST)
        return ist_dt.isoformat()

class InterviewSession(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={
            ObjectId: str,
            datetime: serialize_datetime
        }
    )
    id: Optional[str] = Field(default=None, alias="_id")  # Use string ID instead of ObjectId
    session_id: str
    user_id: str  # Reference to the user who owns this session
    interviewer_type: Union[InterviewerType, str]  # Allow both enum and string for template job roles
    difficulty: DifficultyLevel
    job_description: str
    resume_text: str
    questions: List[str] = []
    answers: List[str] = []
    feedback: List[Dict[str, Any]] = []
    score: Optional[float] = None
    completed: bool = False
    duration_minutes: Optional[int] = Field(default=None, description="Interview duration in minutes")
    time_limit_enabled: bool = Field(default=True, description="Whether time limit is enforced")
    minutes_taken: Optional[int] = Field(default=None, description="Actual minutes taken to complete interview")
    
    # Multi-agent question mapping for template-based interviews
    question_interviewer_types: Optional[List[str]] = Field(default=None, description="Which interviewer type should handle each question")
    
    # Template-related fields
    is_template_based: bool = Field(default=False, description="Whether this interview uses a template")
    template_id: Optional[str] = Field(default=None, description="ID of the template used")
    template_name: Optional[str] = Field(default=None, description="Name of the template used")
    template_job_role: Optional[str] = Field(default=None, description="Job role from the template")
    template_question_distribution: Optional[Dict[str, int]] = Field(default=None, description="Question distribution from template")
    template_interviewer_types: Optional[List[str]] = Field(default=None, description="List of interviewer types from template")
    started_at: Optional[datetime] = Field(default=None, description="When the interview actually started")
    ended_at: Optional[datetime] = Field(default=None, description="When the interview ended")
    created_at: datetime
    updated_at: datetime

class Question(BaseModel):
    question: str
    interviewer_type: InterviewerType
    category: str
    difficulty: DifficultyLevel

class Answer(BaseModel):
    session_id: str
    question: str
    answer: str
    
class Feedback(BaseModel):
    answer: str
    feedback: str
    score: float
    suggestions: List[str]

class InterviewSummary(BaseModel):
    session_id: str
    user_id: str
    interviewer_type: InterviewerType
    difficulty: DifficultyLevel
    total_questions: int
    answered_questions: int
    average_score: float
    individual_feedback: List[Dict[str, Any]]
    overall_summary: Dict[str, Any]
    qa_pairs: List[Dict[str, Any]]
    created_at: datetime

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

class InterviewRecording(BaseModel):
    recording_id: str = Field(alias="_id")  # Use custom string ID instead of ObjectId
    user_id: str  # Use string instead of PyObjectId for consistency
    session_id: str  # Keep as string since we use UUIDs for session IDs
    question_index: int
    audio_data: str  # Base64 encoded audio
    duration: float  # Duration in seconds    
    transcript: Optional[str] = None
    file_size: int
    mime_type: str
    created_at: datetime
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={
            ObjectId: str,
            datetime: serialize_datetime
        }
    )

class SaveRecordingRequest(BaseModel):
    session_id: str
    question_index: int
    audio_data: str  # Base64 encoded
    duration: float
    transcript: Optional[str] = None
    file_size: int
    mime_type: str = "audio/webm"
