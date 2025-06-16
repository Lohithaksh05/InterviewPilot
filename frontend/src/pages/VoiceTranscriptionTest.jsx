import React, { useState } from 'react';
import { Mic, MicOff, Play, Volume2, RotateCcw, MessageCircle } from 'lucide-react';
import useVoiceRecording from '../hooks/useVoiceRecording';
import toast from 'react-hot-toast';

const VoiceTranscriptionTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [currentTest, setCurrentTest] = useState('');

  const {
    isRecording,
    audioURL,
    duration,
    isTranscribing,
    error,
    isSupported,
    startRecording,
    stopRecording,
    transcribeAudio,
    resetRecording
  } = useVoiceRecording({
    onTranscriptionComplete: (text) => {
      const testResult = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        transcription: text,
        testType: currentTest,
        success: true
      };
      setTestResults(prev => [testResult, ...prev]);
      toast.success('✅ Transcription test completed!');
    },
    onRecordingStop: (blob, duration) => {
      console.log('Recording stopped for test:', { size: blob.size, duration });
    }
  });

  const runTest = async (testName, instructions) => {
    setCurrentTest(testName);
    toast.success(`🎯 Starting test: ${testName}`);
    toast.info(instructions, { duration: 5000 });
    
    // Auto start recording for the test
    await startRecording();
  };

  const testScenarios = [
    {
      name: "Short Phrase Test",
      instructions: "Say a simple phrase like 'Hello, this is a test'"
    },
    {
      name: "Technical Terms Test", 
      instructions: "Say technical terms like 'JavaScript', 'React', 'API integration'"
    },
    {
      name: "Sentence Test",
      instructions: "Say a complete sentence about your experience"
    },
    {
      name: "Numbers Test",
      instructions: "Say some numbers like 'I have 5 years of experience'"
    }
  ];

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <MicOff size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Voice Recording Not Supported</h2>
          <p className="text-gray-600">
            Your browser doesn't support voice recording. Please try Chrome, Edge, or Safari.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            🎤 Voice Transcription Test Suite
          </h1>
          <p className="text-gray-600">
            Test the improved voice recording and transcription functionality
          </p>
        </div>

        {/* Current Recording Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Current Recording</h2>
          
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isRecording ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {isRecording ? <Mic className="animate-pulse" size={20} /> : <MicOff size={20} />}
              <span className="font-medium">
                {isRecording ? `Recording... ${duration}` : 'Ready to record'}
              </span>
            </div>

            {isTranscribing && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100 text-blue-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                <span className="font-medium">Transcribing...</span>
              </div>
            )}
          </div>

          {/* Recording Controls */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } disabled:opacity-50`}
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>

            {audioURL && (
              <>
                <button
                  onClick={() => {
                    const audio = new Audio(audioURL);
                    audio.play();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
                >
                  <Play size={16} />
                  Play Recording
                </button>

                <button
                  onClick={transcribeAudio}
                  disabled={isTranscribing}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  <Volume2 size={16} />
                  {isTranscribing ? 'Transcribing...' : 'Transcribe'}
                </button>

                <button
                  onClick={resetRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 font-medium">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Quick Test Scenarios */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Test Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {testScenarios.map((scenario, index) => (
              <button
                key={index}
                onClick={() => runTest(scenario.name, scenario.instructions)}
                disabled={isRecording || isTranscribing}
                className="text-left p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <h3 className="font-medium text-blue-800 mb-1">{scenario.name}</h3>
                <p className="text-blue-600 text-sm">{scenario.instructions}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Test Results ({testResults.length})
          </h2>
          
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>No test results yet. Run a test to see transcription results.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {testResults.map((result) => (
                <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-800">{result.testType}</span>
                    <span className="text-sm text-gray-500">{result.timestamp}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-700">{result.transcription}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {testResults.length > 0 && (
            <button
              onClick={() => setTestResults([])}
              className="mt-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
            >
              Clear Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceTranscriptionTest;
