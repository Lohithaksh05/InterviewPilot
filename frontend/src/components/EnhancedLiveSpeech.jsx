import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Volume2, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { SpeechToTextService } from '../services/speechToText';
import { interviewAPI } from '../services/api';

const EnhancedLiveSpeech = ({ 
  onTranscriptionUpdate, 
  onRecordingComplete, 
  disabled = false,
  className = "" 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioURL, setAudioURL] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [lastRecordingData, setLastRecordingData] = useState(null);
  
  // Refs
  const speechServiceRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const audioElementRef = useRef(null);
  // Initialize speech service
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
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };  }, [audioURL]);

  // Convert audio blob to base64
  const convertBlobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:audio/webm;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Upload recording to database
  const uploadRecording = async (audioBlob, transcript) => {
    if (!sessionId || questionIndex === undefined) {
      toast.error('Session information missing - cannot upload recording');
      return;
    }

    setIsUploading(true);
    try {
      // Convert blob to base64
      const base64Audio = await convertBlobToBase64(audioBlob);
      
      const recordingData = {
        session_id: sessionId,
        question_index: questionIndex,
        audio_data: base64Audio,
        duration: duration / 1000, // Convert to seconds
        transcript: transcript || '',
        file_size: audioBlob.size,
        mime_type: audioBlob.type || 'audio/webm'
      };

      const response = await interviewAPI.saveRecording(recordingData);
      
      if (response.success) {
        setUploadSuccess(true);
        toast.success('🎉 Recording uploaded to database!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading recording:', error);
      toast.error('Failed to upload recording: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

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
        
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob, duration, transcript);
        }

        // Automatically upload recording to database
        if (sessionId && questionIndex !== undefined) {
          uploadRecording(audioBlob, transcript);
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
    
    toast.success('Live speech stopped - Recording saved!');
  };

  // Toggle enhanced live speech
  const toggleEnhancedLiveSpeech = () => {
    if (isActive) {
      stopEnhancedLiveSpeech();
    } else {
      startEnhancedLiveSpeech();
    }
  };

  // Play/pause recorded audio
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
  };

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
      )}

      {/* Recorded Audio Playback */}
      {audioURL && !isActive && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Recorded Speech</span>
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
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            
            <span className="text-sm text-gray-600">
              {formatTime(currentTime)} / {formatTime(audioDuration)}
            </span>
              <button
              onClick={downloadAudio}
              className="flex items-center gap-2 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>

            {sessionId && questionIndex !== undefined && !uploadSuccess && (
              <button
                onClick={() => {
                  // Re-create blob from audioURL for manual upload
                  fetch(audioURL)
                    .then(res => res.blob())
                    .then(blob => uploadRecording(blob, transcript));
                }}
                disabled={isUploading}
                className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Upload to DB</span>
                  </>
                )}
              </button>
            )}

            {uploadSuccess && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
                <span className="text-sm font-medium">✅ Uploaded</span>
              </div>
            )}
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
    </div>
  );
};

export default EnhancedLiveSpeech;
