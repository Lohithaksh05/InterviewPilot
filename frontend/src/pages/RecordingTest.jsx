import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import EnhancedLiveSpeechSimple from '../components/EnhancedLiveSpeechSimple';
import { interviewAPI } from '../services/api';

const RecordingTest = () => {
  const [testResult, setTestResult] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [testSessionId, setTestSessionId] = useState(null);
  const enhancedLiveSpeechRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first to test recording upload');
      navigate('/login');
      return;
    }
    setIsAuthenticated(true);
  }, [navigate]);
  const createTestSession = async () => {
    try {
      const sessionData = {
        interviewer_type: 'TECHNICAL_LEAD',
        job_description: 'Test job for recording functionality',
        resume_text: 'Test resume content',
        num_questions: 1
      };

      const response = await interviewAPI.startInterview(sessionData);
      setTestSessionId(response.session_id);
      toast.success('✅ Test session created: ' + response.session_id.substring(0, 8) + '...');
      return response.session_id;
    } catch (error) {
      console.error('Failed to create test session:', error);
      toast.error('❌ Failed to create test session: ' + (error.message || 'Unknown error'));
      return null;
    }
  };

  const handleTranscriptionUpdate = (text) => {
    console.log('Transcription updated:', text);
    setTestResult(text);
  };

  const handleRecordingComplete = (recordingData) => {
    console.log('Recording completed:', {
      duration: recordingData.duration,
      transcript: recordingData.transcript?.substring(0, 100) + '...',
      audioSize: recordingData.audioBlob?.size
    });
    toast.success('Recording saved locally!');
  };
  const testRecordingUpload = async () => {
    const recordingData = enhancedLiveSpeechRef.current?.getLastRecordingData();
    if (!recordingData) {
      toast.error('No recording data available. Please record something first.');
      return;
    }

    let sessionId = testSessionId;
    if (!sessionId) {
      sessionId = await createTestSession();
      if (!sessionId) return;
    }

    setIsUploading(true);
    try {
      // Convert blob to base64
      const convertBlobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      const base64Audio = await convertBlobToBase64(recordingData.audioBlob);
      
      const uploadData = {
        session_id: sessionId,
        question_index: 0, // Test with first question
        audio_data: base64Audio,
        duration: Number(recordingData.duration) || 0,
        transcript: recordingData.transcript || '',
        file_size: Number(recordingData.audioBlob.size) || 0,
        mime_type: recordingData.audioBlob.type || 'audio/webm'
      };

      console.log('Testing upload with data:', {
        ...uploadData,
        audio_data: `[${uploadData.audio_data.length} chars]`
      });

      const response = await interviewAPI.saveRecording(uploadData);
      
      if (response.success) {
        toast.success('✅ Recording uploaded successfully!');
        console.log('Upload response:', response);
        // Clear recording after successful upload
        enhancedLiveSpeechRef.current?.clearRecording();
      } else {
        toast.error('❌ Upload failed: ' + JSON.stringify(response));
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.response?.status === 400) {
        toast.error('❌ 400 Bad Request: ' + (error.response.data?.detail || 'Invalid data'));
      } else if (error.response?.status === 401) {
        toast.error('❌ 401 Unauthorized: Please login first');
      } else if (error.response?.status === 403) {
        toast.error('❌ 403 Forbidden: Access denied');
      } else {
        toast.error('❌ Upload failed: ' + error.message);
      }
    } finally {
      setIsUploading(false);
    }
  };
  const clearTest = () => {
    enhancedLiveSpeechRef.current?.clearRecording();
    setTestResult('');
    toast.success('Test cleared!');
  };

  const copySessionId = () => {
    if (testSessionId) {
      navigator.clipboard.writeText(testSessionId).then(() => {
        toast.success('✅ Session ID copied to clipboard!');
      }).catch(() => {
        toast.error('❌ Failed to copy session ID');
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Recording Upload Test
        </h1>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Authentication:</span>
              <span className={`px-2 py-1 rounded text-sm ${isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Test Session:</span>
              <span className={`px-2 py-1 rounded text-sm ${testSessionId ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {testSessionId ? `✅ ${testSessionId.substring(0, 8)}...` : '⏳ Not Created'}
              </span>
            </div>
          </div>

          {testSessionId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 mb-1">Session ID for Testing:</h3>
                  <p className="text-sm text-blue-800 font-mono break-all">{testSessionId}</p>
                </div>
                <button
                  onClick={copySessionId}
                  className="ml-3 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Copy ID
                </button>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                💡 Use this Session ID in the "Recording Results Test" page to view recorded audio
              </p>
            </div>
          )}

          {!isAuthenticated && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">⚠️ Please login first to test recording upload functionality.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Enhanced Live Speech Component</h2>
          <EnhancedLiveSpeechSimple
            ref={enhancedLiveSpeechRef}
            onTranscriptionUpdate={handleTranscriptionUpdate}
            onRecordingComplete={handleRecordingComplete}
            className="mb-4"
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {testResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-blue-900 mb-2">Live Transcription:</h3>
              <p className="text-blue-800">{testResult}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={testRecordingUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Testing Upload...</span>
                </>
              ) : (
                <>
                  <span>🧪 Test Recording Upload</span>
                </>
              )}
            </button>

            <button
              onClick={clearTest}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              🗑️ Clear Test
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-900 mb-2">📝 Test Instructions:</h3>
          <ol className="text-yellow-800 space-y-1 list-decimal list-inside">
            <li>Click "Start Live Speech" to begin recording and transcription</li>
            <li>Speak clearly into your microphone</li>
            <li>Click "Stop Live Speech" when finished</li>
            <li>Click "Test Recording Upload" to test the backend upload</li>
            <li>Check browser console for detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RecordingTest;
