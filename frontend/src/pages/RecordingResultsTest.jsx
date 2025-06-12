import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { interviewAPI } from '../services/api';

const RecordingResultsTest = () => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [recordingsWithAudio, setRecordingsWithAudio] = useState({});
  const [testSessionId, setTestSessionId] = useState('');

  useEffect(() => {
    // Component mounted
  }, []);  const fetchSessionRecordings = async (sessionId) => {
    try {
      const response = await interviewAPI.getSessionRecordings(sessionId);
      console.log('Raw API response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      
      // Handle the response format from backend: { success: true, recordings: [...] }
      const recordings = response.recordings || response || [];
      console.log('Extracted recordings:', recordings);
      console.log('Recordings type:', typeof recordings);
      console.log('Is recordings array:', Array.isArray(recordings));
      
      setRecordings(recordings);
      setSelectedSession(sessionId);
        if (recordings.length === 0) {
        toast('No recordings found for this session', { icon: 'ℹ️' });
      } else {
        toast.success(`Found ${recordings.length} recording(s)`);
      }
    } catch (error) {
      console.error('Error fetching recordings:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to fetch recordings: ' + (error.message || 'Unknown error'));
      setRecordings([]);
    }  };  const fetchAndLoadAudio = async (recordingId) => {
    try {
      toast('Fetching audio data...', { icon: '🔄' });
      console.log('Making request to fetch recording:', recordingId);
      console.log('Authorization token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      
      const response = await interviewAPI.getRecording(recordingId);
      console.log('Fetched individual recording response:', response);      // Handle the response format and create audio source
      const recording = response.recording || response;
      if (recording && recording.audio_data) {
        console.log('Recording MIME type:', recording.mime_type);
        console.log('Audio data length:', recording.audio_data.length);
        
        // Test the audio blob creation first
        const isValidBlob = testAudioBlob(recording.audio_data, recording.mime_type || 'audio/webm');
        if (!isValidBlob) {
          toast.error('Invalid audio data - cannot create playable blob');
          return;
        }
        
        const audioSrc = getAudioSrcFromBase64(recording.audio_data, recording.mime_type || 'audio/webm');
        if (audioSrc) {
          // Store the audio source for this recording
          setRecordingsWithAudio(prev => ({
            ...prev,
            [recordingId]: audioSrc
          }));
          toast.success('Audio loaded successfully!');
        } else {
          toast.error('Failed to create audio source');
        }
      } else {
        toast.error('No audio data found in response');
        console.log('Response structure:', recording);
      }
    } catch (error) {
      console.error('Error fetching recording:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        toast.error('Recording not found in database');
      } else {
        toast.error('Failed to fetch recording: ' + (error.message || 'Unknown error'));
      }
    }
  };  const testAudioBlob = (audioData, mimeType) => {
    try {
      console.log('Testing audio blob creation...');
      
      // Validate base64 format
      if (!audioData || audioData.length === 0) {
        console.error('Audio data is empty');
        return false;
      }
        // Check if it's valid base64
      try {
        atob(audioData.substring(0, 100)); // Test first 100 chars
        console.log('Base64 decode test successful');
      } catch (e) {
        console.error('Invalid base64 format:', e);
        return false;
      }
      
      // Try creating a small test blob
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: mimeType });
      console.log('Blob created successfully:', {
        size: blob.size,
        type: blob.type,
        originalDataLength: audioData.length,
        binaryLength: binaryString.length
      });
      
      if (blob.size === 0) {
        console.error('Created blob has zero size');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error testing audio blob:', error);
      return false;
    }
  };

  const getAudioSrcFromBase64 = (audioData, mimeType = 'audio/webm') => {
    if (!audioData) return null;
    
    try {
      console.log('Converting base64 audio data:', {
        dataLength: audioData.length,
        mimeType: mimeType,
        firstChars: audioData.substring(0, 50),
        lastChars: audioData.substring(audioData.length - 50)
      });
      
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log('Creating audio blob with MIME type:', mimeType);
      console.log('Binary data length:', bytes.length);
      
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      console.log('Created blob URL:', url);
      console.log('Blob size:', blob.size, 'type:', blob.type);
      
      return url;
    } catch (error) {
      console.error('Error creating audio URL:', error);
      return null;
    }
  };

  // Test function to create a simple audio beep for testing
  const createTestAudio = () => {
    try {
      // Create a simple audio beep using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 1; // 1 second
      const numSamples = sampleRate * duration;
      
      const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Generate a 440Hz sine wave (A note)
      for (let i = 0; i < numSamples; i++) {
        channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.3;
      }
      
      // Convert to WAV format (simplified)
      const length = numSamples;
      const arrayBuffer = new ArrayBuffer(44 + length * 2);
      const view = new DataView(arrayBuffer);
      
      // WAV header
      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + length * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, length * 2, true);
      
      // Convert float samples to 16-bit PCM
      let offset = 44;
      for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
      
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      console.log('Created test audio blob:', { size: blob.size, type: blob.type, url });
      
      // Add to recordings for testing
      setRecordingsWithAudio(prev => ({
        ...prev,
        'test-audio': url
      }));
      
      toast.success('Test audio created! Check if AudioPlayer works with known good audio.');
      
    } catch (error) {
      console.error('Error creating test audio:', error);
      toast.error('Failed to create test audio');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🎵 Recording Results Test
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Session Recordings</h2>
            <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Session ID:
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={testSessionId}
                  onChange={(e) => setTestSessionId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter session ID from Recording Test page"
                />
                <button
                  onClick={() => fetchSessionRecordings(testSessionId)}
                  disabled={!testSessionId.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Fetch Recordings
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 Tip: Get a session ID by creating a recording in the "Recording Test" page first
              </p>
            </div>

            <div className="flex space-x-4">              <Link
                to="/recording-test"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Go to Recording Test
              </Link>
              
              <button
                onClick={createTestAudio}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                🔊 Create Test Audio
              </button>
              
              <Link
                to="/interview"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Start New Interview
              </Link>
              
              {selectedSession && (
                <Link
                  to={`/results/${selectedSession}`}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  View Full Results
                </Link>
              )}
            </div>
          </div>
        </div>

        {selectedSession && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Recordings for Session: {selectedSession.substring(0, 8)}...
            </h2>
              {recordings.length > 0 ? (
              <div className="space-y-4">
                {recordings.map((recording, index) => {
                  console.log('Processing recording:', recording);
                    return (
                    <div key={recording.recording_id || recording._id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-medium text-gray-900">
                          Question {recording.question_index + 1}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {recording.duration ? `${recording.duration.toFixed(1)}s` : 'N/A'}
                        </span>
                      </div>

                      {recording.transcript && (
                        <div className="bg-gray-50 p-3 rounded mb-3">
                          <p className="text-sm text-gray-700">
                            <strong>Transcript:</strong> {recording.transcript}
                          </p>
                        </div>
                      )}                      {/* Check if audio is already loaded */}
                      {recordingsWithAudio[recording.recording_id || recording._id] ? (
                        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-green-700 text-sm font-medium">🎤 Voice Recording</span>
                          </div>
                          <audio 
                            controls 
                            src={recordingsWithAudio[recording.recording_id || recording._id]}
                            className="w-full h-10"
                            preload="metadata"
                            onError={() => toast.error('Failed to load audio')}
                          >
                            Your browser does not support the audio element.
                          </audio>
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                            <span>Question {recording.question_index + 1} Recording</span>
                            <a 
                              href={recordingsWithAudio[recording.recording_id || recording._id]} 
                              download={`question-${recording.question_index + 1}-recording.wav`}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                          <p className="text-yellow-800 text-sm">
                            🔄 Audio data needs to be fetched separately. Recording ID: {recording.recording_id || recording._id}
                          </p>
                          <button
                            onClick={() => fetchAndLoadAudio(recording.recording_id || recording._id)}
                            className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                          >
                            Load Audio
                          </button>
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-500">
                        <p>File Size: {recording.file_size ? `${(recording.file_size / 1024).toFixed(1)} KB` : 'N/A'}</p>
                        <p>MIME Type: {recording.mime_type || 'N/A'}</p>
                        <p>Recording ID: {recording.recording_id || recording._id}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recordings found for this session.</p>
                <p className="text-sm mt-2">Try recording something in the Recording Test page first.</p>
              </div>
            )}          </div>
        )}        {/* Test Audio Section */}
        {recordingsWithAudio['test-audio'] && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🔊 Test Audio</h2>
            <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <p className="text-yellow-800 mb-3">
                This is a generated test audio (1-second beep) to verify if the AudioPlayer component works correctly.
              </p>
              
              {/* Direct HTML5 audio element for testing */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-medium mb-2">Direct HTML5 Audio Test:</h4>
                <audio 
                  controls 
                  src={recordingsWithAudio['test-audio']}
                  className="w-full"
                  onLoadStart={() => console.log('Direct audio: loadstart')}
                  onLoadedMetadata={() => console.log('Direct audio: loadedmetadata')}
                  onCanPlay={() => console.log('Direct audio: canplay')}
                  onError={(e) => console.error('Direct audio error:', e)}
                >
                  Your browser does not support the audio element.
                </audio>
                <p className="text-xs text-blue-600 mt-1">
                  If this works, the issue is with our AudioPlayer component. If this doesn't work, the issue is with the blob itself.
                </p>
              </div>
                {/* Our HTML5 Audio Component */}
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <h4 className="font-medium mb-2">HTML5 Audio Element:</h4>
                <audio 
                  controls 
                  src={recordingsWithAudio['test-audio']}
                  className="w-full h-10"
                  preload="metadata"
                  onLoadStart={() => console.log('HTML5 audio: loadstart')}
                  onLoadedMetadata={() => console.log('HTML5 audio: loadedmetadata')}
                  onCanPlay={() => console.log('HTML5 audio: canplay')}
                  onError={() => console.error('HTML5 audio error')}
                >
                  Your browser does not support the audio element.
                </audio>
                <p className="text-xs text-green-600 mt-1">
                  ✅ Using standard HTML5 audio - should work reliably across all browsers.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-900 mb-2">📝 Testing Instructions:</h3>
          <ol className="text-yellow-800 space-y-1 list-decimal list-inside text-sm">
            <li>Go to "Recording Test" page and create a test recording with audio</li>
            <li>Come back here and fetch recordings for that session</li>
            <li>Test the audio playback functionality</li>
            <li>Go to "View Full Results" to see the complete Results page with audio integration</li>
            <li>Verify that recordings appear in the Question-by-Question Review section</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RecordingResultsTest;
