import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Download,
  Star,
  Target,
  Lightbulb
} from 'lucide-react';
import toast from 'react-hot-toast';
import { interviewAPI } from '../services/api';

const Results = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchSummary();
    }
  }, [sessionId]);

  const fetchSummary = async () => {
    try {
      const response = await interviewAPI.getSummary(sessionId);
      setSummary(response);
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast.error(error.message || 'Failed to load interview results');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const downloadReport = () => {
    // Create a simple text report
    const report = `
Interview Results - InterviewPilot
=====================================

Session ID: ${sessionId}
Interviewer Type: ${summary?.interviewer_type}
Date: ${new Date().toLocaleDateString()}

Overall Score: ${summary?.average_score}/10

Questions & Answers:
${summary?.qa_pairs?.map((qa, index) => `
Question ${index + 1}: ${qa.question}
Answer: ${qa.answer}
Score: ${qa.feedback?.score || 'N/A'}/10
Feedback: ${qa.feedback?.feedback || 'N/A'}
`).join('\n')}

Overall Summary:
${summary?.overall_summary?.summary || 'N/A'}

Key Strengths:
${summary?.overall_summary?.key_strengths?.map(s => `• ${s}`).join('\n') || 'N/A'}

Areas for Improvement:
${summary?.overall_summary?.areas_for_improvement?.map(s => `• ${s}`).join('\n') || 'N/A'}

Recommendation: ${summary?.overall_summary?.recommendation || 'N/A'}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${sessionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Report downloaded successfully!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Results Not Found</h2>
        <p className="text-gray-600">The interview results could not be found.</p>
        <Link to="/dashboard" className="btn-primary">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interview Results</h1>
          <p className="text-gray-600 mt-1">
            {summary.interviewer_type.replace('_', ' ').toUpperCase()} Interview • {summary.answered_questions} questions answered
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={downloadReport}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download Report</span>
          </button>
          <Link to="/interview" className="btn-primary">
            New Interview
          </Link>
        </div>
      </div>

      {/* Overall Score */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className={`card text-center ${getScoreBackground(summary.average_score)}`}>
          <div className="space-y-2">
            <div className={`text-4xl font-bold ${getScoreColor(summary.average_score)}`}>
              {summary.average_score}/10
            </div>
            <p className="text-lg font-semibold text-gray-900">Overall Score</p>
            <div className="flex justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(summary.average_score / 2)
                      ? 'text-yellow-500 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3">
            <Target className="h-8 w-8 text-primary-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary.answered_questions}</p>
              <p className="text-sm text-gray-600">Questions Answered</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {summary.overall_summary?.recommendation?.includes('hire') ? 'Positive' : 'Needs Work'}
              </p>
              <p className="text-sm text-gray-600">Recommendation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Summary */}
      {summary.overall_summary && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Interview Summary</span>
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {summary.overall_summary.summary}
          </p>
        </div>
      )}

      {/* Strengths and Improvements */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="card">
          <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Key Strengths</span>
          </h3>
          {summary.overall_summary?.key_strengths?.length > 0 ? (
            <ul className="space-y-2">
              {summary.overall_summary.key_strengths.map((strength, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No specific strengths identified.</p>
          )}
        </div>

        {/* Areas for Improvement */}
        <div className="card">
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-red-600" />
            <span>Areas for Improvement</span>
          </h3>
          {summary.overall_summary?.areas_for_improvement?.length > 0 ? (
            <ul className="space-y-2">
              {summary.overall_summary.areas_for_improvement.map((improvement, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{improvement}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Great job! No major areas for improvement identified.</p>
          )}
        </div>
      </div>

      {/* Detailed Q&A Review */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Question-by-Question Review</span>
        </h2>
        <div className="space-y-6">
          {summary.qa_pairs?.map((qa, index) => (
            <div key={index} className="border-l-4 border-primary-200 pl-6 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-900">Question {index + 1}</h3>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  getScoreBackground(qa.feedback?.score || 0)
                } ${getScoreColor(qa.feedback?.score || 0)}`}>
                  {qa.feedback?.score || 'N/A'}/10
                </span>
              </div>
              
              <div className="space-y-2">
                <p className="text-gray-800 font-medium">{qa.question}</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{qa.answer}</p>
                </div>
                
                {qa.feedback?.feedback && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-800 text-sm">{qa.feedback.feedback}</p>
                  </div>
                )}

                {qa.feedback?.strengths?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {qa.feedback.strengths.map((strength, i) => (
                      <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        ✓ {strength}
                      </span>
                    ))}
                  </div>
                )}

                {qa.feedback?.improvements?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {qa.feedback.improvements.map((improvement, i) => (
                      <span key={i} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                        💡 {improvement}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      {summary.overall_summary?.next_steps?.length > 0 && (
        <div className="card bg-primary-50 border-primary-200">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">🎯 Recommended Next Steps</h3>
          <ul className="space-y-2">
            {summary.overall_summary.next_steps.map((step, index) => (
              <li key={index} className="flex items-start space-x-2">
                <ArrowLeft className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0 rotate-180" />
                <span className="text-primary-800">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Link to="/dashboard" className="btn-secondary">
          View All Sessions
        </Link>
        <Link to="/interview" className="btn-primary">
          Start New Interview
        </Link>
      </div>
    </div>
  );
};

export default Results;
