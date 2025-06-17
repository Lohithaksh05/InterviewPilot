import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, Clock, User, Calendar, Mic, BarChart3, Eye, Loader2, Search, Filter, X } from 'lucide-react';
import { interviewAPI, voiceAPI } from '../services/api';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import SearchAndFilter from '../components/SearchAndFilter';

const VoiceAnalysisPage = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [audioUrls, setAudioUrls] = useState({}); // Store audio URLs for each recording
  const [loadingAudio, setLoadingAudio] = useState({}); // Track which recordings are loading audio

  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, completed, in_progress
  const [typeFilter, setTypeFilter] = useState('all'); // all, hr, tech_lead, behavioral
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [showFilters, setShowFilters] = useState(false);

  // Load audio data for a recording
  const loadAudioForRecording = async (recording) => {
    if (audioUrls[recording.recording_id]) {
      return audioUrls[recording.recording_id]; // Already loaded
    }

    setLoadingAudio(prev => ({ ...prev, [recording.recording_id]: true }));

    try {
      // Fetch the full recording data including audio_data
      const fullRecordingResponse = await interviewAPI.getRecording(recording.recording_id);
      
      if (!fullRecordingResponse.success || !fullRecordingResponse.recording) {
        toast.error('Failed to fetch audio data');
        return null;
      }
      
      const fullRecording = fullRecordingResponse.recording;
      
      if (!fullRecording.audio_data) {
        toast.error('No audio data available');
        return null;
      }

      // Convert base64 to blob and create audio URL
      let audioData = fullRecording.audio_data;
      
      if (audioData.includes(',')) {
        audioData = audioData.split(',')[1];
      }
      
      const byteCharacters = atob(audioData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: fullRecording.mime_type || 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Store the URL for this recording
      setAudioUrls(prev => ({ ...prev, [recording.recording_id]: audioUrl }));
      
      return audioUrl;
    } catch (error) {
      console.error('Error loading audio:', error);
      toast.error('Failed to load audio');
      return null;
    } finally {
      setLoadingAudio(prev => ({ ...prev, [recording.recording_id]: false }));
    }
  };

  // Fetch all sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, []);  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await interviewAPI.listSessions();
      setSessions(response.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };
  const fetchSessionRecordings = async (sessionId) => {
    try {
      setRecordingsLoading(true);
      const response = await interviewAPI.getSessionRecordings(sessionId);
      
      console.log('Recordings response:', response);
      
      if (response.success) {
        const recordings = response.recordings || [];
        console.log('Recordings data:', recordings);
        console.log('First recording audio_data type:', typeof recordings[0]?.audio_data);
        console.log('First recording keys:', recordings[0] ? Object.keys(recordings[0]) : 'No recordings');
        
        setRecordings(recordings);
        setSelectedSession(sessionId);
      } else {
        toast.error('Failed to fetch recordings');
      }
    } catch (error) {
      console.error('Error fetching recordings:', error);
      toast.error('Failed to fetch recordings');
    } finally {
      setRecordingsLoading(false);
    }
  };  const analyzeRecording = async (recording) => {
    try {
      setAnalyzing(true);
      setSelectedRecording(recording);
      
      console.log('Starting analysis for recording:', recording.recording_id);
      
      // First, fetch the full recording data including audio_data
      const fullRecordingResponse = await interviewAPI.getRecording(recording.recording_id);
      
      console.log('Full recording response for analysis:', fullRecordingResponse);
      
      if (!fullRecordingResponse.success || !fullRecordingResponse.recording) {
        console.error('Invalid response structure for analysis:', fullRecordingResponse);
        toast.error('Failed to fetch recording data for analysis');
        return;
      }
      
      const fullRecording = fullRecordingResponse.recording;
      
      console.log('Full recording data:', {
        hasAudioData: !!fullRecording.audio_data,
        audioDataLength: fullRecording.audio_data?.length,
        transcript: fullRecording.transcript,
        duration: fullRecording.duration
      });
      
      // Prepare analysis data
      const analysisData = {
        audio_data: fullRecording.audio_data,
        transcript: fullRecording.transcript || '',
        duration: Number(fullRecording.duration) || 0
      };
      
      console.log('Sending analysis request with:', {
        hasAudioData: !!analysisData.audio_data,
        audioDataLength: analysisData.audio_data?.length,
        transcript: analysisData.transcript,
        duration: analysisData.duration
      });
        // Use the practice analyze endpoint for detailed analysis
      const response = await voiceAPI.practiceDetailedAnalyze(analysisData);
      
      console.log('Analysis response:', response);
      
      if (response.analysis) {
        setAnalysisResult(response.analysis);
        toast.success('Recording analyzed successfully!');
      } else {
        console.error('Analysis failed - no analysis data:', response);
        toast.error('Analysis failed: No analysis data returned');
      }
    } catch (error) {
      console.error('Error analyzing recording:', error);
      toast.error('Failed to analyze recording: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
  const getInterviewerTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'hr': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'tech_lead': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'behavioral': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Filtering logic
  const filterSessions = (sessions) => {
    return sessions.filter(session => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          session.interviewer_type?.toLowerCase().includes(searchLower) ||
          session.session_id.toLowerCase().includes(searchLower) ||
          formatDate(session.created_at).toLowerCase().includes(searchLower) ||
          (session.is_template_based && 'template'.includes(searchLower)) ||
          (session.template_job_role && session.template_job_role.toLowerCase().includes(searchLower)) ||
          (session.template_name && session.template_name.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'completed' && !session.completed) return false;
        if (statusFilter === 'in_progress' && session.completed) return false;
      }

      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter !== session.interviewer_type) return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const sessionDate = new Date(session.created_at);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        if (dateFilter === 'today' && sessionDate < today) return false;
        if (dateFilter === 'week' && sessionDate < weekAgo) return false;
        if (dateFilter === 'month' && sessionDate < monthAgo) return false;
      }

      return true;
    });
  };

  // Pagination logic
  const filteredSessions = filterSessions(sessions);
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  // Filter handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1); // Reset to first page when filtering
    switch (filterType) {
      case 'status':
        setStatusFilter(value);
        break;
      case 'type':
        setTypeFilter(value);
        break;
      case 'date':
        setDateFilter(value);
        break;
      default:
        break;
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all';

  // Cleanup audio URLs when component unmounts or recordings change
  useEffect(() => {
    return () => {
      // Cleanup all audio URLs
      Object.values(audioUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [audioUrls]);
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
  }  return (
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
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x flex items-center gap-3">
              <Volume2 className="h-10 w-10 text-purple-400" />
              Voice Analysis
            </h1>
            <p className="text-gray-300 text-lg font-medium">Analyze your interview recordings for detailed insights and feedback</p>
          </div>
        </div>        {/* Main Content */}
        <div className="animate-fade-in-up animation-delay-200">
          {!selectedSession ? (
          /* Sessions Table */
          <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-400" />
                    Interview Sessions ({filteredSessions.length})
                  </h2>
                  <p className="text-gray-300 mt-1">Select a session to view and analyze recordings</p>
                </div>

                {/* Search and Filters */}
                <div className="relative">
                  <SearchAndFilter
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    showFilters={showFilters}
                    onToggleFilters={() => setShowFilters(!showFilters)}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={clearAllFilters}
                    placeholder="Search sessions..."
                  >
                    {/* Filter Panel */}
                    <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 shadow-xl">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Status Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                          <select
                            value={statusFilter}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                          >
                            <option value="all">All Sessions</option>
                            <option value="completed">Completed</option>
                            <option value="in_progress">In Progress</option>
                          </select>
                        </div>

                        {/* Type Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Interviewer Type</label>
                          <select
                            value={typeFilter}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                          >
                            <option value="all">All Types</option>
                            <option value="hr">HR</option>
                            <option value="tech_lead">Technical Lead</option>
                            <option value="behavioral">Behavioral</option>
                          </select>
                        </div>

                        {/* Date Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
                          <select
                            value={dateFilter}
                            onChange={(e) => handleFilterChange('date', e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                          >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Last Week</option>
                            <option value="month">Last Month</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </SearchAndFilter>
                </div>
              </div>
            </div>            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center">
                <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                {hasActiveFilters ? (
                  <>
                    <p className="text-gray-400 text-lg">No sessions match your filters</p>
                    <p className="text-gray-500 mt-2">Try adjusting your search or filter criteria</p>
                    <button
                      onClick={clearAllFilters}
                      className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Clear Filters
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 text-lg">No interview sessions found</p>
                    <p className="text-gray-500 mt-2">Complete some interviews to see them here</p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">                    <thead className="bg-black/30">
                      <tr className="text-left">
                        <th className="px-6 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Session Details
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Interviewer Type
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Questions
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {paginatedSessions.map((session) => (
                        <tr key={session.session_id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-white font-medium">
                                Session {session.session_id.slice(-8)}
                              </div>
                              <div className="text-gray-400 text-sm">
                                {formatDate(session.created_at)}
                              </div>
                              {session.is_template_based && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs text-cyan-400">Template:</span>
                                  <span className="text-xs text-gray-300">{session.template_name || session.template_job_role}</span>
                                </div>
                              )}
                            </div>
                          </td>                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getInterviewerTypeColor(session.interviewer_type)}`}>
                              {session.interviewer_type === 'tech_lead' ? 'Technical Lead' : 
                               session.interviewer_type?.toUpperCase() || 'HR'}
                            </span>
                          </td>                          <td className="px-6 py-4 text-gray-300">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-purple-400" />
                              <span>{session.answered_questions || 0}/{session.total_questions || 0}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              session.completed ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                            } border`}>
                              {session.completed ? 'Completed' : 'In Progress'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => fetchSessionRecordings(session.session_id)}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
                            >
                              <Eye className="h-4 w-4" />
                              View Recordings
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-6 border-t border-white/10">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredSessions.length}
                      onPageChange={setCurrentPage}
                      startIndex={startIndex}
                      endIndex={endIndex}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Recordings View */
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedSession(null);
                setRecordings([]);
                setSelectedRecording(null);
                setAnalysisResult(null);
              }}
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              ← Back to Sessions
            </button>

            {/* Session Info */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Session Recordings
              </h2>
              <p className="text-gray-300">Session ID: {selectedSession}</p>
            </div>

            {recordingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                <span className="text-white ml-3">Loading recordings...</span>
              </div>
            ) : recordings.length === 0 ? (
              <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-8 text-center">
                <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No recordings found</p>
                <p className="text-gray-500 mt-2">This session doesn't have any voice recordings</p>
              </div>
            ) : (              <div className="grid gap-6">
                {recordings.map((recording, index) => (
                  <div
                    key={recording.recording_id}
                    className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6"
                  >
                    {/* Recording Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-purple-600 rounded-lg p-3">
                          <Mic className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">
                            Recording {index + 1}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDuration(recording.duration || 0)}
                            </span>
                            <span>Question {(recording.question_index || 0) + 1}</span>
                            <span>{formatDate(recording.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => analyzeRecording(recording)}
                          disabled={analyzing}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          {analyzing && selectedRecording?.recording_id === recording.recording_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <BarChart3 className="h-4 w-4" />
                          )}
                          {analyzing && selectedRecording?.recording_id === recording.recording_id
                            ? 'Analyzing...'
                            : 'Analyze'
                          }
                        </button>
                      </div>
                    </div>

                    {/* Audio Player Section */}
                    <div className="bg-black/30 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Volume2 className="h-5 w-5 text-purple-400" />
                        <span className="text-white font-medium">Audio Recording</span>
                        {loadingAudio[recording.recording_id] && (
                          <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                        )}
                      </div>
                      
                      {audioUrls[recording.recording_id] ? (
                        // Show HTML5 audio player when audio is loaded
                        <audio 
                          controls 
                          className="w-full h-10"
                          preload="metadata"
                          onError={() => toast.error('Failed to load audio recording')}
                        >
                          <source src={audioUrls[recording.recording_id]} type={recording.mime_type || 'audio/webm'} />
                          Your browser does not support the audio element.
                        </audio>
                      ) : (
                        // Show load audio button when audio is not loaded
                        <button
                          onClick={() => loadAudioForRecording(recording)}
                          disabled={loadingAudio[recording.recording_id]}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors w-full justify-center"
                        >
                          {loadingAudio[recording.recording_id] ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading Audio...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              Load Audio Player
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Transcript */}
                    {recording.transcript && (
                      <div className="p-4 bg-black/30 rounded-lg">
                        <h4 className="text-white font-medium mb-2">Transcript:</h4>
                        <p className="text-gray-300 text-sm">{recording.transcript}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}        {/* Enhanced Analysis Results Modal */}
        {analysisResult && selectedRecording && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-purple-500/20 shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-8 border-b border-purple-500/20 bg-gradient-to-r from-purple-600/10 to-blue-600/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-3">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        Voice Analysis Report
                      </h3>
                      <p className="text-purple-300 mt-1">
                        Recording {selectedRecording.question_index + 1} Analysis
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAnalysisResult(null);
                      setSelectedRecording(null);
                    }}
                    className="text-gray-400 hover:text-white transition-all duration-200 hover:bg-white/10 rounded-lg p-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>              <div className="p-8 space-y-8">
                {/* Overall Score with Circular Progress */}
                {analysisResult.overall_score !== undefined && (
                  <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-xl p-6 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-semibold text-lg mb-2 flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          Overall Voice Score
                        </h4>
                        <p className="text-gray-300 text-sm">
                          Comprehensive evaluation of your speaking performance
                        </p>
                      </div>
                      <div className="relative">
                        {/* Circular Progress */}
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-gray-700"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - analysisResult.overall_score / 100)}`}
                            className="text-purple-500 transition-all duration-1000 ease-out"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                              {Math.round(analysisResult.overall_score)}
                            </div>
                            <div className="text-xs text-gray-400">/ 100</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}                {/* Enhanced Voice Metrics */}
                {analysisResult.voice_metrics && (
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Speaking Performance Card */}
                    <div className="bg-gradient-to-br from-blue-600/10 to-cyan-600/10 rounded-xl p-6 border border-blue-500/20">
                      <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                        <Mic className="h-5 w-5 text-blue-400" />
                        Speaking Performance
                      </h4>
                      <div className="space-y-4">
                        {[
                          { 
                            label: 'Speaking Rate', 
                            value: Math.round(analysisResult.voice_metrics.speaking_rate), 
                            unit: 'WPM',
                            color: 'blue',
                            optimal: 150,
                            format: 'number'
                          },
                          { 
                            label: 'Clarity Score', 
                            value: Math.round(analysisResult.voice_metrics.clarity_score), 
                            unit: '%',
                            color: 'green',
                            max: 100,
                            format: 'percentage'
                          },
                          { 
                            label: 'Confidence Score', 
                            value: Math.round(analysisResult.voice_metrics.confidence_score), 
                            unit: '%',
                            color: 'purple',
                            max: 100,
                            format: 'percentage'
                          },
                          { 
                            label: 'Coherence Score', 
                            value: Math.round(analysisResult.voice_metrics.coherence_score), 
                            unit: '%',
                            color: 'yellow',
                            max: 100,
                            format: 'percentage'
                          }
                        ].map((metric, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300 text-sm font-medium">{metric.label}</span>
                              <span className={`text-${metric.color}-400 font-bold`}>
                                {metric.value}{metric.unit}
                              </span>
                            </div>
                            {metric.format === 'percentage' && (
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`bg-gradient-to-r from-${metric.color}-500 to-${metric.color}-400 h-2 rounded-full transition-all duration-1000 ease-out`}
                                  style={{ width: `${Math.min(metric.value, 100)}%` }}
                                ></div>
                              </div>
                            )}
                            {metric.format === 'number' && metric.optimal && (
                              <div className="text-xs text-gray-400">
                                Optimal: ~{metric.optimal} WPM
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Audio Quality Card */}
                    <div className="bg-gradient-to-br from-green-600/10 to-teal-600/10 rounded-xl p-6 border border-green-500/20">
                      <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                        <Volume2 className="h-5 w-5 text-green-400" />
                        Audio Quality
                      </h4>
                      <div className="space-y-4">
                        {[
                          { 
                            label: 'Average Volume', 
                            value: Math.round(analysisResult.voice_metrics.average_volume), 
                            color: 'green'
                          },
                          { 
                            label: 'Volume Consistency', 
                            value: Math.round(analysisResult.voice_metrics.volume_consistency), 
                            color: 'blue'
                          },
                          { 
                            label: 'Voice Stability', 
                            value: Math.round(analysisResult.voice_metrics.voice_stability), 
                            color: 'purple'
                          },
                          { 
                            label: 'Energy Level', 
                            value: Math.round(analysisResult.voice_metrics.energy_level), 
                            color: 'yellow'
                          }
                        ].map((metric, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300 text-sm font-medium">{metric.label}</span>
                              <span className={`text-${metric.color}-400 font-bold`}>
                                {metric.value}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className={`bg-gradient-to-r from-${metric.color}-500 to-${metric.color}-400 h-2 rounded-full transition-all duration-1000 ease-out`}
                                style={{ width: `${Math.min(metric.value, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}                {/* Enhanced Filler Words Analysis */}
                {analysisResult.filler_words && analysisResult.filler_words.length > 0 && (
                  <div className="bg-gradient-to-br from-red-600/10 to-orange-600/10 rounded-xl p-6 border border-red-500/20">
                    <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Filler Words Analysis
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {analysisResult.filler_words.map((filler, index) => (
                        <div key={index} className="bg-black/30 rounded-lg p-4 border border-red-500/20">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">"{filler.word}"</span>
                            <div className="text-center">
                              <div className="text-red-400 font-bold text-lg">{filler.count}</div>
                              <div className="text-xs text-gray-400">times</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-black/20 rounded-lg p-4 border border-red-500/10">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Total Filler Words:</span>
                          <span className="text-red-400 font-bold text-xl">
                            {analysisResult.filler_words.reduce((sum, f) => sum + f.count, 0)}
                          </span>
                        </div>
                        {analysisResult.voice_metrics && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Filler Rate:</span>
                            <span className="text-orange-400 font-bold">
                              {Math.round(analysisResult.voice_metrics.filler_word_rate)} per minute
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}                {/* Strengths and Improvements Grid */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Enhanced Strengths */}
                  {analysisResult.strengths && analysisResult.strengths.length > 0 && (
                    <div className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-xl p-6 border border-green-500/20">
                      <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                        <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Your Strengths
                      </h4>
                      <div className="space-y-3">
                        {analysisResult.strengths.map((strength, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-gray-300 leading-relaxed">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Improvement Areas */}
                  {analysisResult.improvement_areas && analysisResult.improvement_areas.length > 0 && (
                    <div className="bg-gradient-to-br from-yellow-600/10 to-amber-600/10 rounded-xl p-6 border border-yellow-500/20">
                      <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                        <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Areas for Improvement
                      </h4>
                      <div className="space-y-3">
                        {analysisResult.improvement_areas.map((area, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <span className="text-gray-300 leading-relaxed">{area}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>                {/* Enhanced Specific Feedback */}
                {analysisResult.specific_feedback && (
                  <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 rounded-xl p-6 border border-indigo-500/20">
                    <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                      <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Detailed Feedback
                    </h4>
                    <div className="bg-black/20 rounded-lg p-5 border border-indigo-500/10">
                      <p className="text-gray-300 leading-relaxed text-sm">
                        {analysisResult.specific_feedback}
                      </p>
                    </div>
                  </div>
                )}

                {/* Enhanced Performance Comparison */}
                {analysisResult.benchmark_comparison && (
                  <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 rounded-xl p-6 border border-cyan-500/20">
                    <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                      <svg className="h-5 w-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Performance vs. Benchmarks
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(analysisResult.benchmark_comparison).map(([metric, value]) => (
                        <div key={metric} className="bg-black/20 rounded-lg p-4 border border-cyan-500/10">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium capitalize">
                              {metric.replace('_', ' ')}
                            </span>
                            <div className="flex items-center gap-2">
                              {value > 0 ? (
                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              ) : value < 0 ? (
                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                                </svg>
                              )}
                              <span className={`font-bold text-lg ${
                                value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-400'
                              }`}>
                                {value > 0 ? '+' : ''}{Math.round(value)}%
                              </span>
                            </div>
                          </div>
                          {/* Progress bar for benchmark comparison */}
                          <div className="mt-2">
                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${
                                  value > 0 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                                  value < 0 ? 'bg-gradient-to-r from-red-500 to-red-400' :
                                  'bg-gray-500'
                                }`}
                                style={{ width: `${Math.min(Math.abs(value), 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default VoiceAnalysisPage;
