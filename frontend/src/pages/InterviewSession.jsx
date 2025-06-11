import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Send, ArrowRight, Clock, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { interviewAPI } from '../services/api';

const InterviewSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const answerRef = useRef(null);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const fetchSession = async () => {
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
      });
      
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
    }
  };

  const toggleRecording = () => {
    // Voice recording functionality would go here
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.success('Recording started (simulated)');
    } else {
      toast.success('Recording stopped (simulated)');
    }
  };

  const currentQuestion = session?.questions[session?.current_question];
  const progress = session ? ((session.current_question / session.total_questions) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Session Not Found</h2>
        <p className="text-gray-600">The interview session could not be found.</p>
        <button onClick={() => navigate('/interview')} className="btn-primary">
          Start New Interview
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Interview Session
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Question {session.current_question + 1} of {session.total_questions}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span className="capitalize">{session.interviewer_type.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Current Question */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Question:</h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <p className="text-lg text-gray-800">{currentQuestion}</p>
        </div>
      </div>

      {/* Answer Input */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Answer:</h3>
        <div className="space-y-4">
          <textarea
            ref={answerRef}
            className="textarea-field h-40"
            placeholder="Type your answer here... Be specific and provide examples where possible."
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            disabled={submitting}
          />
          
          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">              <button
                onClick={toggleRecording}
                className={`btn-secondary flex items-center space-x-2 ${
                  isRecording 
                    ? '!bg-red-100 !text-red-700 hover:!bg-red-200' 
                    : ''
                }`}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                <span>{isRecording ? 'Stop Recording' : 'Voice Input'}</span>
              </button>
              <span className="text-sm text-gray-500">
                {currentAnswer.length} characters
              </span>
            </div>
            
            <button
              onClick={submitAnswer}
              disabled={submitting || !currentAnswer.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Answer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Previous Q&A (if any) */}
      {session.answers.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Questions & Answers:</h3>
          <div className="space-y-6">
            {session.questions.slice(0, session.current_question).map((question, index) => (
              <div key={index} className="border-l-4 border-primary-200 pl-4 space-y-2">
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">Q{index + 1}: {question}</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">
                    A: {session.answers[index]}
                  </p>                  {session.feedback[index] && (
                    <div className="space-y-3">
                      {/* Score */}
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          session.feedback[index].score >= 8 ? 'bg-green-100 text-green-800' :
                          session.feedback[index].score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          Score: {session.feedback[index].score}/10
                        </span>
                      </div>

                      {/* Feedback */}
                      {session.feedback[index].feedback && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-blue-800 text-sm leading-relaxed">
                            {session.feedback[index].feedback}
                          </p>
                        </div>
                      )}

                      {/* Strengths */}
                      {session.feedback[index].strengths?.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                            Strengths
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {session.feedback[index].strengths.map((strength, i) => (
                              <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                ✓ {strength}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Improvements */}
                      {session.feedback[index].improvements?.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                            Areas for Improvement
                          </h5>
                          <div className="space-y-1">
                            {session.feedback[index].improvements.slice(0, 3).map((improvement, i) => (
                              <div key={i} className="flex items-start space-x-2">
                                <span className="text-yellow-500 text-xs mt-1">💡</span>
                                <span className="text-yellow-800 text-xs leading-relaxed">
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
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Tips for Better Answers:</h3>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li>• Use the STAR method (Situation, Task, Action, Result) for behavioral questions</li>
          <li>• Provide specific examples from your experience</li>
          <li>• Be concise but comprehensive in your answers</li>
          <li>• Take your time to think before responding</li>
        </ul>
      </div>
    </div>
  );
};

export default InterviewSession;
