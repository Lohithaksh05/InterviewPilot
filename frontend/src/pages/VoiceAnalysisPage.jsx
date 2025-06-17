import React, { useState, useEffect } from 'react';
import { interviewAPI, voiceAPI } from '../services/api';
import VoiceAnalysis from '../components/VoiceAnalysis';
import VoiceRecorder from '../components/VoiceRecorder';
import { 
  Mic, Volume2, BarChart3, Zap, MessageSquare, 
  FileText, Clock, User, Calendar, Play, Loader
} from 'lucide-react';
import toast from 'react-hot-toast';

const VoiceAnalysisPage = () => {
  const [transcript, setTranscript] = useState('');
  const [audioData, setAudioData] = useState(null);
  const [duration, setDuration] = useState(0);
  const [selectedMode, setSelectedMode] = useState('practice'); // 'practice' or 'recordings'
  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [analyzingRecording, setAnalyzingRecording] = useState(false);
  const [recordingAnalysis, setRecordingAnalysis] = useState(null);

  useEffect(() => {
    if (selectedMode === 'recordings') {
      fetchRecordings();
    }
  }, [selectedMode]);  const fetchRecordings = async () => {
    try {
      setLoadingRecordings(true);
      console.log('Fetching recordings...');
      const response = await interviewAPI.listRecordings();
      console.log('API Response:', response);
      console.log('Recordings:', response.recordings);
      setRecordings(response.recordings || []);
      if (response.recordings && response.recordings.length > 0) {
        toast.success(`Found ${response.recordings.length} recordings`);
      } else {
        console.log('No recordings found');
        // Don't show toast for no recordings - it's expected
      }
    } catch (error) {
      console.error('Error fetching recordings:', error);
      toast.error(`Failed to fetch recordings: ${error.message}`);
    } finally {
      setLoadingRecordings(false);
    }
  };

  const handleTranscriptionComplete = (transcriptData) => {
    console.log('Transcription completed:', transcriptData);
    
    if (typeof transcriptData === 'string') {
      setTranscript(transcriptData);
      setAudioData(null);
      setDuration(0);
    } else {
      setTranscript(transcriptData.transcript || '');
      setAudioData(transcriptData.audioData || null);
      const durationInSeconds = transcriptData.durationSeconds || transcriptData.duration || 0;
      setDuration(durationInSeconds);
    }
  };

  const analyzeSelectedRecording = async (recording) => {
    try {
      setAnalyzingRecording(true);
      setSelectedRecording(recording);
      
      // Fetch the full recording with audio data
      const response = await interviewAPI.getRecording(recording.recording_id);
      const fullRecording = response.recording;
      
      // Perform voice analysis using the full analyze endpoint
      const analysisResponse = await voiceAPI.analyzeVoice({
        recording_id: fullRecording.recording_id || fullRecording._id,
        session_id: fullRecording.session_id,
        question_index: fullRecording.question_index || 0,
        audio_data: fullRecording.audio_data,
        transcript: fullRecording.transcript || '',
        duration: fullRecording.duration || 0
      });
      
      setRecordingAnalysis(analysisResponse.analysis);
      toast.success('Recording analysis completed!');
      
    } catch (error) {
      console.error('Error analyzing recording:', error);
      toast.error('Failed to analyze recording');
    } finally {
      setAnalyzingRecording(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="glass-morphism rounded-2xl p-8 mb-8 border border-white/10">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                  <Mic className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                🎤 Voice Analysis Center
              </span>
            </h1>
            
            <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Analyze your voice from practice sessions or past interview recordings. 
              Get detailed insights on speaking pace, clarity, confidence, and more.
            </p>
          </div>

          {/* Mode Selection */}
          <div className="flex justify-center mt-8">
            <div className="bg-gray-800/30 p-1 rounded-lg border border-gray-700">
              <button
                onClick={() => setSelectedMode('practice')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedMode === 'practice'
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/30'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Practice Mode
              </button>
              <button
                onClick={() => setSelectedMode('recordings')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedMode === 'recordings'
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/30'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Analyze Recordings
              </button>
            </div>
          </div>
        </div>

        {/* Practice Mode */}
        {selectedMode === 'practice' && (
          <>
            {/* Voice Analysis Component for Practice */}
            <VoiceAnalysis 
              audioData={audioData}
              transcript={transcript}
              duration={duration}
              sessionId="voice_practice"
              questionIndex={0}
            />

            {/* Practice Section */}
            <div className="glass-morphism rounded-2xl p-8 border border-white/10">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Practice Speaking</h2>
                <p className="text-gray-300">
                  Record yourself speaking and get instant voice analysis feedback
                </p>
              </div>

              <VoiceRecorder 
                onTranscriptionComplete={handleTranscriptionComplete}
                className="max-w-2xl mx-auto"
              />

              {/* Prompt to convert to text if recording is done but transcript not yet available */}
              {audioData && !transcript && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-300 text-center">
                  Recording complete. Click <b>Convert to Text</b> to see your transcript and get instant analysis.
                </div>
              )}

              {transcript && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-medium text-white mb-2">Your Transcript:</h3>
                    <p className="text-gray-300 leading-relaxed">{transcript}</p>
                  </div>
                  
                  {duration > 0 && (
                    <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center justify-center gap-2 text-green-300">
                        <BarChart3 className="w-5 h-5" />
                        <span className="font-medium">
                          Voice analysis is ready! Check the analysis above for insights on your speaking patterns.
                        </span>
                      </div>
                      <p className="text-sm text-green-400 mt-2">
                        Recording duration: {duration.toFixed(1)} seconds
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Recordings Mode */}
        {selectedMode === 'recordings' && (
          <div className="space-y-6">
            {/* Recordings List */}
            <div className="glass-morphism rounded-2xl p-8 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Interview Recordings</h2>
                <button
                  onClick={fetchRecordings}
                  disabled={loadingRecordings}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
                >
                  {loadingRecordings ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  Refresh
                </button>
              </div>

              {loadingRecordings ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  <span className="ml-3 text-gray-300">Loading recordings...</span>
                </div>
              ) : recordings.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No interview recordings found</p>
                  <p className="text-gray-500 text-sm mt-2">Complete some interviews to see recordings here</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {recordings.map((recording) => (
                    <div
                      key={recording.recording_id || recording._id}
                      className="p-4 bg-gray-800/30 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Volume2 className="w-5 h-5 text-purple-400" />
                            <span className="font-medium text-white">
                              Question {(recording.question_index || 0) + 1}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400 text-sm">
                              Session: {recording.session_id}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {recording.duration ? `${recording.duration.toFixed(1)}s` : 'Unknown duration'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(recording.created_at)}
                            </div>
                          </div>
                          
                          {recording.transcript && (
                            <p className="text-gray-300 text-sm line-clamp-2">
                              {recording.transcript.substring(0, 150)}...
                            </p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => analyzeSelectedRecording(recording)}
                          disabled={analyzingRecording}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                        >
                          {analyzingRecording && selectedRecording?.recording_id === (recording.recording_id || recording._id) ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          Analyze
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Analysis Results for Selected Recording */}
            {recordingAnalysis && selectedRecording && (
              <div className="glass-morphism rounded-2xl p-8 border border-white/10">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Analysis Results
                  </h2>
                  <p className="text-gray-400">
                    Recording from Question {(selectedRecording.question_index || 0) + 1} 
                    • Session: {selectedRecording.session_id}
                  </p>
                </div>

                {/* Display the analysis using VoiceAnalysis component */}
                <VoiceAnalysis 
                  audioData={true} // We have audio data for this recording
                  transcript={selectedRecording.transcript || ''}
                  duration={selectedRecording.duration || 0}
                  sessionId={selectedRecording.session_id}
                  questionIndex={selectedRecording.question_index || 0}
                  existingAnalysis={recordingAnalysis} // Pass the analysis we already fetched
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAnalysisPage;
