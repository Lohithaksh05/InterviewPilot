import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { 
  BarChart3, TrendingUp, TrendingDown, Target, Clock, 
  Trophy, Brain, Zap, Calendar, Award, Users 
} from 'lucide-react';
import toast from 'react-hot-toast';

const PerformanceAnalytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [categoryAnalysis, setCategoryAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        
        // Load all analytics data
        const [metricsResponse, progressResponse, categoryResponse] = await Promise.all([
          analyticsAPI.getMyPerformance(selectedPeriod),
          analyticsAPI.getMyWeeklyProgress(12),
          analyticsAPI.getMyCategoryAnalysis()
        ]);

        setMetrics(metricsResponse.metrics);
        setWeeklyProgress(progressResponse.weekly_progress || []);
        setCategoryAnalysis(categoryResponse.category_analysis || []);
        
      } catch (error) {
        console.error('Error loading analytics:', error);
        toast.error('Failed to load performance analytics');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
        <span className="ml-3 text-gray-300">Loading analytics...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">No analytics data available</p>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-500/20';
    if (score >= 60) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Performance Analytics</h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-400"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sessions */}
        <div className="glass-morphism-dark rounded-xl p-6 border border-gray-700">          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Sessions</p>
              <p className="text-2xl font-bold text-white">{metrics?.total_sessions || 0}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-blue-400 text-sm">
              {metrics?.completed_sessions || 0} completed ({(metrics?.completion_rate || 0).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Average Score */}
        <div className="glass-morphism-dark rounded-xl p-6 border border-gray-700">          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Average Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(metrics?.average_score || 0)}`}>
                {(metrics?.average_score || 0).toFixed(1)}%
              </p>
            </div>
            <div className={`p-3 rounded-lg ${getScoreBgColor(metrics?.average_score || 0)}`}>
              <Target className="h-6 w-6 text-primary-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-gray-400 text-sm">
              Best: {(metrics?.highest_score || 0).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Practice Streak */}
        <div className="glass-morphism-dark rounded-xl p-6 border border-gray-700">          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Practice Streak</p>
              <p className="text-2xl font-bold text-orange-400">{metrics?.practice_streak || 0}</p>
            </div>
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Zap className="h-6 w-6 text-orange-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-orange-400 text-sm">
              {(metrics?.practice_streak || 0) > 0 ? 'Keep it up!' : 'Start your streak'}
            </span>
          </div>
        </div>

        {/* Practice Time */}
        <div className="glass-morphism-dark rounded-xl p-6 border border-gray-700">          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Practice Time</p>
              <p className="text-2xl font-bold text-purple-400">
                {Math.floor((metrics?.total_practice_time || 0) / 60)}h {(metrics?.total_practice_time || 0) % 60}m
              </p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Clock className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-purple-400 text-sm">
              Avg: {(metrics?.average_session_duration || 0).toFixed(1)} min/session
            </span>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      {weeklyProgress.length > 0 && (
        <div className="glass-morphism-dark rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary-400" />
            Weekly Progress
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Trend */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Score Trend</h4>
              <div className="space-y-2">
                {weeklyProgress.slice(-6).map((week, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Week {new Date(week.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-400 rounded-full transition-all duration-300"
                          style={{ width: `${week.average_score}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${getScoreColor(week.average_score)}`}>
                        {week.average_score.toFixed(1)}%
                      </span>
                      {week.improvement > 0 && (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      )}
                      {week.improvement < 0 && (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Activity */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Session Activity</h4>
              <div className="space-y-2">
                {weeklyProgress.slice(-6).map((week, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Week {new Date(week.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {Array.from({ length: 7 }).map((_, dayIndex) => (
                          <div
                            key={dayIndex}
                            className={`w-3 h-3 rounded-sm ${
                              dayIndex < week.sessions_count ? 'bg-primary-400' : 'bg-gray-700'
                            }`}
                          ></div>
                        ))}
                      </div>
                      <span className="text-sm text-white font-medium">
                        {week.sessions_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}      {/* Interviewer Performance */}
      {metrics?.interviewer_breakdown && Object.keys(metrics.interviewer_breakdown).length > 0 && (
        <div className="glass-morphism-dark rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-primary-400" />
            Performance by Interviewer Type
          </h3>          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(metrics?.interviewer_breakdown || {}).map(([type, data]) => (
              <div key={type} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-300 capitalize">
                    {type.replace('_', ' ')}
                  </h4>
                  <Brain className="h-4 w-4 text-gray-400" />
                </div>
                <p className={`text-xl font-bold ${getScoreColor(data.avg_score)}`}>
                  {data.avg_score.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400">{data.count} sessions</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Analysis */}
      {categoryAnalysis.length > 0 && (
        <div className="glass-morphism-dark rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-primary-400" />
            Category Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryAnalysis.map((category) => (
              <div key={category.category} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-300 capitalize">
                    {category.category}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    category.improvement_trend === 'improving' ? 'bg-green-500/20 text-green-400' :
                    category.improvement_trend === 'declining' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {category.improvement_trend}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Accuracy</span>
                    <span className={getScoreColor(category.accuracy_rate)}>
                      {category.accuracy_rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-400 rounded-full transition-all duration-300"
                      style={{ width: `${category.accuracy_rate}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{category.correct_answers}/{category.total_questions} correct</span>
                    <span>{category.time_to_answer.toFixed(1)}s avg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {metrics?.achievements_unlocked && metrics.achievements_unlocked.length > 0 && (
        <div className="glass-morphism-dark rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
            Recent Achievements
          </h3>          <div className="flex flex-wrap gap-3">
            {(metrics?.achievements_unlocked || []).map((achievement, index) => (
              <div
                key={achievement.name || index}
                className="flex items-center space-x-2 bg-yellow-500/20 text-yellow-300 px-3 py-2 rounded-lg"
              >
                <Award className="h-4 w-4" />
                <span className="text-sm font-medium capitalize">
                  {typeof achievement === 'string' ? achievement.replace('_', ' ') : achievement.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}      {/* Improvement Areas */}
      {metrics?.weak_categories && metrics.weak_categories.length > 0 && (
        <div className="glass-morphism-dark rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Areas for Improvement</h3>
          <div className="space-y-3">
            {(metrics?.weak_categories || []).slice(0, 3).map((area, index) => (
              <div key={area.name || area.category || index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 capitalize">{area.name || area.category}</h4>
                  <p className="text-xs text-gray-400">{area.improvement || "Focus on this area to improve overall performance"}</p>
                </div>
                <span className="text-red-400 font-medium">{(area.score || area.avg_score || 0).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalytics;
