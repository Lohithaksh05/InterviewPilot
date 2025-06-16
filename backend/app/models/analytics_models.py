from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class AnalyticsPeriod(str, Enum):
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"
    ALL_TIME = "all_time"

class PerformanceMetrics(BaseModel):
    user_id: str
    period: AnalyticsPeriod
    
    # Session Statistics
    total_sessions: int
    completed_sessions: int
    completion_rate: float
    
    # Score Analytics
    average_score: float
    highest_score: float
    lowest_score: float
    score_trend: List[Dict[str, Any]]  # [{date: "2025-01-01", score: 85.5}]
    
    # Time Analytics
    total_practice_time: int  # minutes
    average_session_duration: float  # minutes
    practice_streak: int  # consecutive days
    last_practice_date: Optional[datetime]
    
    # Interviewer Performance
    interviewer_breakdown: Dict[str, Dict[str, Any]]  # {"hr": {"count": 5, "avg_score": 82.3}}
    
    # Difficulty Analysis
    difficulty_performance: Dict[str, Dict[str, Any]]  # {"easy": {"count": 3, "avg_score": 90}}
    
    # Improvement Areas
    weak_categories: List[Dict[str, Any]]  # [{"category": "technical", "avg_score": 65.2}]
    strong_categories: List[Dict[str, Any]]
    
    # Goals and Achievements
    goals_set: int
    goals_achieved: int
    achievements_unlocked: List[str]
    
    # Comparison Data
    percentile_rank: Optional[float]  # User's percentile compared to others
    industry_benchmark: Optional[float]

class WeeklyProgress(BaseModel):
    week_start: datetime
    sessions_count: int
    average_score: float
    time_practiced: int  # minutes
    improvement: float  # score change from previous week

class CategoryAnalysis(BaseModel):
    category: str
    total_questions: int
    correct_answers: int
    accuracy_rate: float
    average_confidence: float
    time_to_answer: float  # average seconds
    improvement_trend: str  # "improving", "declining", "stable"

class GoalTracking(BaseModel):
    goal_id: str
    user_id: str
    goal_type: str  # "score_improvement", "practice_frequency", "category_mastery"
    target_value: float
    current_value: float
    target_date: datetime
    created_date: datetime
    status: str  # "active", "completed", "expired"
    progress_percentage: float

class UserBenchmark(BaseModel):
    user_id: str
    experience_level: str  # "junior", "mid", "senior"
    job_role: str
    user_average: float
    peer_average: float
    industry_average: float
    ranking: int  # out of total users
    total_users: int
