import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowRight, Clock, MessageCircle, Mic, MicOff, Brain, Sparkles, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { interviewAPI } from '../services/api';
import EnhancedLiveSpeech from '../components/EnhancedLiveSpeechSimple';

const InterviewSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loading, setLoading] = useState(false);  const [submitting, setSubmitting] = useState(false);
  const answerRef = useRef(null);
  const enhancedLiveSpeechRef = useRef(null);
  useEffect(() => {
    const fetchSessionData = async () => {
      setLoading(true);
      try {
        const response = await interviewAPI.getSession(sessionId);
        setSession(response);
        
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
        // Show score in toast
      const score = response.evaluation?.score || 'N/A';
      toast.success(`Answer submitted! Score: ${score}/10`, {
        icon: score >= 8 ? '🎉' : score >= 6 ? '👍' : '💪'
      });      // Upload recording if there's one from this session
      // Get recording data directly from the component via ref
      const recordingData = enhancedLiveSpeechRef.current?.getLastRecordingData();
      if (recordingData) {
        await uploadRecording(recordingData);
        // Clear the recording UI after successful upload
        enhancedLiveSpeechRef.current?.clearRecording();
      }
      
      if (response.completed) {
        toast.success('Interview completed! Redirecting to results...');
        setTimeout(() => {
          navigate(`/results/${sessionId}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error(error.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }  };
  // Handle enhanced live speech transcription
  const handleTranscriptionUpdate = (text) => {    setCurrentAnswer(text);
  };
    // Handle recording completion (store locally, upload when submitting)
  const handleRecordingComplete = () => {
    // Recording data is handled by the recording component
  };

  // Convert audio blob to base64
  const convertBlobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:audio/webm;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  // Upload recording to database
  const uploadRecording = async (recordingData) => {
    if (!recordingData || !recordingData.audioBlob) {
      return; // No recording to upload
    }    try {
      // Convert blob to base64
      const base64Audio = await convertBlobToBase64(recordingData.audioBlob);
      
      const uploadData = {
        session_id: sessionId,
        question_index: session.current_question,
        audio_data: base64Audio,
        duration: Number(recordingData.duration) || 0, // Ensure it's a number
        transcript: recordingData.transcript || '',        file_size: Number(recordingData.audioBlob.size) || 0, // Ensure it's a number
        mime_type: recordingData.audioBlob.type || 'audio/webm'
      };

      const response = await interviewAPI.saveRecording(uploadData);
      
      if (!response.success) {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading recording:', error);
      // Recording upload errors are not critical for the interview flow
    }
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
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-6 glass-card p-8 max-w-md">
          <div className="relative">
            <Brain className="h-16 w-16 text-gray-400 mx-auto animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full blur-xl"></div>
          </div>
          <h2 className="text-2xl font-bold text-white">Session Not Found</h2>
          <p className="text-gray-300">The interview session could not be found.</p>
          <button 
            onClick={() => navigate('/interview')} 
            className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 flex items-center space-x-2 mx-auto"
          >
            <Sparkles className="h-5 w-5 group-hover:animate-spin transition-transform duration-300" />
            <span>Start New Interview</span>
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

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="glass-card animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x mb-4 md:mb-0">
                Live Interview Session
              </h1>
              <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-gray-300">
                <div className="flex items-center space-x-2 glass-pill px-4 py-2">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span className="font-medium">Question {session.current_question + 1} of {session.total_questions}</span>
                </div>
                <div className="flex items-center space-x-2 glass-pill px-4 py-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  <span className="font-medium capitalize">{session.interviewer_type.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative">
              <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 h-3 rounded-full transition-all duration-500 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
              <div className="absolute right-0 top-4 text-xs text-gray-400 font-medium">
                {Math.round(progress)}% Complete
              </div>
            </div>
          </div>          {/* Current Question */}
          <div className="glass-card animate-fade-in-up animation-delay-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <MessageCircle className="h-6 w-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Current Question</h2>
            </div>
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-2xl p-8 border border-gray-600/30">
              <p className="text-xl text-gray-100 leading-relaxed font-medium">{currentQuestion}</p>
            </div>
          </div>          {/* Answer Input */}
          <div className="glass-card animate-fade-in-up animation-delay-400">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <Mic className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Your Answer</h3>
            </div>
            <div className="space-y-6">
              <div className="relative">
                <textarea
                  ref={answerRef}                  className="w-full h-48 px-6 py-4 bg-gradient-to-br from-slate-900/90 via-gray-900/80 to-slate-800/90 border border-cyan-500/20 rounded-2xl text-white placeholder-cyan-200/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/60 transition-all duration-300 resize-none hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10 backdrop-blur-md"
                  placeholder="Type your answer here... Be specific and provide examples where possible."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  disabled={submitting}
                />
                <div className="absolute bottom-4 right-4 text-xs text-gray-400 font-medium">
                  {currentAnswer.length} characters
                </div>
              </div>
              
              {/* Enhanced Live Speech - Transcription + Recording */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <label className="text-lg font-semibold text-white">
                    Live Speech (Real-time Transcription + Recording)
                  </label>
                </div>
                <EnhancedLiveSpeech
                  ref={enhancedLiveSpeechRef}
                  onTranscriptionUpdate={handleTranscriptionUpdate}
                  onRecordingComplete={handleRecordingComplete}
                  disabled={submitting}
                  sessionId={sessionId}
                  questionIndex={session?.current_question}
                  className="bg-gradient-to-br from-gray-800/30 to-gray-700/30 p-6 rounded-2xl border border-gray-600/20"
                />
                <p className="text-sm text-gray-400 flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span>Start speaking to see real-time transcription AND automatically record your speech for playback later.</span>
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4">
                <div className="text-sm text-gray-400">
                  Take your time to craft a thoughtful response
                </div>
                <button
                  onClick={submitAnswer}
                  disabled={submitting || !currentAnswer.trim()}
                  className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-3"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      <span>Submit Answer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>          {/* Previous Q&A (if any) */}
          {session.answers.length > 0 && (
            <div className="glass-card animate-fade-in-up animation-delay-600">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <MessageCircle className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Previous Questions & Answers</h3>
              </div>
              <div className="space-y-8">
                {session.questions.slice(0, session.current_question).map((question, index) => (
                  <div key={index} className="border-l-4 border-gradient-to-b from-cyan-500 to-purple-500 pl-6 space-y-4 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="space-y-4">
                      <p className="font-bold text-white text-lg">Q{index + 1}: {question}</p>
                      <div className="bg-gradient-to-br from-gray-800/30 to-gray-700/30 p-4 rounded-2xl border border-gray-600/20">
                        <p className="text-gray-300 leading-relaxed">
                          A: {session.answers[index]}
                        </p>
                      </div>
                      {session.feedback[index] && (
                        <div className="space-y-4">
                          {/* Score */}
                          <div className="flex items-center space-x-3">
                            <span className={`px-4 py-2 rounded-full text-sm font-bold border ${
                              session.feedback[index].score >= 8 ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                              session.feedback[index].score >= 6 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                              'bg-red-500/20 text-red-300 border-red-500/30'
                            }`}>
                              Score: {session.feedback[index].score}/10
                            </span>
                          </div>

                          {/* Feedback */}
                          {session.feedback[index].feedback && (
                            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 rounded-2xl border border-blue-500/20">
                              <p className="text-blue-300 leading-relaxed">
                                {session.feedback[index].feedback}
                              </p>
                            </div>
                          )}

                          {/* Strengths */}
                          {session.feedback[index].strengths?.length > 0 && (
                            <div className="space-y-3">
                              <h5 className="text-sm font-bold text-green-400 uppercase tracking-wide flex items-center space-x-2">
                                <Sparkles className="h-4 w-4" />
                                <span>Strengths</span>
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {session.feedback[index].strengths.map((strength, i) => (
                                  <span key={i} className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm border border-green-500/30">
                                    ✓ {strength}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Improvements */}
                          {session.feedback[index].improvements?.length > 0 && (
                            <div className="space-y-3">
                              <h5 className="text-sm font-bold text-yellow-400 uppercase tracking-wide flex items-center space-x-2">
                                <Zap className="h-4 w-4" />
                                <span>Areas for Improvement</span>
                              </h5>
                              <div className="space-y-2">
                                {session.feedback[index].improvements.slice(0, 3).map((improvement, i) => (
                                  <div key={i} className="flex items-start space-x-3">
                                    <span className="text-yellow-400 text-sm mt-1">💡</span>
                                    <span className="text-yellow-300 text-sm leading-relaxed">
                                      {improvement}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="glass-card bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 animate-fade-in-up animation-delay-800">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-400/20">
                <Brain className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Pro Tips for Better Answers
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="text-blue-300 space-y-3">
                <li className="flex items-start space-x-3">
                  <Sparkles className="h-4 w-4 text-cyan-400 mt-1 flex-shrink-0" />
                  <span>Use the STAR method (Situation, Task, Action, Result) for behavioral questions</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Sparkles className="h-4 w-4 text-cyan-400 mt-1 flex-shrink-0" />
                  <span>Provide specific examples from your experience</span>
                </li>
              </ul>
              <ul className="text-blue-300 space-y-3">
                <li className="flex items-start space-x-3">
                  <Sparkles className="h-4 w-4 text-cyan-400 mt-1 flex-shrink-0" />
                  <span>Be concise but comprehensive in your answers</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Sparkles className="h-4 w-4 text-cyan-400 mt-1 flex-shrink-0" />
                  <span>Take your time to think before responding</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;
