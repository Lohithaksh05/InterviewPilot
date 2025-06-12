import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2 } from 'lucide-react';

const AudioPlayer = ({ audioSrc, filename = 'recording.wav', onError }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) {
      console.log('AudioPlayer: No audio element or src, skipping setup');
      setLoading(false);
      return;
    }

    console.log('AudioPlayer: Setting up audio with src:', audioSrc);
    console.log('AudioPlayer: Audio element:', audio);

    // Reset loading state when src changes
    setLoading(true);
    
    // Set src directly
    audio.src = audioSrc;    const handleLoadedMetadata = () => {
      console.log('AudioPlayer: loadedmetadata event fired, duration:', audio.duration);
      const audioDuration = audio.duration || 0;
      console.log('AudioPlayer: Setting duration to:', audioDuration);
      setDuration(audioDuration);
      setLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };    const handleAudioError = (e) => {
      console.error('Audio playback error:', e);
      console.error('Audio error details:', {
        error: audio.error,
        networkState: audio.networkState,
        readyState: audio.readyState,
        src: audio.src
      });
      setLoading(false);
      if (onError) {
        onError('Failed to load audio recording');
      }
    };

    const handleLoadStart = () => {
      console.log('AudioPlayer: loadstart event fired');
    };

    const handleLoadedData = () => {
      console.log('AudioPlayer: loadeddata event fired, readyState:', audio.readyState);
      // Try setting loading to false here too
      if (audio.readyState >= 2) {
        console.log('AudioPlayer: Using loadeddata as fallback');
        setDuration(audio.duration || 0);
        setLoading(false);
      }
    };    const handleCanPlay = () => {
      console.log('AudioPlayer: canplay event fired, readyState:', audio.readyState);
      console.log('AudioPlayer: canplay duration:', audio.duration);
      // More aggressive fallback
      console.log('AudioPlayer: Using canplay as fallback for loadedmetadata');
      const audioDuration = audio.duration || 0;
      console.log('AudioPlayer: Setting duration from canplay to:', audioDuration);
      setDuration(audioDuration);
      setLoading(false);
    };

    const handleCanPlayThrough = () => {
      console.log('AudioPlayer: canplaythrough event fired');
      console.log('AudioPlayer: Using canplaythrough as fallback');
      setDuration(audio.duration || 0);
      setLoading(false);
    };

    // Immediate check for already loaded audio
    if (audio.readyState >= 2) {
      console.log('AudioPlayer: Audio already loaded, readyState:', audio.readyState);
      setDuration(audio.duration || 0);
      setLoading(false);
    } else {
      // Force load the audio
      console.log('AudioPlayer: Calling audio.load()');
      audio.load();
    }
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleAudioError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    // Shorter timeout for testing
    const loadingTimeout = setTimeout(() => {
      console.warn('AudioPlayer: Loading timeout reached, forcing loading to false');
      console.warn('AudioPlayer: Final audio state:', {
        readyState: audio.readyState,
        networkState: audio.networkState,
        duration: audio.duration,
        error: audio.error
      });      if (audio.readyState === 0) {
        setLoading(false);
        if (onError) {
          onError('Audio loading timed out');
        }
      } else {
        // Even if timeout reached, if readyState > 0, consider it partially loaded
        setLoading(false);
      }
    }, 2000); // 2 second timeout - more aggressive

    return () => {
      clearTimeout(loadingTimeout);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleAudioError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [audioSrc, onError]); // Include onError to fix dependency warning

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        if (onError) {
          onError('Failed to play audio recording');
        }
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const downloadAudio = () => {
    if (audioSrc) {
      const link = document.createElement('a');
      link.href = audioSrc;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  const formatTime = (time) => {
    console.log('AudioPlayer: Formatting time:', time);
    if (isNaN(time) || time === null || time === undefined) {
      console.log('AudioPlayer: Invalid time, returning 0:00');
      return '0:00';
    }
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    console.log('AudioPlayer: Formatted time result:', formatted);
    return formatted;
  };
  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
        <span className="text-sm">Loading audio...</span>
        <button 
          onClick={() => {
            console.log('AudioPlayer: Force skipping loading state');
            setLoading(false);
          }}
          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
        >
          Force Skip
        </button>
        <button 
          onClick={() => {
            const audio = audioRef.current;
            if (audio) {
              console.log('AudioPlayer: Current audio state:', {
                src: audio.src,
                readyState: audio.readyState,
                networkState: audio.networkState,
                duration: audio.duration,
                error: audio.error
              });
            }
          }}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
        >
          Debug
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />
      
      <div className="flex items-center space-x-3">        <button
          onClick={togglePlayPause}
          className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md"
          disabled={!audioSrc}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>

        <div className="flex-1 space-y-1">
          <div 
            className="w-full bg-gray-200 rounded-full h-2 cursor-pointer"
            onClick={handleSeek}
          >            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-100"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          {/* Debug info */}
          <div className="text-xs text-gray-400 mt-1">
            Duration: {duration}s | Current: {currentTime}s | Playing: {isPlaying ? 'Yes' : 'No'}
          </div>
        </div>

        <button
          onClick={downloadAudio}
          className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-800 transition-colors"
          title="Download recording"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Volume2 className="h-4 w-4" />
        <span>Voice Recording</span>
        <span className="text-xs text-gray-400">
          ({audioSrc ? audioSrc.substring(0, 20) + '...' : 'No source'})
        </span>
      </div>
    </div>
  );
};

export default AudioPlayer;
