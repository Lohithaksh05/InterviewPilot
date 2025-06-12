import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Pause, RotateCcw, FileText, Volume2, Waves } from 'lucide-react';
import toast from 'react-hot-toast';
import useVoiceRecording from '../hooks/useVoiceRecording';
import { SpeechToTextService } from '../services/speechToText';

const EnhancedVoiceRecorder = ({ onTranscriptionComplete, className = '' }) => {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isLiveRecording, setIsLiveRecording] = useState(false);
  
  const speechServiceRef = useRef(null);

  const {
    isRecording,
    audioURL,
    duration,
    durationSeconds,
    isTranscribing,
    error,
    isSupported: isRecordingSupported,
    startRecording,
    stopRecording,
    transcribeAudio,
    resetRecording
  } = useVoiceRecording({
    onTranscriptionComplete,
    onRecordingStop: (blob, duration) => {
      console.log('Recording stopped', { blob, duration });
    }
  });

  // Initialize speech service
  useEffect(() => {
    speechServiceRef.current = new SpeechToTextService();
    
    return () => {
      if (speechServiceRef.current) {
        speechServiceRef.current.cleanup();
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (!audioURL) return;

    if (audioPlaying) {
      audioElement?.pause();
      setAudioPlaying(false);
    } else {
      const audio = new Audio(audioURL);
      audio.onended = () => setAudioPlaying(false);
      audio.play();
      setAudioElement(audio);
      setAudioPlaying(true);
    }
  };

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleLiveRecordingToggle = async () => {
    if (isLiveRecording) {
      // Stop live recording
      speechServiceRef.current?.stopListening();
      setIsLiveRecording(false);
      
      // Send final transcript if available
      if (finalTranscript.trim()) {
        onTranscriptionComplete(finalTranscript);
        setFinalTranscript('');
        setLiveTranscript('');
        toast.success('Live transcription completed');
      }
    } else {
      // Start live recording
      if (!speechServiceRef.current?.isSupported()) {
        toast.error('Live speech recognition is not supported in this browser');
        return;
      }

      try {
        await speechServiceRef.current.startListening({
          onResult: (result) => {
            setLiveTranscript(result.interim);
            if (result.isFinal && result.final.trim()) {
              setFinalTranscript(prev => prev + ' ' + result.final);
            }
          },
          onError: (error) => {
            console.error('Speech recognition error:', error);
            toast.error('Speech recognition error: ' + error);
            setIsLiveRecording(false);
          },
          onEnd: () => {
            setIsLiveRecording(false);
          }
        });
        
        setIsLiveRecording(true);
        toast.success('Live speech recognition started');
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        toast.error('Failed to start live recording: ' + error.message);
      }
    }
  };

  const handleReset = () => {
    if (audioElement) {
      audioElement.pause();
      setAudioPlaying(false);
      setAudioElement(null);
    }
    
    if (isLiveRecording) {
      speechServiceRef.current?.stopListening();
      setIsLiveRecording(false);
    }
    
    setLiveTranscript('');
    setFinalTranscript('');
    resetRecording();
  };

  const handleUseLiveTranscript = () => {
    const fullTranscript = (finalTranscript + ' ' + liveTranscript).trim();
    if (fullTranscript) {
      onTranscriptionComplete(fullTranscript);
      setFinalTranscript('');
      setLiveTranscript('');
      toast.success('Live transcript added to your answer');
    }
  };

  if (!isRecordingSupported && !speechServiceRef.current?.isSupported()) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center text-red-700">
          <MicOff className="w-5 h-5 mr-2" />
          <span className="text-sm">Voice recording is not supported in this browser</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Volume2 className="w-5 h-5 mr-2 text-blue-600" />
            Voice Answer Options
          </h3>
          {durationSeconds > 0 && (
            <span className="text-sm text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded-full">
              {duration}
            </span>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 flex items-center">
              <MicOff className="w-4 h-4 mr-2" />
              {error}
            </p>
          </div>
        )}

        {/* Recording Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Traditional Recording */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-blue-600" />
              Record & Transcribe
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRecordToggle}
                  disabled={isTranscribing || isLiveRecording}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isRecording
                      ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Record
                    </>
                  )}
                </button>

                {audioURL && (
                  <button
                    onClick={handlePlayPause}
                    disabled={isRecording || isTranscribing || isLiveRecording}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {audioPlaying ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Play
                      </>
                    )}
                  </button>
                )}
              </div>

              {audioURL && !isRecording && (
                <button
                  onClick={transcribeAudio}
                  disabled={isTranscribing || isLiveRecording}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4" />
                  {isTranscribing ? 'Converting...' : 'Convert to Text'}
                </button>
              )}
            </div>
          </div>

          {/* Live Transcription */}
          {speechServiceRef.current?.isSupported() && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Waves className="w-4 h-4 mr-2 text-green-600" />
                Live Speech-to-Text
              </h4>
              
              <div className="space-y-3">
                <button
                  onClick={handleLiveRecordingToggle}
                  disabled={isRecording || isTranscribing}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isLiveRecording
                      ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLiveRecording ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      Stop Live Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Start Live Recording
                    </>
                  )}
                </button>

                {(finalTranscript || liveTranscript) && (
                  <button
                    onClick={handleUseLiveTranscript}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Use This Text
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live Transcript Display */}
        {(isLiveRecording || finalTranscript || liveTranscript) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2 flex items-center">
              {isLiveRecording && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>}
              Live Transcription
            </h5>
            <div className="text-sm text-gray-700 space-y-1 min-h-[60px] max-h-32 overflow-y-auto">
              {finalTranscript && (
                <div className="text-gray-900 font-medium">{finalTranscript}</div>
              )}
              {liveTranscript && (
                <div className="text-gray-600 italic">{liveTranscript}</div>
              )}
              {isLiveRecording && !liveTranscript && !finalTranscript && (
                <div className="text-gray-400 italic">Listening... Start speaking to see live transcription</div>
              )}
            </div>
          </div>
        )}

        {/* Recording Status */}
        {isRecording && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center text-red-700">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm font-medium">Recording in progress... Speak clearly into your microphone</span>
            </div>
          </div>
        )}

        {/* Transcription Status */}
        {isTranscribing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center text-blue-700">
              <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm">Converting recorded speech to text...</span>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p>💡 <strong>Tips:</strong></p>
            <p>• Use "Record & Transcribe" for longer, complete answers</p>
            <p>• Use "Live Speech-to-Text" for real-time feedback</p>
            <p>• Ensure microphone permissions are enabled</p>
          </div>
          
          <button
            onClick={handleReset}
            disabled={isTranscribing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVoiceRecorder;
