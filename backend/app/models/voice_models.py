from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class VoiceMetrics(BaseModel):
    # Basic Audio Properties
    duration: float  # seconds
    file_size: int  # bytes
    sample_rate: Optional[int] = None
    
    # Speech Analysis
    speaking_rate: float  # words per minute
    pause_frequency: float  # pauses per minute
    average_pause_duration: float  # seconds
    
    # Volume Analysis
    average_volume: float  # 0-100 scale
    volume_consistency: float  # standard deviation
    peak_volume: float
    quiet_moments: int  # number of very quiet segments
    
    # Speech Quality
    clarity_score: float  # 0-100, based on transcription confidence
    articulation_score: float  # 0-100
    filler_word_count: int  # "um", "uh", "like", etc.
    filler_word_rate: float  # fillers per minute
    
    # Confidence Indicators
    voice_stability: float  # 0-100, less trembling = higher score
    energy_level: float  # 0-100, vocal energy
    confidence_score: float  # overall confidence based on multiple factors
    
    # Communication Patterns
    response_time: float  # seconds from question end to answer start
    answer_completeness: float  # 0-100, based on expected answer length
    coherence_score: float  # 0-100, how well-structured the response is

class FillerWordAnalysis(BaseModel):
    word: str
    count: int
    timestamps: List[float]  # when each filler occurred
    
class VoiceAnalysisResult(BaseModel):
    recording_id: str
    user_id: str
    session_id: str
    question_index: int
    
    # Core Metrics
    voice_metrics: VoiceMetrics
    
    # Detailed Analysis
    filler_words: List[FillerWordAnalysis]
    speech_segments: List[Dict[str, Any]]  # speaking vs pause segments
    
    # Scores and Feedback
    overall_score: float  # 0-100
    improvement_areas: List[str]
    strengths: List[str]
    specific_feedback: str
    
    # Comparison Data
    previous_performance: Optional[Dict[str, float]] = None
    benchmark_comparison: Optional[Dict[str, float]] = None
    
    # Analysis Metadata
    analyzed_at: datetime
    analysis_version: str = "1.0"

class VoicePattern(BaseModel):
    pattern_type: str  # "pace", "volume", "clarity", etc.
    confidence: float  # how confident we are in this pattern
    description: str
    recommendation: str

class VoiceCoachingTip(BaseModel):
    category: str  # "speaking_pace", "volume_control", "filler_reduction"
    tip: str
    priority: int  # 1-5, 1 being highest priority
    practice_exercise: Optional[str] = None
