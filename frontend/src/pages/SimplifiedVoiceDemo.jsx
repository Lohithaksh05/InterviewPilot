import React, { useState, useRef } from 'react';
import { Mic, MicOff, MessageCircle, Volume2 } from 'lucide-react';
import SimpleVoiceRecorder from '../components/SimpleVoiceRecorder';
import { SpeechToTextService } from '../services/speechToText';
import toast from 'react-hot-toast';

const SimplifiedVoiceDemo = () => {
  const [liveText, setLiveText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [isLiveRecording, setIsLiveRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const speechServiceRef = useRef(null);

  // Initialize speech service
  React.useEffect(() => {
    speechServiceRef.current = new SpeechToTextService();
    
    return () => {
      if (speechServiceRef.current) {
        speechServiceRef.current.cleanup();
      }
    };
  }, []);

  const startLiveTranscription = async () => {
    if (!speechServiceRef.current?.isSupported()) {
      toast.error('Live speech recognition is not supported in this browser');
      return;
    }

    try {
      setIsLiveRecording(true);
      await speechServiceRef.current.startListening({
        onResult: (result) => {
          setInterimText(result.interim);
          if (result.isFinal && result.final.trim()) {
            setFinalText(prev => {
              const separator = prev.trim() ? ' ' : '';
              return prev + separator + result.final;
            });
          }
        },
        onError: (error) => {
          console.error('Speech recognition error:', error);
          toast.error('Speech recognition error: ' + error);
          setIsLiveRecording(false);
        },
        onEnd: () => {
          setIsLiveRecording(false);
          setInterimText('');
        }
      });
    } catch (error) {
      console.error('Error starting live transcription:', error);
      toast.error('Failed to start live transcription');
      setIsLiveRecording(false);
    }
  };

  const stopLiveTranscription = () => {
    if (speechServiceRef.current && isLiveRecording) {
      speechServiceRef.current.stopListening();
      setIsLiveRecording(false);
      setInterimText('');
      toast.success('Live transcription stopped');
    }
  };

  const clearAll = () => {
    setFinalText('');
    setInterimText('');
    setLiveText('');
    toast.success('All text cleared');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🎤 Simplified Voice Features
          </h1>
          <p className="text-gray-600">
            Clean approach: Live speech-to-text for input + Simple recording for practice
          </p>
        </div>

        {/* Live Speech Recognition */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            ✨ Live Speech-to-Text (For Answer Input)
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={isLiveRecording ? stopLiveTranscription : startLiveTranscription}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isLiveRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isLiveRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                <span>{isLiveRecording ? 'Stop Live Speech' : 'Start Live Speech'}</span>
              </button>
              
              {isLiveRecording && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-medium">Listening...</span>
                </div>
              )}
            </div>

            {/* Live transcription display */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-32">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Real-time transcription:</p>
                <div className="text-gray-800">
                  {finalText}
                  {interimText && (
                    <span className="text-blue-600 italic bg-blue-50 px-1 rounded">
                      {interimText}
                    </span>
                  )}
                  {!finalText && !interimText && (
                    <span className="text-gray-400 italic">
                      Start speaking and your words will appear here...
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {finalText.length} characters
                {isLiveRecording && <span className="text-green-600 ml-2">● Live</span>}
              </span>
              
              <button
                onClick={clearAll}
                className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Simple Voice Recording */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📹 Practice Recording (Record & Listen Back)
          </h2>
          
          <div className="space-y-4">
            <SimpleVoiceRecorder 
              onRecordingComplete={(blob, duration) => {
                console.log('Recording completed:', { size: blob.size, duration });
                toast.success('🎉 Recording saved! You can now play it back to review.');
              }}
              className="bg-gray-50 p-4 rounded-lg border border-gray-200"
            />
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>💡 How to use:</strong> Record yourself practicing your answer, 
                then play it back to hear how you sound. This helps you improve your 
                delivery, pace, and clarity without needing transcription.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🔄 Two Complementary Features
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Live Speech-to-Text</h3>
              </div>
              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                <p className="text-green-800 font-medium">For answering questions:</p>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>• Speak directly into the text field</li>
                  <li>• Real-time transcription</li>
                  <li>• Perfect for interview answers</li>
                  <li>• No transcription delays</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">Practice Recording</h3>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <p className="text-blue-800 font-medium">For practice & review:</p>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Record yourself practicing</li>
                  <li>• Play back to review delivery</li>
                  <li>• Improve pace and clarity</li>
                  <li>• No transcription needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            ✅ Why This Approach Works Better
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">Reliability:</h3>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Live speech works consistently</li>
                <li>• No complex transcription failures</li>
                <li>• Better browser compatibility</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">User Experience:</h3>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Clear purpose for each feature</li>
                <li>• Simple, intuitive interface</li>
                <li>• No confusing multiple options</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedVoiceDemo;
