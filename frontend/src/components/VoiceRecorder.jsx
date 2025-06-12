import React, { useState } from 'react';
import { Mic, MicOff, Play, Pause, RotateCcw, FileText, Volume2 } from 'lucide-react';
import useVoiceRecording from '../hooks/useVoiceRecording';

const VoiceRecorder = ({ onTranscriptionComplete, className = '' }) => {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const {
    isRecording,
    audioURL,
    duration,
    durationSeconds,
    isTranscribing,
    error,
    isSupported,
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
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center text-red-700">
          <MicOff className="w-5 h-5 mr-2" />
          <span className="text-sm">Voice recording is not supported in this browser</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Volume2 className="w-5 h-5 mr-2 text-blue-600" />
            Voice Answer
          </h3>
          {durationSeconds > 0 && (
            <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
              {duration}
            </span>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex items-center gap-3">
          {/* Record Button */}
          <button
            onClick={handleRecordToggle}
            disabled={isTranscribing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isRecording
                ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
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
              disabled={isRecording || isTranscribing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={isTranscribing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center text-red-700">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm font-medium">Recording in progress... Speak clearly into your microphone</span>
            </div>
          </div>
        )}

        {/* Audio Playback Info */}
        {audioURL && !isRecording && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">Recording completed ({duration})</span>
              </div>
              <button
                onClick={transcribeAudio}
                disabled={isTranscribing}
                className="flex items-center gap-1 text-sm text-green-700 hover:text-green-800 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                {isTranscribing ? 'Transcribing...' : 'Convert to Text'}
              </button>
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
              <span className="text-sm">Converting speech to text...</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Click "Start Recording" to begin recording your answer</p>
          <p>• Speak clearly into your microphone</p>
          <p>• Click "Stop Recording" when you're finished</p>
          <p>• Use "Convert to Text" to add the transcription to your answer</p>
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;
