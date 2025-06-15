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
  Plus,
  Sparkles,
  Zap,
  Trophy,
  Play
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
    const loadSessions = async () => {
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
    
    loadSessions();
  }, []);
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
      case 'hr': return <Users className="h-5 w-5 text-cyan-400" />;
      case 'tech_lead': return <Brain className="h-5 w-5 text-green-400" />;
      case 'behavioral': return <Target className="h-5 w-5 text-purple-400" />;
      default: return <Users className="h-5 w-5 text-gray-400" />;
    }
  };

  const getInterviewerColor = (type) => {
    switch (type) {
      case 'hr': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'tech_lead': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'behavioral': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  };if (loading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb bg-gradient-to-r from-cyan-400/20 to-purple-500/20 w-72 h-72 -top-36 -left-36"></div>
        <div className="floating-orb bg-gradient-to-r from-purple-500/20 to-pink-500/20 w-96 h-96 -top-48 -right-48 animation-delay-2000"></div>
        <div className="floating-orb bg-gradient-to-r from-blue-500/20 to-cyan-400/20 w-64 h-64 bottom-0 left-1/4 animation-delay-4000"></div>
        <div className="floating-orb bg-gradient-to-r from-pink-500/20 to-purple-500/20 w-80 h-80 bottom-0 right-0 animation-delay-6000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in-up">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
              Dashboard
            </h1>
            <p className="text-gray-300 text-lg font-medium">Track your interview practice progress</p>
          </div>
          <Link 
            to="/interview" 
            className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 flex items-center space-x-3"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90 duration-300" />
            <span>New Interview</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 animate-fade-in-up animation-delay-200">
          <div className="glass-card hover:scale-105 transform transition-all duration-500 group">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 group-hover:from-cyan-400/30 group-hover:to-blue-400/30 transition-all duration-300">
                <BarChart3 className="h-8 w-8 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white animate-counter">{stats.total_sessions}</p>
                <p className="text-sm text-gray-300 font-medium">Total Sessions</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          </div>
          
          <div className="glass-card hover:scale-105 transform transition-all duration-500 group animation-delay-100">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover:from-green-400/30 group-hover:to-emerald-400/30 transition-all duration-300">
                <TrendingUp className="h-8 w-8 text-green-400 group-hover:text-green-300 transition-colors duration-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white animate-counter">
                  {stats.average_score.toFixed(1)}/10
                </p>
                <p className="text-sm text-gray-300 font-medium">Average Score</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          </div>
          
          <div className="glass-card hover:scale-105 transform transition-all duration-500 group animation-delay-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:from-purple-400/30 group-hover:to-pink-400/30 transition-all duration-300">
                <Calendar className="h-8 w-8 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white animate-counter">{stats.completed_sessions}</p>
                <p className="text-sm text-gray-300 font-medium">Completed</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          </div>
          
          <div className="glass-card hover:scale-105 transform transition-all duration-500 group animation-delay-300">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 group-hover:from-orange-400/30 group-hover:to-red-400/30 transition-all duration-300">
                <Users className="h-8 w-8 text-orange-400 group-hover:text-orange-300 transition-colors duration-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white animate-counter">
                  {Object.keys(stats.interviewer_breakdown).length}
                </p>
                <p className="text-sm text-gray-300 font-medium">Interviewer Types</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          </div>
        </div>        {/* Interviewer Breakdown */}
        {Object.keys(stats.interviewer_breakdown).length > 0 && (
          <div className="glass-card animate-fade-in-up animation-delay-400">
            <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Interview Types Practiced
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {Object.entries(stats.interviewer_breakdown).map(([type, count], index) => (
                <div key={type} className={`flex items-center justify-between p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300 hover:scale-105 group animate-fade-in-up`} style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-gray-700/50 to-gray-600/50 group-hover:from-gray-600/50 group-hover:to-gray-500/50 transition-all duration-300">
                      {getInterviewerIcon(type)}
                    </div>
                    <span className="font-semibold text-white capitalize text-lg">
                      {type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">{count}</span>
                    <p className="text-sm text-gray-300">sessions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}      {/* Recent Sessions */}
      <div className="glass-card animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <BarChart3 className="h-7 w-7 mr-3 text-cyan-400 animate-pulse" />
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Recent Interview Sessions
            </span>
          </h2>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-16 space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mx-auto animate-levitate">
              <BarChart3 className="h-10 w-10 text-cyan-400" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">No interviews yet</h3>
              <p className="text-gray-300 max-w-md mx-auto leading-relaxed">
                Start your first practice interview to see results here and track your progress
              </p>
            </div>
            <Link 
              to="/interview" 
              className="glass-button group bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-400/30 hover:to-purple-400/30 inline-flex items-center"
            >
              <Play className="h-5 w-5 mr-2 group-hover:animate-bounce" />
              Start First Interview
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800/50 to-gray-800/50 border-b border-white/10">
                  <th className="text-left py-4 px-6 font-semibold text-cyan-300">Interviewer Type</th>
                  <th className="text-left py-4 px-6 font-semibold text-cyan-300">Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-cyan-300">Questions</th>
                  <th className="text-left py-4 px-6 font-semibold text-cyan-300">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-cyan-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sessions.map((session, index) => (
                  <tr 
                    key={session.session_id} 
                    className="hover:bg-white/5 transition-all duration-300 group animate-fadeInUp"
                    style={{ animationDelay: `${0.9 + index * 0.1}s` }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="group-hover:scale-110 transition-transform duration-200">
                          {getInterviewerIcon(session.interviewer_type)}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold transform group-hover:scale-105 transition-all duration-200 ${
                          getInterviewerColor(session.interviewer_type)
                        }`}>
                          {session.interviewer_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-300 font-medium">
                      {formatDate(session.created_at)}
                    </td>
                    <td className="py-4 px-6 text-gray-300 font-medium">
                      <span className="px-2 py-1 rounded-lg bg-white/10 text-white">
                        {session.answered_questions}/{session.total_questions}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold transform group-hover:scale-105 transition-all duration-200 ${
                        session.completed 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'                      }`}>
                        {session.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        {session.completed ? (
                          <Link
                            to={`/results/${session.session_id}`}
                            className="glass-button-sm group bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-400/30 hover:to-teal-400/30"
                            title="View Results"
                          >
                            <Eye className="h-4 w-4 group-hover:animate-pulse" />
                          </Link>
                        ) : (
                          <Link
                            to={`/interview/${session.session_id}`}
                            className="glass-button-sm group bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-400/30 hover:to-indigo-400/30"
                            title="Continue Interview"
                          >
                            <Play className="h-4 w-4 group-hover:animate-bounce" />
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
          </div>        )}
        </div>

        {/* Pro Tips */}
        <div className="glass-card bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 animate-fade-in-up animation-delay-800">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-400/20">
              <Zap className="h-6 w-6 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Pro Tips for Better Interviews
            </h3>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-gray-800/30 to-gray-700/30 border border-gray-600/20 hover:border-gray-500/30 transition-all duration-300 group">
              <div className="flex items-center space-x-3">
                <Brain className="h-6 w-6 text-green-400 group-hover:animate-pulse transition-all duration-300" />
                <h4 className="font-bold text-white text-lg">For Technical Interviews:</h4>
              </div>
              <ul className="text-gray-300 space-y-2">
                <li className="flex items-start space-x-2">
                  <Trophy className="h-4 w-4 text-cyan-400 mt-1 flex-shrink-0" />
                  <span>Practice coding problems regularly</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Trophy className="h-4 w-4 text-cyan-400 mt-1 flex-shrink-0" />
                  <span>Explain your thought process clearly</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Trophy className="h-4 w-4 text-cyan-400 mt-1 flex-shrink-0" />
                  <span>Discuss trade-offs and alternatives</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-gray-800/30 to-gray-700/30 border border-gray-600/20 hover:border-gray-500/30 transition-all duration-300 group">
              <div className="flex items-center space-x-3">
                <Target className="h-6 w-6 text-purple-400 group-hover:animate-pulse transition-all duration-300" />
                <h4 className="font-bold text-white text-lg">For Behavioral Interviews:</h4>
              </div>
              <ul className="text-gray-300 space-y-2">
                <li className="flex items-start space-x-2">
                  <Trophy className="h-4 w-4 text-purple-400 mt-1 flex-shrink-0" />
                  <span>Use the STAR method consistently</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Trophy className="h-4 w-4 text-purple-400 mt-1 flex-shrink-0" />
                  <span>Prepare specific examples beforehand</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Trophy className="h-4 w-4 text-purple-400 mt-1 flex-shrink-0" />
                  <span>Focus on your impact and results</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
