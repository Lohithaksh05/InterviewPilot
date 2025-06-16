import React, { useState, useEffect } from 'react';
import { voiceAPI } from '../services/api';
import { 
  Mic, Volume2, Clock, Zap, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle, BookOpen, Target, BarChart3 
} from 'lucide-react';
import toast from 'react-hot-toast';

const VoiceAnalysis = ({ audioData, transcript, duration, sessionId, questionIndex }) => {
  const [analysis, setAnalysis] = useState(null);
  const [quickAnalysis, setQuickAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCoachingTips, setShowCoachingTips] = useState(false);
  const [coachingTips, setCoachingTips] = useState({});

  useEffect(() => {
    if (transcript && duration > 0) {
      performQuickAnalysis();
    }
  }, [transcript, duration]);

  const performQuickAnalysis = async () => {
    try {
      const response = await voiceAPI.quickAnalyze({
        transcript,
        duration
      });
      setQuickAnalysis(response.quick_analysis);
    } catch (error) {
      console.error('Quick analysis error:', error);
    }
  };

  const performFullAnalysis = async () => {
    if (!audioData) {
      toast.error('No audio data available for analysis');
      return;
    }

    try {
      setLoading(true);
      const response = await voiceAPI.analyzeVoice({
        recording_id: `${sessionId}_${questionIndex}`,
        session_id: sessionId,
        question_index: questionIndex,
        audio_data: audioData,
        transcript,
        duration
      });
      
      setAnalysis(response.analysis);
      toast.success('Voice analysis completed!');
    } catch (error) {
      console.error('Voice analysis error:', error);
      toast.error('Failed to analyze voice recording');
    } finally {
      setLoading(false);
    }
  };

  const loadCoachingTips = async (category = null) => {
    try {
      const response = await voiceAPI.getCoachingTips(category);
      setCoachingTips(response.tips);
      setShowCoachingTips(true);
    } catch (error) {
      console.error('Error loading coaching tips:', error);
      toast.error('Failed to load coaching tips');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const formatFillerWords = (fillerWords) => {
    return fillerWords
      .filter(fw => fw.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Quick Analysis (Always Available) */}
      {quickAnalysis && (
        <div className="glass-morphism-dark rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-400" />
              Quick Voice Insights
            </h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(quickAnalysis.confidence_score)}`}>
              {quickAnalysis.confidence_score.toFixed(0)}% Confidence
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Speaking Rate */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Speaking Rate</span>
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xl font-bold text-white">{quickAnalysis.speaking_rate.toFixed(0)} WPM</p>
              <p className="text-xs text-gray-400">
                {quickAnalysis.speaking_rate < 120 ? 'Too slow' : 
                 quickAnalysis.speaking_rate > 180 ? 'Too fast' : 'Good pace'}
              </p>
            </div>

            {/* Filler Words */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Filler Words</span>
                <Volume2 className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xl font-bold text-white">{quickAnalysis.filler_count}</p>
              <p className="text-xs text-gray-400">
                {quickAnalysis.filler_rate.toFixed(1)} per minute
              </p>
            </div>

            {/* Word Count */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Words Spoken</span>
                <BarChart3 className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xl font-bold text-white">{quickAnalysis.word_count}</p>
              <p className="text-xs text-gray-400">
                {(quickAnalysis.word_count / Math.max(duration, 1) * 60).toFixed(0)} WPM
              </p>
            </div>
          </div>

          {/* Quick Feedback */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Quick Feedback:</h4>
            <div className="flex flex-wrap gap-2">
              {quickAnalysis.feedback.map((feedback, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-sm ${
                    feedback.includes('Good') || feedback.includes('Great') 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}
                >
                  {feedback}
                </span>
              ))}
            </div>
          </div>

          {/* Full Analysis Button */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={performFullAnalysis}
              disabled={loading || !audioData}
              className="w-full bg-primary-500/20 hover:bg-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-primary-300 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-400"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span>Get Detailed Voice Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Detailed Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="glass-morphism-dark rounded-xl p-6 border border-gray-700">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-4">Voice Analysis Results</h3>
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getScoreBgColor(analysis.overall_score)}`}>
                <span className={getScoreColor(analysis.overall_score)}>
                  {analysis.overall_score.toFixed(0)}
                </span>
              </div>
              <p className="text-gray-400 mt-2">Overall Voice Score</p>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="glass-morphism-dark rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Detailed Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Speaking Rate */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Speaking Rate</h4>
                <p className="text-xl font-bold text-white mb-1">
                  {analysis.voice_metrics.speaking_rate.toFixed(0)} WPM
                </p>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-blue-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(analysis.voice_metrics.speaking_rate / 2, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400">Target: 130-170 WPM</p>
              </div>

              {/* Clarity */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Clarity</h4>
                <p className={`text-xl font-bold mb-1 ${getScoreColor(analysis.voice_metrics.clarity_score)}`}>
                  {analysis.voice_metrics.clarity_score.toFixed(0)}%
                </p>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-green-400 rounded-full transition-all duration-300"
                    style={{ width: `${analysis.voice_metrics.clarity_score}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400">Speech clarity score</p>
              </div>

              {/* Confidence */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Confidence</h4>
                <p className={`text-xl font-bold mb-1 ${getScoreColor(analysis.voice_metrics.confidence_score)}`}>
                  {analysis.voice_metrics.confidence_score.toFixed(0)}%
                </p>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-purple-400 rounded-full transition-all duration-300"
                    style={{ width: `${analysis.voice_metrics.confidence_score}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400">Voice confidence level</p>
              </div>

              {/* Pause Frequency */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Pause Frequency</h4>
                <p className="text-xl font-bold text-white mb-1">
                  {analysis.voice_metrics.pause_frequency.toFixed(1)}/min
                </p>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(analysis.voice_metrics.pause_frequency * 10, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400">Pauses per minute</p>
              </div>

              {/* Volume Consistency */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Volume Consistency</h4>
                <p className={`text-xl font-bold mb-1 ${getScoreColor(analysis.voice_metrics.volume_consistency)}`}>
                  {analysis.voice_metrics.volume_consistency.toFixed(0)}%
                </p>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-orange-400 rounded-full transition-all duration-300"
                    style={{ width: `${analysis.voice_metrics.volume_consistency}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400">Volume stability</p>
              </div>

              {/* Energy Level */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Energy Level</h4>
                <p className={`text-xl font-bold mb-1 ${getScoreColor(analysis.voice_metrics.energy_level)}`}>
                  {analysis.voice_metrics.energy_level.toFixed(0)}%
                </p>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-red-400 rounded-full transition-all duration-300"
                    style={{ width: `${analysis.voice_metrics.energy_level}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400">Vocal energy</p>
              </div>
            </div>
          </div>

          {/* Filler Words Analysis */}
          {analysis.filler_words && formatFillerWords(analysis.filler_words).length > 0 && (
            <div className="glass-morphism-dark rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-yellow-400" />
                Filler Words Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Most Used:</h4>
                  <div className="space-y-2">
                    {formatFillerWords(analysis.filler_words).map((filler) => (
                      <div key={filler.word} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                        <span className="text-gray-300">"{filler.word}"</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{filler.count}x</span>
                          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-400 rounded-full"
                              style={{ width: `${(filler.count / Math.max(...analysis.filler_words.map(f => f.count))) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Improvement Tips:</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <p className="text-blue-300 text-sm">• Pause instead of saying filler words</p>
                    </div>
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <p className="text-green-300 text-sm">• Practice with awareness recordings</p>
                    </div>
                    <button
                      onClick={() => loadCoachingTips('filler_reduction')}
                      className="w-full bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 py-2 px-3 rounded-lg text-sm transition-colors"
                    >
                      Get Coaching Tips
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback */}
          <div className="glass-morphism-dark rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Detailed Feedback</h3>
            
            {/* Strengths */}
            {analysis.strengths.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Strengths
                </h4>
                <div className="space-y-2">
                  {analysis.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center p-3 bg-green-500/10 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                      <p className="text-green-300 text-sm">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Areas */}
            {analysis.improvement_areas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-yellow-400 mb-3 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Areas for Improvement
                </h4>
                <div className="space-y-2">
                  {analysis.improvement_areas.map((area, index) => (
                    <div key={index} className="flex items-center p-3 bg-yellow-500/10 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-yellow-400 mr-3 flex-shrink-0" />
                      <p className="text-yellow-300 text-sm">{area}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specific Feedback */}
            {analysis.specific_feedback && (
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Specific Feedback:</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{analysis.specific_feedback}</p>
              </div>
            )}
          </div>

          {/* Coaching Tips Button */}
          <div className="text-center">
            <button
              onClick={() => loadCoachingTips()}
              className="bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2 mx-auto"
            >
              <BookOpen className="h-4 w-4" />
              <span>Get Voice Coaching Tips</span>
            </button>
          </div>
        </div>
      )}

      {/* Coaching Tips Modal */}
      {showCoachingTips && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-morphism-dark rounded-xl p-6 border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Voice Coaching Tips</h3>
              <button
                onClick={() => setShowCoachingTips(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {typeof coachingTips === 'object' && Object.keys(coachingTips).length > 0 ? (
                Object.entries(coachingTips).map(([category, tips]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="text-primary-400 font-medium capitalize">
                      {category.replace('_', ' ')}
                    </h4>
                    {tips.map((tip, index) => (
                      <div key={index} className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-gray-300 mb-2">{tip.tip}</p>
                        {tip.exercise && (
                          <p className="text-sm text-gray-400 italic">
                            Exercise: {tip.exercise}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              ) : Array.isArray(coachingTips) ? (
                coachingTips.map((tip, index) => (
                  <div key={index} className="p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-gray-300 mb-2">{tip.tip}</p>
                    {tip.exercise && (
                      <p className="text-sm text-gray-400 italic">
                        Exercise: {tip.exercise}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No coaching tips available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAnalysis;
