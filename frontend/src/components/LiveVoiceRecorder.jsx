import React, { useState } from 'react';
import { Mic, MicOff, Play, Pause, RotateCcw, FileText, Volume2, MessageCircle } from 'lucide-react';
import useLiveVoiceRecording from '../hooks/useLiveVoiceRecording';

const LiveVoiceRecorder = ({ onTranscriptionComplete, className = '' }) => {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  
  const {
    isRecording,
    audioURL,
    duration,
    durationSeconds,
    error,
    liveTranscript,
    isSupported,
    isSpeechRecognitionSupported,
    startRecording,
    stopRecording,
    transcribeAudio,
    resetRecording
  } = useLiveVoiceRecording({
    onTranscriptionComplete,
    onRecordingStop: (blob, duration) => {
      console.log('Recording stopped', { blob, duration });
    }
  });

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

  const handleReset = () => {
    if (audioElement) {
      audioElement.pause();
      setAudioPlaying(false);
      setAudioElement(null);
    }
    resetRecording();
  };

  if (!isSupported) {
    return (
      <div className={`glass-morphism-dark rounded-xl p-4 border border-red-500/20 ${className}`}>
        <div className="flex items-center text-red-400">
          <MicOff className="w-5 h-5 mr-2" />
          <span className="text-sm">Voice recording is not supported in this browser</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-morphism-dark rounded-xl p-6 border border-gray-700 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white flex items-center">
            <Volume2 className="w-5 h-5 mr-2 text-purple-400" />
            Voice Practice
          </h3>
          {durationSeconds > 0 && (
            <span className="text-sm text-gray-300 font-mono bg-gray-800/50 px-2 py-1 rounded">
              {duration}
            </span>
          )}
        </div>

        {/* Speech Recognition Status */}
        {!isSpeechRecognitionSupported && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-sm text-yellow-300">
              ⚠️ Live transcription not available - you can still record and get basic analysis
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Live Transcript Display */}
        {isRecording && liveTranscript && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Live Transcript</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {liveTranscript}
            </p>
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex items-center gap-3">
          {/* Record Button */}
          <button
            onClick={handleRecordToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isRecording
                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 animate-pulse border border-red-500/30'
                : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30'
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Start Recording
              </>
            )}
          </button>

          {/* Play/Pause Button */}
          {audioURL && (
            <button
              onClick={handlePlayPause}
              disabled={isRecording}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 border border-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Reset Button */}
          {(audioURL || isRecording) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 border border-gray-500/30 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center text-red-300">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm font-medium">
                Recording in progress... 
                {isSpeechRecognitionSupported ? ' Speak clearly for live transcription' : ' Speak clearly into your microphone'}
              </span>
            </div>
          </div>
        )}

        {/* Audio Playback Info */}
        {audioURL && !isRecording && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-300">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-sm">Recording completed ({duration})</span>
              </div>
              {!liveTranscript && (
                <button
                  onClick={transcribeAudio}
                  className="flex items-center gap-1 text-sm text-green-300 hover:text-green-200 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Get Transcript
                </button>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>• Click "Start Recording" to begin recording with {isSpeechRecognitionSupported ? 'live transcription' : 'audio capture'}</p>
          <p>• Speak clearly into your microphone</p>
          <p>• Click "Stop Recording" when you're finished</p>
          {isSpeechRecognitionSupported && (
            <p>• Your speech will be transcribed in real-time for instant analysis</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveVoiceRecorder;
