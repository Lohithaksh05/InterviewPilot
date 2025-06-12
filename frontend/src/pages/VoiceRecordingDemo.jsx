import React, { useState } from 'react';
import { Volume2, Mic, Play, FileText, Sparkles } from 'lucide-react';
import EnhancedVoiceRecorder from '../components/EnhancedVoiceRecorder';

const VoiceRecordingDemo = () => {
  const [transcribedText, setTranscribedText] = useState('');

  const handleTranscriptionComplete = (text) => {
    setTranscribedText(prev => {
      const separator = prev.trim() ? '\n\n' : '';
      return prev + separator + text;
    });
  };

  const clearTranscription = () => {
    setTranscribedText('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-purple-600 p-4 rounded-full shadow-lg animate-bounce-slow">
              <Volume2 className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Voice Recording Demo
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Test the advanced voice recording and transcription features
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Mic className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Audio Recording</h3>
            <p className="text-gray-600 text-sm text-center">Record your voice with high-quality audio capture and playback functionality</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Play className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Live Transcription</h3>
            <p className="text-gray-600 text-sm text-center">Real-time speech-to-text conversion using Web Speech API</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Text Integration</h3>
            <p className="text-gray-600 text-sm text-center">Seamlessly add transcribed text to your interview answers</p>
          </div>
        </div>

        {/* Demo Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Voice Recorder */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
              Try Voice Recording
            </h2>
            <EnhancedVoiceRecorder 
              onTranscriptionComplete={handleTranscriptionComplete}
              className="mb-6"
            />
            
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">How to Use:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Choose between "Record & Transcribe" or "Live Speech-to-Text"</li>
                <li>Click the record button and grant microphone permissions</li>
                <li>Speak clearly into your microphone</li>
                <li>Stop recording and convert to text</li>
                <li>The transcribed text will appear on the right</li>
              </ol>
            </div>
          </div>

          {/* Transcription Output */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-blue-600" />
                Transcribed Text
              </h2>
              {transcribedText && (
                <button
                  onClick={clearTranscription}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-6 min-h-[400px]">
              {transcribedText ? (
                <div className="prose prose-gray max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {transcribedText}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-center">
                  <div>
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No transcription yet</p>
                    <p className="text-sm">Start recording to see your speech converted to text</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Character Count */}
            {transcribedText && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                {transcribedText.length} characters • {transcribedText.split(/\s+/).filter(word => word.length > 0).length} words
              </div>
            )}
          </div>
        </div>

        {/* Browser Compatibility */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-medium text-yellow-900 mb-2 flex items-center">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
            Browser Compatibility
          </h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p><strong>Audio Recording:</strong> Supported in all modern browsers (Chrome, Firefox, Safari, Edge)</p>
            <p><strong>Live Speech Recognition:</strong> Best supported in Chrome and Edge. Limited support in Firefox and Safari.</p>
            <p><strong>Note:</strong> Microphone permissions are required for all voice features.</p>
          </div>
        </div>

        {/* Sample Interview Questions */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Practice Questions</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Tell me about yourself and your background.",
              "What are your greatest strengths and weaknesses?",
              "Describe a challenging project you worked on.",
              "Where do you see yourself in 5 years?",
              "Why are you interested in this position?",
              "How do you handle stress and tight deadlines?"
            ].map((question, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <p className="text-gray-800 text-sm">{question}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceRecordingDemo;
