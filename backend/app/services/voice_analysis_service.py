import base64
import io
import wave
from typing import Dict, List, Any, Optional
from ..models.voice_models import (
    VoiceMetrics, VoiceAnalysisResult, FillerWordAnalysis, 
    VoicePattern, VoiceCoachingTip
)
from ..models.interview_models import get_ist_now
from datetime import datetime
import logging
import re

logger = logging.getLogger(__name__)

class VoiceAnalysisService:
    def __init__(self):
        self.filler_words = [
            "um", "uh", "er", "ah", "like", "you know", "so", "well",
            "basically", "actually", "literally", "kind of", "sort of"
        ]
        self.optimal_wpm = 150  # words per minute
        self.optimal_pause_rate = 8  # pauses per minute
    
    async def analyze_voice_recording(self, 
                                    recording_id: str,
                                    user_id: str,
                                    session_id: str,
                                    question_index: int,
                                    audio_data: str,  # base64 encoded
                                    transcript: str,
                                    duration: float) -> VoiceAnalysisResult:
        """Analyze voice recording and provide comprehensive feedback"""
        try:
            # Decode audio data
            audio_bytes = base64.b64decode(audio_data)
            
            # Basic audio analysis
            voice_metrics = await self._analyze_audio_metrics(
                audio_bytes, transcript, duration
            )
            
            # Filler word analysis
            filler_analysis = self._analyze_filler_words(transcript)
            
            # Speech pattern analysis
            speech_segments = self._analyze_speech_patterns(transcript, duration)
            
            # Calculate overall score
            overall_score = self._calculate_overall_voice_score(voice_metrics, filler_analysis)
            
            # Generate feedback
            improvement_areas, strengths = self._generate_feedback_areas(voice_metrics, filler_analysis)
            specific_feedback = self._generate_specific_feedback(voice_metrics, filler_analysis)
            
            # Get comparison data
            previous_performance = await self._get_previous_performance(user_id)
            benchmark_comparison = self._get_benchmark_comparison(voice_metrics)
            
            return VoiceAnalysisResult(
                recording_id=recording_id,
                user_id=user_id,
                session_id=session_id,
                question_index=question_index,
                voice_metrics=voice_metrics,
                filler_words=filler_analysis,
                speech_segments=speech_segments,
                overall_score=overall_score,
                improvement_areas=improvement_areas,
                strengths=strengths,
                specific_feedback=specific_feedback,
                previous_performance=previous_performance,
                benchmark_comparison=benchmark_comparison,
                analyzed_at=get_ist_now()
            )
            
        except Exception as e:
            logger.error(f"Error analyzing voice recording: {str(e)}")
            # Return basic analysis if detailed analysis fails
            return self._create_basic_analysis(
                recording_id, user_id, session_id, question_index, transcript, duration
            )
    
    async def _analyze_audio_metrics(self, audio_bytes: bytes, transcript: str, duration: float) -> VoiceMetrics:
        """Analyze audio metrics from the recording"""
        try:
            # Basic metrics from transcript and duration
            word_count = len(transcript.split()) if transcript else 0
            speaking_rate = (word_count / duration) * 60 if duration > 0 else 0
            
            # Estimate pauses from transcript (periods and commas)
            pause_indicators = transcript.count('.') + transcript.count(',') + transcript.count('?') + transcript.count('!')
            pause_frequency = (pause_indicators / duration) * 60 if duration > 0 else 0
            
            # Estimate other metrics (these would be more accurate with actual audio processing)
            file_size = len(audio_bytes)
            
            # Mock audio analysis (in real implementation, you'd use librosa or similar)
            average_volume = self._estimate_volume(transcript)
            volume_consistency = self._estimate_volume_consistency(transcript)
            clarity_score = self._estimate_clarity(transcript, speaking_rate)
            
            # Confidence indicators
            confidence_score = self._calculate_confidence_score(speaking_rate, pause_frequency, clarity_score)
            
            return VoiceMetrics(
                duration=duration,
                file_size=file_size,
                speaking_rate=speaking_rate,
                pause_frequency=pause_frequency,
                average_pause_duration=0.8,  # Estimated
                average_volume=average_volume,
                volume_consistency=volume_consistency,
                peak_volume=min(average_volume + 15, 100),
                quiet_moments=max(0, int(duration / 10)),  # Estimated
                clarity_score=clarity_score,
                articulation_score=min(clarity_score + 5, 100),
                filler_word_count=self._count_filler_words(transcript),
                filler_word_rate=(self._count_filler_words(transcript) / duration) * 60 if duration > 0 else 0,
                voice_stability=max(50, 100 - abs(speaking_rate - self.optimal_wpm) / 2),
                energy_level=min(speaking_rate * 0.6, 100),
                confidence_score=confidence_score,
                response_time=1.2,  # Estimated
                answer_completeness=self._estimate_completeness(transcript),
                coherence_score=self._estimate_coherence(transcript)
            )
            
        except Exception as e:
            logger.error(f"Error analyzing audio metrics: {str(e)}")
            return self._create_default_metrics(duration, len(audio_bytes))
    
    def _analyze_filler_words(self, transcript: str) -> List[FillerWordAnalysis]:
        """Analyze filler words in the transcript"""
        filler_analysis = []
        
        for filler in self.filler_words:
            pattern = r'\b' + re.escape(filler.lower()) + r'\b'
            matches = list(re.finditer(pattern, transcript.lower()))
            
            if matches:
                # Estimate timestamps (in real implementation, this would use audio alignment)
                timestamps = [i * 0.5 for i in range(len(matches))]  # Mock timestamps
                
                filler_analysis.append(FillerWordAnalysis(
                    word=filler,
                    count=len(matches),
                    timestamps=timestamps
                ))
        
        return filler_analysis
    
    def _analyze_speech_patterns(self, transcript: str, duration: float) -> List[Dict[str, Any]]:
        """Analyze speech vs pause patterns"""
        # Mock implementation - would use actual audio analysis
        sentences = transcript.split('.')
        segment_duration = duration / max(len(sentences), 1)
        
        segments = []
        current_time = 0
        
        for i, sentence in enumerate(sentences):
            if sentence.strip():
                segments.append({
                    "type": "speech",
                    "start_time": current_time,
                    "duration": segment_duration * 0.8,
                    "content": sentence.strip()
                })
                current_time += segment_duration * 0.8
                
                # Add pause between sentences
                if i < len(sentences) - 1:
                    segments.append({
                        "type": "pause",
                        "start_time": current_time,
                        "duration": segment_duration * 0.2,
                        "content": ""
                    })
                    current_time += segment_duration * 0.2
        
        return segments
    
    def _calculate_overall_voice_score(self, metrics: VoiceMetrics, filler_analysis: List[FillerWordAnalysis]) -> float:
        """Calculate overall voice performance score"""
        # Speaking rate score (optimal around 150 WPM)
        rate_score = max(0, 100 - abs(metrics.speaking_rate - self.optimal_wpm) * 2)
        
        # Filler word penalty
        total_fillers = sum(f.count for f in filler_analysis)
        filler_penalty = min(total_fillers * 5, 30)  # Max 30 point penalty
        
        # Combine scores
        overall_score = (
            rate_score * 0.3 +
            metrics.clarity_score * 0.25 +
            metrics.confidence_score * 0.25 +
            metrics.coherence_score * 0.2
        ) - filler_penalty
        
        return max(0, min(100, overall_score))
    
    def _generate_feedback_areas(self, metrics: VoiceMetrics, filler_analysis: List[FillerWordAnalysis]) -> tuple:
        """Generate improvement areas and strengths"""
        improvement_areas = []
        strengths = []
        
        # Speaking rate analysis
        if metrics.speaking_rate < 120:
            improvement_areas.append("Speaking too slowly - try to increase your pace")
        elif metrics.speaking_rate > 180:
            improvement_areas.append("Speaking too quickly - slow down for better clarity")
        else:
            strengths.append("Good speaking pace")
        
        # Filler words
        total_fillers = sum(f.count for f in filler_analysis)
        if total_fillers > 5:
            improvement_areas.append("Reduce filler words (um, uh, like)")
        elif total_fillers <= 2:
            strengths.append("Minimal use of filler words")
        
        # Clarity and confidence
        if metrics.clarity_score < 70:
            improvement_areas.append("Work on speaking more clearly")
        else:
            strengths.append("Clear and articulate speech")
        
        if metrics.confidence_score < 60:
            improvement_areas.append("Build confidence in your delivery")
        else:
            strengths.append("Confident speaking style")
        
        return improvement_areas, strengths
    
    def _generate_specific_feedback(self, metrics: VoiceMetrics, filler_analysis: List[FillerWordAnalysis]) -> str:
        """Generate specific, actionable feedback"""
        feedback_parts = []
        
        # Speaking rate feedback
        if metrics.speaking_rate < 120:
            feedback_parts.append(f"Your speaking rate of {metrics.speaking_rate:.1f} WPM is slower than ideal. Try to speak with more energy and pace.")
        elif metrics.speaking_rate > 180:
            feedback_parts.append(f"Your speaking rate of {metrics.speaking_rate:.1f} WPM is quite fast. Take pauses to let your words sink in.")
        else:
            feedback_parts.append(f"Your speaking rate of {metrics.speaking_rate:.1f} WPM is in a good range.")
        
        # Filler word feedback
        total_fillers = sum(f.count for f in filler_analysis)
        if total_fillers > 0:
            most_common = max(filler_analysis, key=lambda x: x.count) if filler_analysis else None
            if most_common:
                feedback_parts.append(f"You used '{most_common.word}' {most_common.count} times. Try to pause instead of using filler words.")
        
        # Confidence feedback
        if metrics.confidence_score < 70:
            feedback_parts.append("Your voice could sound more confident. Practice speaking with conviction and varying your tone.")
        
        return " ".join(feedback_parts)
    
    async def _get_previous_performance(self, user_id: str) -> Optional[Dict[str, float]]:
        """Get user's previous voice analysis performance"""
        # Mock implementation - would query database
        return {
            "speaking_rate": 145.0,
            "clarity_score": 78.0,
            "confidence_score": 72.0,
            "filler_word_rate": 3.2
        }
    
    def _get_benchmark_comparison(self, metrics: VoiceMetrics) -> Dict[str, float]:
        """Compare user's performance to benchmarks"""
        return {
            "speaking_rate_percentile": self._calculate_percentile(metrics.speaking_rate, 150, 25),
            "clarity_percentile": metrics.clarity_score,
            "confidence_percentile": metrics.confidence_score,
            "filler_rate_percentile": max(0, 100 - metrics.filler_word_rate * 10)
        }
    
    def _calculate_percentile(self, value: float, mean: float, std: float) -> float:
        """Calculate percentile based on normal distribution"""
        z_score = (value - mean) / std if std > 0 else 0
        # Simplified percentile calculation
        percentile = max(0, min(100, 50 + z_score * 15))
        return percentile
    
    # Helper methods for estimation
    def _estimate_volume(self, transcript: str) -> float:
        """Estimate volume based on transcript characteristics"""
        # Longer sentences might indicate higher volume/confidence
        avg_sentence_length = len(transcript.split()) / max(transcript.count('.') + transcript.count('!') + transcript.count('?'), 1)
        return min(50 + avg_sentence_length * 2, 85)
    
    def _estimate_volume_consistency(self, transcript: str) -> float:
        """Estimate volume consistency"""
        # Less variation in sentence length = more consistency
        sentences = [s.strip() for s in transcript.split('.') if s.strip()]
        if len(sentences) < 2:
            return 80.0
        
        lengths = [len(s.split()) for s in sentences]
        avg_length = sum(lengths) / len(lengths)
        variance = sum((l - avg_length) ** 2 for l in lengths) / len(lengths)
        consistency = max(50, 100 - variance * 2)
        return min(consistency, 95)
    
    def _estimate_clarity(self, transcript: str, speaking_rate: float) -> float:
        """Estimate speech clarity"""
        # Factors: reasonable speaking rate, proper punctuation, word choice
        rate_factor = max(0, 100 - abs(speaking_rate - 150) * 0.5)
        
        # Count complex words (longer words might indicate good vocabulary)
        words = transcript.split()
        complex_words = [w for w in words if len(w) > 6]
        vocabulary_factor = min(80 + len(complex_words) * 2, 95)
        
        return (rate_factor + vocabulary_factor) / 2
    
    def _calculate_confidence_score(self, speaking_rate: float, pause_frequency: float, clarity: float) -> float:
        """Calculate confidence score based on multiple factors"""
        # Good speaking rate indicates confidence
        rate_confidence = max(0, 100 - abs(speaking_rate - 150) * 0.8)
        
        # Appropriate pause frequency indicates confidence
        pause_confidence = max(0, 100 - abs(pause_frequency - self.optimal_pause_rate) * 5)
        
        # Combine factors
        confidence = (rate_confidence * 0.4 + pause_confidence * 0.3 + clarity * 0.3)
        return min(confidence, 95)
    
    def _count_filler_words(self, transcript: str) -> int:
        """Count filler words in transcript"""
        count = 0
        text_lower = transcript.lower()
        
        for filler in self.filler_words:
            pattern = r'\b' + re.escape(filler) + r'\b'
            count += len(re.findall(pattern, text_lower))
        
        return count
    
    def _estimate_completeness(self, transcript: str) -> float:
        """Estimate answer completeness"""
        word_count = len(transcript.split())
        
        # Assume 50-150 words is a complete answer
        if word_count < 20:
            return 40.0
        elif word_count < 50:
            return 60.0 + (word_count - 20) * 1.3
        elif word_count <= 150:
            return 90.0
        else:
            return max(70, 90 - (word_count - 150) * 0.2)
    
    def _estimate_coherence(self, transcript: str) -> float:
        """Estimate speech coherence"""
        # Factors: sentence structure, transitions, logical flow
        sentences = [s.strip() for s in transcript.split('.') if s.strip()]
        
        if len(sentences) < 2:
            return 70.0
        
        # Check for transition words
        transition_words = ['however', 'therefore', 'moreover', 'furthermore', 'additionally', 'first', 'second', 'finally']
        transition_count = sum(1 for word in transition_words if word in transcript.lower())
        
        # Check sentence length variation (good for coherence)
        lengths = [len(s.split()) for s in sentences]
        avg_length = sum(lengths) / len(lengths)
        has_variation = any(abs(l - avg_length) > avg_length * 0.3 for l in lengths)
        
        base_score = 70
        if transition_count > 0:
            base_score += min(transition_count * 5, 15)
        if has_variation:
            base_score += 10
        
        return min(base_score, 95)
    
    def _create_default_metrics(self, duration: float, file_size: int) -> VoiceMetrics:
        """Create default metrics when analysis fails"""
        return VoiceMetrics(
            duration=duration,
            file_size=file_size,
            speaking_rate=120.0,
            pause_frequency=5.0,
            average_pause_duration=1.0,
            average_volume=60.0,
            volume_consistency=70.0,
            peak_volume=75.0,
            quiet_moments=2,
            clarity_score=70.0,
            articulation_score=70.0,
            filler_word_count=0,
            filler_word_rate=0.0,
            voice_stability=70.0,
            energy_level=65.0,
            confidence_score=70.0,
            response_time=1.5,
            answer_completeness=75.0,
            coherence_score=70.0
        )
    
    def _create_basic_analysis(self, recording_id: str, user_id: str, session_id: str, 
                              question_index: int, transcript: str, duration: float) -> VoiceAnalysisResult:
        """Create basic analysis when detailed analysis fails"""
        basic_metrics = self._create_default_metrics(duration, 1000)
        
        return VoiceAnalysisResult(
            recording_id=recording_id,
            user_id=user_id,
            session_id=session_id,
            question_index=question_index,
            voice_metrics=basic_metrics,
            filler_words=[],
            speech_segments=[],
            overall_score=70.0,            improvement_areas=["Analysis data limited - try recording with better audio quality"],
            strengths=["Successfully completed voice recording"],
            specific_feedback="Voice analysis completed with limited data. For better insights, ensure clear audio recording.",
            analyzed_at=get_ist_now()
        )
