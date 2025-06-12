import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SimpleVoiceRecorder = ({ onRecordingComplete, className = "" }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const audioElementRef = useRef(null);

  // Check browser support
  const isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

  // Start recording
  const startRecording = async () => {
    if (!isSupported) {
      toast.error('Voice recording is not supported in this browser');
      return;
    }

    try {
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
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setAudioURL(audioUrl);
        setIsRecording(false);
        
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
        
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob, duration);
        }
        
        toast.success('Recording completed!');
      };
      
      // Start recording
      mediaRecorder.start(1000);
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      // Start timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 1000);
      
      toast.success('Recording started');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Play/pause audio
  const togglePlayback = () => {
    if (!audioURL) return;

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioURL);
      
      audioElementRef.current.onloadedmetadata = () => {
        setAudioDuration(audioElementRef.current.duration);
      };
      
      audioElementRef.current.ontimeupdate = () => {
        setCurrentTime(audioElementRef.current.currentTime);
      };
      
      audioElementRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(error => {
          console.error('Audio playback error:', error);
          toast.error('Failed to play audio');
        });
    }
  };

  // Clear recording
  const clearRecording = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    
    setAudioURL(null);
    setDuration(0);
    setIsPlaying(false);
    setAudioDuration(0);
    setCurrentTime(0);
    audioChunksRef.current = [];
    
    toast.success('Recording cleared');
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
    };
  }, [audioURL]);

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-gray-100 rounded-lg ${className}`}>
        <MicOff className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600">Voice recording not supported</span>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Recording Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
        </button>

        {/* Recording Duration */}
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-700 font-medium">{formatTime(duration)}</span>
          </div>
        )}
      </div>

      {/* Playback Controls */}
      {audioURL && !isRecording && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Recorded Audio</span>
            <span className="text-sm text-gray-500">{formatTime(audioDuration)}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0}%` }}
            ></div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayback}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            
            <span className="text-sm text-gray-600">
              {formatTime(currentTime)} / {formatTime(audioDuration)}
            </span>
            
            <button
              onClick={clearRecording}
              className="flex items-center gap-2 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium ml-auto"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleVoiceRecorder;
