from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from typing_extensions import Annotated
from enum import Enum
from datetime import datetime
from bson import ObjectId
from pydantic import GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema

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

class InterviewSession(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    id: Optional[str] = Field(default=None, alias="_id")  # Use string ID instead of ObjectId
    session_id: str
    user_id: str  # Reference to the user who owns this session
    interviewer_type: InterviewerType
    difficulty: DifficultyLevel
    job_description: str
    resume_text: str
    questions: List[str] = []
    answers: List[str] = []
    feedback: List[Dict[str, Any]] = []
    score: Optional[float] = None
    completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

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
        json_encoders={ObjectId: str}
    )

class SaveRecordingRequest(BaseModel):
    session_id: str
    question_index: int
    audio_data: str  # Base64 encoded
    duration: float
    transcript: Optional[str] = None
    file_size: int
    mime_type: str = "audio/webm"
