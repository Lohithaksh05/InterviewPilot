from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from ..services.voice_analysis_service import VoiceAnalysisService
from ..services.auth_service import get_current_user
from ..models.voice_models import VoiceAnalysisResult
from ..models.user_models import User
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
voice_analysis_service = VoiceAnalysisService()

@router.get("/test")
async def test_voice_analysis_endpoint():
    """Test endpoint to verify voice analysis router is working"""
    return {"message": "Voice analysis router is working!", "status": "success"}

@router.post("/analyze")
async def analyze_voice_recording(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Analyze a voice recording and provide feedback"""
    try:
        # Extract request data
        recording_id = request.get("recording_id")
        session_id = request.get("session_id")
        question_index = request.get("question_index")
        audio_data = request.get("audio_data")  # base64 encoded
        transcript = request.get("transcript", "")
        duration = request.get("duration", 0.0)
        
        if not all([recording_id, session_id, audio_data]):
            raise HTTPException(
                status_code=400,
                detail="recording_id, session_id, and audio_data are required"
            )
        
        # Analyze the voice recording
        analysis_result = await voice_analysis_service.analyze_voice_recording(
            recording_id=recording_id,
            user_id=current_user.id,
            session_id=session_id,
            question_index=question_index or 0,
            audio_data=audio_data,
            transcript=transcript,
            duration=float(duration)
        )
        
        return {"analysis": analysis_result.dict()}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing voice recording: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze voice recording")

@router.post("/quick-analyze")
async def quick_voice_analysis(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Quick voice analysis for real-time feedback"""
    try:
        transcript = request.get("transcript", "")
        duration = request.get("duration", 0.0)
        
        if not transcript:
            raise HTTPException(status_code=400, detail="transcript is required")
        
        # Quick analysis without full audio processing
        word_count = len(transcript.split())
        speaking_rate = (word_count / duration) * 60 if duration > 0 else 0
        
        # Count filler words
        filler_words = ["um", "uh", "er", "ah", "like", "you know", "so", "well"]
        filler_count = sum(transcript.lower().count(filler) for filler in filler_words)
        filler_rate = (filler_count / duration) * 60 if duration > 0 else 0
        
        # Quick feedback
        feedback = []
        if speaking_rate < 120:
            feedback.append("Try speaking a bit faster")
        elif speaking_rate > 180:
            feedback.append("Try speaking more slowly")
        else:
            feedback.append("Good speaking pace")
        
        if filler_count > 3:
            feedback.append("Try to reduce filler words")
        elif filler_count <= 1:
            feedback.append("Great job avoiding filler words")
        
        return {
            "quick_analysis": {
                "speaking_rate": speaking_rate,
                "filler_count": filler_count,
                "filler_rate": filler_rate,
                "word_count": word_count,
                "feedback": feedback,
                "confidence_score": max(50, min(100, 80 - filler_count * 5 + (speaking_rate - 120) * 0.2))
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in quick voice analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to perform quick voice analysis")

@router.post("/practice-analyze")
async def practice_voice_analysis(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Detailed voice analysis for practice sessions (transcript-only)"""
    try:
        transcript = request.get("transcript", "")
        duration = request.get("duration", 0.0)
        
        if not transcript or duration <= 0:
            raise HTTPException(
                status_code=400,
                detail="transcript and duration are required"
            )
        
        # Perform comprehensive transcript-based analysis
        word_count = len(transcript.split())
        speaking_rate = (word_count / duration) * 60 if duration > 0 else 0
        
        # Count filler words
        filler_words_list = ["um", "uh", "er", "ah", "like", "you know", "so", "well", "actually", "basically"]
        filler_analysis = []
        total_filler_count = 0
        
        for filler in filler_words_list:
            count = transcript.lower().count(filler)
            if count > 0:
                filler_analysis.append({"word": filler, "count": count})
                total_filler_count += count
        
        filler_rate = (total_filler_count / duration) * 60 if duration > 0 else 0
        
        # Calculate scores
        pace_score = min(100, max(0, 100 - abs(speaking_rate - 150) * 2))
        filler_score = max(0, 100 - total_filler_count * 10)
        
        # Overall confidence score
        confidence_score = (pace_score + filler_score) / 2
        
        # Generate feedback
        strengths = []
        improvement_areas = []
        
        if speaking_rate >= 130 and speaking_rate <= 170:
            strengths.append("Excellent speaking pace - easy to follow")
        elif speaking_rate < 130:
            improvement_areas.append("Try speaking a bit faster to maintain engagement")
        else:
            improvement_areas.append("Try speaking more slowly for better clarity")
        
        if total_filler_count <= 2:
            strengths.append("Great job avoiding filler words")
        elif total_filler_count <= 5:
            strengths.append("Good control of filler words")
        else:
            improvement_areas.append("Work on reducing filler words")
        
        if word_count >= 50:
            strengths.append("Good content depth and elaboration")
        else:
            improvement_areas.append("Try to provide more detailed responses")
        
        # Create detailed analysis result
        analysis_result = {
            "overall_score": confidence_score,
            "voice_metrics": {
                "speaking_rate": speaking_rate,
                "clarity_score": min(100, confidence_score + 10),  # Simulated
                "confidence_score": confidence_score,
                "pause_frequency": max(0, total_filler_count * 0.5),  # Estimated
                "volume_consistency": 85,  # Simulated
                "energy_level": min(100, confidence_score + 5)  # Simulated
            },
            "filler_words": filler_analysis,
            "strengths": strengths,
            "improvement_areas": improvement_areas,
            "specific_feedback": f"Based on your {duration:.1f}-second response with {word_count} words, you're speaking at {speaking_rate:.0f} words per minute. {'Great job maintaining a natural pace!' if 130 <= speaking_rate <= 170 else 'Consider adjusting your speaking pace for better delivery.'}"
        }
        
        return {"analysis": analysis_result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in practice voice analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to perform practice voice analysis")

@router.post("/practice-detailedanalyze")
async def practice_detailed_voice_analysis(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Detailed voice analysis for practice sessions with audio data"""
    try:
        transcript = request.get("transcript", "")
        duration = request.get("duration", 0.0)
        audio_data = request.get("audio_data")
        
        if not transcript or duration <= 0:
            raise HTTPException(
                status_code=400,
                detail="transcript and duration are required"
            )
        
        # Use the voice analysis service for comprehensive analysis
        analysis_result = await voice_analysis_service.analyze_voice_recording(
            recording_id=f"practice_{current_user.id}_{int(duration)}",
            user_id=current_user.id,
            session_id="practice_session",
            question_index=0,
            audio_data=audio_data,
            transcript=transcript,
            duration=float(duration)
        )
        
        return {"analysis": analysis_result.dict()}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in practice detailed voice analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to perform practice detailed voice analysis")

@router.get("/coaching-tips")
async def get_voice_coaching_tips(
    category: str = None,
    current_user: User = Depends(get_current_user)
):
    """Get voice coaching tips and exercises"""
    try:
        all_tips = {
            "speaking_pace": [
                {
                    "tip": "Practice reading aloud at 150 words per minute",
                    "priority": 1,
                    "exercise": "Read a news article for 2 minutes and count your words"
                },
                {
                    "tip": "Use a metronome to maintain consistent pace",
                    "priority": 2,
                    "exercise": "Speak one word per beat at 150 BPM"
                }
            ],
            "filler_reduction": [
                {
                    "tip": "Pause instead of saying 'um' or 'uh'",
                    "priority": 1,
                    "exercise": "Practice the 'pause challenge' - pause for 2 seconds when you want to say a filler"
                },
                {
                    "tip": "Prepare key phrases to buy thinking time",
                    "priority": 2,
                    "exercise": "Practice using phrases like 'That's a great question' or 'Let me think about that'"
                }
            ],
            "volume_control": [
                {
                    "tip": "Practice diaphragmatic breathing for consistent volume",
                    "priority": 1,
                    "exercise": "Place hand on chest and stomach - only the stomach should move when breathing"
                },
                {
                    "tip": "Record yourself and adjust volume levels",
                    "priority": 2,
                    "exercise": "Record a 2-minute speech and listen for volume consistency"
                }
            ],
            "clarity": [
                {
                    "tip": "Practice tongue twisters for articulation",
                    "priority": 1,
                    "exercise": "Say 'Red leather, yellow leather' 5 times quickly"
                },
                {
                    "tip": "Open your mouth wider when speaking",
                    "priority": 2,
                    "exercise": "Practice speaking with a pen horizontally between your teeth"
                }
            ]
        }
        
        if category and category in all_tips:
            return {"tips": all_tips[category], "category": category}
        else:
            return {"tips": all_tips, "categories": list(all_tips.keys())}
            
    except Exception as e:
        logger.error(f"Error fetching coaching tips: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch coaching tips")

@router.get("/voice-patterns/{user_id}")
async def get_user_voice_patterns(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get voice patterns and trends for a user"""
    try:
        # Ensure user can only access their own data
        if user_id != current_user.id and not getattr(current_user, 'is_admin', False):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Mock implementation - in real version, this would analyze historical voice data
        patterns = [
            {
                "pattern_type": "speaking_pace",
                "trend": "improving",
                "current_value": 145.0,
                "target_value": 150.0,
                "confidence": 0.85,
                "description": "Your speaking pace has improved by 10 WPM over the last month"
            },
            {
                "pattern_type": "filler_usage",
                "trend": "stable",
                "current_value": 2.3,
                "target_value": 1.0,
                "confidence": 0.75,
                "description": "Filler word usage remains consistent but could be reduced"
            }
        ]
        
        return {
            "user_id": user_id,
            "voice_patterns": patterns,
            "analysis_period": "last_30_days"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching voice patterns: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch voice patterns")
