import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Mic, MicOff, Play, Pause, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { SpeechToTextService } from '../services/speechToText';

const EnhancedLiveSpeech = forwardRef(({ 
  onTranscriptionUpdate, 
  onRecordingComplete, 
  disabled = false,
  className = "" 
}, ref) => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioURL, setAudioURL] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  
  // Refs
  const speechServiceRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const audioElementRef = useRef(null);
  const lastRecordingDataRef = useRef(null);  // Initialize speech service
  useEffect(() => {
    speechServiceRef.current = new SpeechToTextService();
    
    return () => {
      if (speechServiceRef.current) {
        speechServiceRef.current.cleanup();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  // Cleanup audioURL when it changes
  useEffect(() => {
    return () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  // Check if browser supports required features
  const isSupported = () => {
    return !!(
      speechServiceRef.current?.isSupported() &&
      navigator.mediaDevices?.getUserMedia &&
      window.MediaRecorder
    );
  };

  // Start enhanced live speech (transcription + recording)
  const startEnhancedLiveSpeech = async () => {
    if (!isSupported()) {
      toast.error('Live speech recognition or recording is not supported in this browser');
      return;
    }

    try {
      setIsActive(true);
      setTranscript('');
      setInterimTranscript('');
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Start audio recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
          // Store recording data for later use when submitting answer
        const recordingData = {
          audioBlob,
          duration: duration, // Keep as number (seconds)
          transcript,
          timestamp: new Date().toISOString()
        };
        
        lastRecordingDataRef.current = recordingData;
        
        if (onRecordingComplete) {
          onRecordingComplete(recordingData);
        }
      };
      
      // Start recording
      mediaRecorder.start(1000);
      
      // Start timer
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 1000);

      // Start live transcription
      await speechServiceRef.current.startListening({
        onResult: (result) => {
          setInterimTranscript(result.interim || '');
          
          if (result.isFinal && result.final.trim()) {
            const newText = result.final.trim();
            setTranscript(prev => {
              const updated = prev + (prev ? ' ' : '') + newText;
              if (onTranscriptionUpdate) {
                onTranscriptionUpdate(updated);
              }
              return updated;
            });
          }
        },
        onError: (error) => {
          console.error('Speech recognition error:', error);
          toast.error('Speech recognition error: ' + error);
          stopEnhancedLiveSpeech();
        },
        onEnd: () => {
          console.log('Speech recognition ended');
          stopEnhancedLiveSpeech();
        }
      });

      toast.success('🎤 Enhanced live speech started - Speaking and recording!');
      
    } catch (error) {
      console.error('Error starting enhanced live speech:', error);
      toast.error('Failed to start live speech. Please check microphone permissions.');
      setIsActive(false);
    }
  };

  // Stop enhanced live speech
  const stopEnhancedLiveSpeech = () => {
    setIsActive(false);
    setInterimTranscript('');
    
    // Stop speech recognition
    if (speechServiceRef.current) {
      speechServiceRef.current.stopListening();
    }
    
    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Cleanup stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    toast.success('Live speech stopped - Recording saved locally!');
  };

  // Toggle enhanced live speech
  const toggleEnhancedLiveSpeech = () => {
    if (isActive) {
      stopEnhancedLiveSpeech();
    } else {
      startEnhancedLiveSpeech();
    }
  };
  // Download audio
  const downloadAudio = () => {
    if (!audioURL) return;
    
    const a = document.createElement('a');
    a.href = audioURL;
    a.download = `interview-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Recording downloaded!');
  };  // Clear all recording state
  const clearRecording = () => {
    setAudioURL(null);
    setTranscript('');
    setInterimTranscript('');
    setDuration(0);
    setCurrentTime(0);
    setAudioDuration(0);
    setIsPlaying(false);
    lastRecordingDataRef.current = null;
    
    // Clean up audio element
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    
    // Clear audio chunks
    audioChunksRef.current = [];
  };

  // Get last recording data for upload when submitting answer
  useImperativeHandle(ref, () => ({
    getLastRecordingData: () => lastRecordingDataRef.current,
    clearRecording: clearRecording
  }));

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported()) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-gray-100 rounded-lg ${className}`}>
        <MicOff className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600">Enhanced live speech not supported</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Control Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleEnhancedLiveSpeech}
          disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isActive 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-green-500 hover:bg-green-600 text-white'
          } disabled:opacity-50`}
        >
          {isActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          <span>{isActive ? 'Stop Live Speech' : 'Start Live Speech'}</span>
        </button>

        {/* Live Status */}
        {isActive && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 font-medium">Live • {formatTime(duration)}</span>
          </div>
        )}
      </div>

      {/* Live Transcription Display */}
      {isActive && (transcript || interimTranscript) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Live Transcription:</h4>
          <div className="text-blue-900">
            <span className="font-medium">{transcript}</span>
            {interimTranscript && (
              <span className="text-blue-600 opacity-75 italic"> {interimTranscript}</span>
            )}
          </div>
        </div>
      )}      {/* Recorded Audio Playback */}
      {audioURL && !isActive && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              🎤 Recorded Speech (will be uploaded when you submit answer)
            </span>
            <span className="text-sm text-gray-500">{formatTime(audioDuration)}</span>
          </div>
          
          {/* HTML5 Audio Player */}
          <audio 
            ref={audioElementRef}
            controls 
            src={audioURL}
            className="w-full h-10"
            preload="metadata"
            onLoadedMetadata={(e) => {
              setAudioDuration(e.target.duration);
              console.log('Audio loaded, duration:', e.target.duration);
            }}
            onTimeUpdate={(e) => {
              setCurrentTime(e.target.currentTime);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            onError={() => toast.error('Failed to load audio recording')}
          >
            Your browser does not support the audio element.
          </audio>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {formatTime(currentTime)} / {formatTime(audioDuration)}
            </span>
              
            <button
              onClick={downloadAudio}
              className="flex items-center gap-2 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>

          {/* Transcription Summary */}
          {transcript && (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Transcription Summary
              </h5>
              <p className="text-gray-800 text-sm">{transcript}</p>
            </div>
          )}
        </div>
      )}
    </div>  );
});

export default EnhancedLiveSpeech;
