import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Calendar,
  TrendingUp,
  Users,
  Brain,
  Target,
  Eye,
  Trash2,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { interviewAPI } from '../services/api';

const Dashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_sessions: 0,
    average_score: 0,
    completed_sessions: 0,
    interviewer_breakdown: {}
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await interviewAPI.listSessions();
      setSessions(response.sessions || []);
      calculateStats(response.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error(error.message || 'Failed to load interview sessions');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (sessionsData) => {
    const completed = sessionsData.filter(s => s.completed);
    const total = sessionsData.length;
    
    // Calculate interviewer breakdown
    const breakdown = {};
    sessionsData.forEach(session => {
      const type = session.interviewer_type;
      breakdown[type] = (breakdown[type] || 0) + 1;
    });

    setStats({
      total_sessions: total,
      completed_sessions: completed.length,
      average_score: completed.length > 0 ? 
        completed.reduce((sum, s) => sum + (s.average_score || 0), 0) / completed.length : 0,
      interviewer_breakdown: breakdown
    });
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this interview session?')) {
      return;
    }

    try {
      await interviewAPI.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      toast.success('Interview session deleted successfully');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error(error.message || 'Failed to delete session');
    }
  };

  const getInterviewerIcon = (type) => {
    switch (type) {
      case 'hr': return <Users className="h-5 w-5 text-blue-600" />;
      case 'tech_lead': return <Brain className="h-5 w-5 text-green-600" />;
      case 'behavioral': return <Target className="h-5 w-5 text-purple-600" />;
      default: return <Users className="h-5 w-5 text-gray-600" />;
    }
  };

  const getInterviewerColor = (type) => {
    switch (type) {
      case 'hr': return 'bg-blue-100 text-blue-800';
      case 'tech_lead': return 'bg-green-100 text-green-800';
      case 'behavioral': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your interview practice progress</p>
        </div>
        <Link to="/interview" className="btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Interview</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-primary-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_sessions}</p>
              <p className="text-sm text-gray-600">Total Sessions</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.average_score.toFixed(1)}/10
              </p>
              <p className="text-sm text-gray-600">Average Score</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed_sessions}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(stats.interviewer_breakdown).length}
              </p>
              <p className="text-sm text-gray-600">Interviewer Types</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interviewer Breakdown */}
      {Object.keys(stats.interviewer_breakdown).length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Types Practiced</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(stats.interviewer_breakdown).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getInterviewerIcon(type)}
                  <span className="font-medium text-gray-900 capitalize">
                    {type.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-gray-600">{count} sessions</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Interview Sessions</h2>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">No interviews yet</h3>
              <p className="text-gray-600">Start your first practice interview to see results here</p>
            </div>
            <Link to="/interview" className="btn-primary">
              Start First Interview
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Interviewer Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Questions</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.session_id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        {getInterviewerIcon(session.interviewer_type)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getInterviewerColor(session.interviewer_type)
                        }`}>
                          {session.interviewer_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(session.created_at)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {session.answered_questions}/{session.total_questions}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.completed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {session.completed ? (
                          <Link
                            to={`/results/${session.session_id}`}
                            className="text-primary-600 hover:text-primary-700 p-1"
                            title="View Results"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        ) : (
                          <Link
                            to={`/interview/${session.session_id}`}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="Continue Interview"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => deleteSession(session.session_id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Delete Session"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Pro Tips for Better Interviews</h3>
        <div className="grid md:grid-cols-2 gap-4 text-blue-800">
          <div className="space-y-2">
            <h4 className="font-medium">For Technical Interviews:</h4>
            <ul className="text-sm space-y-1">
              <li>• Practice coding problems regularly</li>
              <li>• Explain your thought process clearly</li>
              <li>• Discuss trade-offs and alternatives</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">For Behavioral Interviews:</h4>
            <ul className="text-sm space-y-1">
              <li>• Use the STAR method consistently</li>
              <li>• Prepare specific examples beforehand</li>
              <li>• Focus on your impact and results</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
