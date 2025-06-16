import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowRight, Clock, MessageCircle, Mic, MicOff, Brain, Sparkles, Zap, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { interviewAPI } from '../services/api';
import EnhancedLiveSpeech from '../components/EnhancedLiveSpeechSimple';
import InterviewTimer from '../components/InterviewTimer';
import { calculateInterviewDuration } from '../utils/interviewDuration';

const InterviewSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timerActive, setTimerActive] = useState(true);
  const [interviewDuration, setInterviewDuration] = useState(30);
  const answerRef = useRef(null);
  const enhancedLiveSpeechRef = useRef(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      setLoading(true);
      try {
        const response = await interviewAPI.getSession(sessionId);
        setSession(response);
        
        // Mark interview as started when user first loads the page
        try {
          await interviewAPI.startSession(sessionId);
        } catch (startError) {
          console.warn('Could not mark interview as started:', startError);
        }
        
        // Calculate dynamic duration based on session parameters
        let duration;
        if (response.duration_minutes) {
          duration = response.duration_minutes;
        } else {
          duration = calculateInterviewDuration({
            numQuestions: response.questions?.length || 5,
            difficulty: response.difficulty || 'medium',
            interviewerType: response.interviewer_type || 'hr',
            selectedTemplate: response.template_settings || null
          });
        }
        
        setInterviewDuration(duration);
        
        if (response.completed) {
          navigate(`/results/${sessionId}`);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        toast.error(error.message || 'Failed to load interview session');
        navigate('/interview');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId, navigate]);

  // Helper function to complete interview and navigate to results
  const completeInterviewAndNavigate = useCallback(async (delay = 2000) => {
    try {
      await interviewAPI.completeInterview(sessionId);
      setTimeout(() => {
        navigate(`/results/${sessionId}`);
      }, delay);
    } catch (error) {
      console.error('Error completing interview:', error);
      setTimeout(() => {
        navigate(`/results/${sessionId}`);
      }, delay);
    }
  }, [sessionId, navigate]);

  // Convert audio blob to base64
  const convertBlobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Upload recording to database
  const uploadRecording = useCallback(async (recordingData) => {
    if (!recordingData || !recordingData.audioBlob) {
      return;
    }

    try {
      const base64Audio = await convertBlobToBase64(recordingData.audioBlob);
      
      const uploadData = {
        session_id: sessionId,
        question_index: session.current_question,
        audio_data: base64Audio,
        duration: Number(recordingData.duration) || 0,
        transcript: recordingData.transcript || '',
        file_size: Number(recordingData.audioBlob.size) || 0,
        mime_type: recordingData.audioBlob.type || 'audio/webm'
      };

      const response = await interviewAPI.saveRecording(uploadData);
      
      if (!response.success) {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading recording:', error);
    }
  }, [sessionId, session]);

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast.error('Please provide an answer before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const response = await interviewAPI.submitAnswer({
        session_id: sessionId,
        answer: currentAnswer
      });
      
      setSession(prev => ({
        ...prev,
        answers: [...prev.answers, currentAnswer],
        feedback: [...prev.feedback, response.evaluation],
        current_question: response.current_question,
        completed: response.completed
      }));

      setCurrentAnswer('');
      
      const score = response.evaluation?.score || 'N/A';
      toast.success(`Answer submitted! Score: ${score}/10`, {
        icon: score >= 8 ? '🎉' : score >= 6 ? '👍' : '💪'
      });

      const recordingData = enhancedLiveSpeechRef.current?.getLastRecordingData();
      if (recordingData) {
        await uploadRecording(recordingData);
        enhancedLiveSpeechRef.current?.clearRecording();
      }
      
      if (response.completed) {
        toast.success('Interview completed! Redirecting to results...');
        await completeInterviewAndNavigate();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error(error.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  // Stable timer callback using useCallback with no changing dependencies
  const handleTimeUp = useCallback(async () => {
    setTimerActive(false);
    toast.error('Time\'s up! Auto-submitting your current answer...');
    
    try {
      const answerToSubmit = currentAnswer.trim() || "No answer provided - time expired";
      
      const response = await interviewAPI.submitAnswer({
        session_id: sessionId,
        answer: answerToSubmit
      });
      
      setSession(prev => ({
        ...prev,
        answers: [...prev.answers, answerToSubmit],
        feedback: [...prev.feedback, response.evaluation],
        current_question: response.current_question,
        completed: true
      }));
      
      setCurrentAnswer('');
      
      const recordingData = enhancedLiveSpeechRef.current?.getLastRecordingData();
      if (recordingData) {
        await uploadRecording(recordingData);
        enhancedLiveSpeechRef.current?.clearRecording();
      }

      toast.success('Interview completed due to time limit. Redirecting to results...');
      await completeInterviewAndNavigate(3000);
      
    } catch (error) {
      console.error('Error auto-submitting on timeout:', error);
      toast.error('Failed to auto-submit. Please submit manually.');
    }
  }, [sessionId]); // Only sessionId as dependency

  const handleTranscriptionUpdate = (text) => {
    setCurrentAnswer(text);
  };

  const handleRecordingComplete = () => {
    // Recording data is handled by the recording component
  };

  const currentQuestion = session?.questions[session?.current_question];
  const progress = session ? ((session.current_question / session.total_questions) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-cyan-400 to-purple-500"></div>
          <div className="absolute inset-2 animate-spin rounded-full h-12 w-12 border-4 border-transparent bg-gradient-to-r from-purple-500 to-cyan-400" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          <div className="absolute inset-4 rounded-full h-8 w-8 bg-gray-900"></div>
        </div>
        <div className="ml-4 text-white text-lg font-medium">Loading interview session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Session Not Found</h2>
          <p className="text-gray-300 mb-6">The interview session could not be loaded.</p>
          <button
            onClick={() => navigate('/interview')} 
            className="bg-gradient-to-r from-purple-500 to-cyan-400 hover:from-purple-600 hover:to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
          >
            Start New Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb bg-gradient-to-r from-cyan-400/20 to-purple-500/20 w-72 h-72 -top-36 -left-36"></div>
        <div className="floating-orb bg-gradient-to-r from-purple-500/20 to-pink-500/20 w-96 h-96 -top-48 -right-48 animation-delay-2000"></div>
        <div className="floating-orb bg-gradient-to-r from-blue-500/20 to-cyan-400/20 w-64 h-64 bottom-0 left-1/4 animation-delay-4000"></div>
      </div>

      {/* Interview Timer */}
      {session && session.time_limit_enabled !== false && timerActive && !session.completed && (
        <InterviewTimer
          durationMinutes={interviewDuration}
          onTimeUp={handleTimeUp}
          isActive={timerActive}
          showWarnings={true}
        />
      )}

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="glass-card animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {session.interviewer_type.replace('_', ' ').charAt(0).toUpperCase() + session.interviewer_type.replace('_', ' ').slice(1)} Interview
                </h1>
                <p className="text-gray-300 flex items-center space-x-4">
                  <span>Question {session.current_question + 1} of {session.total_questions}</span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{interviewDuration} minutes</span>
                  </span>
                </p>
              </div>
              <div className="text-right mt-4 md:mt-0">
                <div className="text-sm text-gray-400 mb-1">Progress</div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-purple-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-white">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="glass-card animate-fade-in-up animation-delay-200">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-xl flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold text-white mb-3">Interview Question</h3>
                <p className="text-gray-200 text-lg leading-relaxed">
                  {currentQuestion}
                </p>
              </div>
            </div>
          </div>

          {/* Answer Section */}
          <div className="glass-card animate-fade-in-up animation-delay-400">
            <div className="flex items-center space-x-3 mb-6">
              <MessageCircle className="h-6 w-6 text-cyan-400" />
              <h3 className="text-xl font-semibold text-white">Your Answer</h3>
            </div>
            
            <div className="space-y-4">
              <textarea
                ref={answerRef}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full h-40 bg-gray-800/50 border border-gray-600/50 rounded-xl p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent resize-none"
              />
              
              {/* Voice Recording Component */}
              <EnhancedLiveSpeech
                ref={enhancedLiveSpeechRef}
                onTranscriptionUpdate={handleTranscriptionUpdate}
                onRecordingComplete={handleRecordingComplete}
                sessionId={sessionId}
                questionIndex={session.current_question}
              />
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  {currentAnswer.length} characters
                </div>
                <button
                  onClick={submitAnswer}
                  disabled={submitting || !currentAnswer.trim()}
                  className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-500 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 group-hover:animate-pulse" />
                      <span>Submit Answer</span>
                      <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;
