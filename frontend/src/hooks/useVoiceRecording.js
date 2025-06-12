import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ImprovedAudioTranscriber from '../services/improvedAudioTranscriber';

const useVoiceRecording = ({ onTranscriptionComplete, onRecordingStop }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);
    const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const transcriptionServiceRef = useRef(null);  // Initialize transcription service
  useEffect(() => {
    transcriptionServiceRef.current = new ImprovedAudioTranscriber();
  }, []);

  // Check browser support
  const isSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  };

  // Start recording
  const startRecording = async () => {
    if (!isSupported()) {
      setError('Voice recording is not supported in this browser');
      toast.error('Voice recording is not supported in this browser');
      return;
    }

    try {
      setError(null);
      
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
        
        setAudioBlob(audioBlob);
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
        
        if (onRecordingStop) {
          onRecordingStop(audioBlob, duration);
        }
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
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
      setError('Failed to start recording. Please check microphone permissions.');
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      toast.success('Recording stopped');
    }
  };  // Transcribe audio using enhanced transcription service
  const transcribeAudio = async () => {
    if (!audioBlob) {
      setError('No audio to transcribe');
      toast.error('No audio to transcribe. Please record some audio first.');
      return;
    }

    if (!transcriptionServiceRef.current?.isSupported()) {
      setError('Speech recognition not supported');
      toast.error('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    setIsTranscribing(true);
    setError(null);

    try {
      // Show progress toast with more specific message
      const loadingToast = toast.loading('🎤 Processing your recorded voice...');
      
      // Use the improved transcription service
      const transcription = await transcriptionServiceRef.current.transcribe(audioBlob, {
        language: 'en-US'
      });
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (transcription && transcription.trim()) {
        console.log('Transcription successful:', transcription);
        
        if (onTranscriptionComplete) {
          onTranscriptionComplete(transcription);
        }
        
        toast.success('🎉 Voice transcribed successfully!', {
          duration: 3000
        });
        
        // Clear the recording after successful transcription
        resetRecording();
      } else {
        toast.error('No speech was detected in your recording. Please speak more clearly.', {
          duration: 4000
        });
      }
      
    } catch (error) {
      console.error('Error transcribing audio:', error);
      const errorMessage = error.message || 'Failed to transcribe audio';
      setError(errorMessage);
      
      // Dismiss any loading toasts
      toast.dismiss();
      
      // Provide helpful error messages based on error type
      if (errorMessage.includes('permission') || errorMessage.includes('not-allowed')) {
        toast.error('❌ Microphone permission denied. Please allow microphone access and try again.', {
          duration: 5000
        });
      } else if (errorMessage.includes('not supported')) {
        toast.error('❌ Speech recognition not supported. Try using Chrome or Edge browser.', {
          duration: 5000
        });
      } else if (errorMessage.includes('No speech')) {
        toast.error('🔇 No speech detected. Please ensure you spoke clearly during recording.', {
          duration: 4000
        });
      } else if (errorMessage.includes('timeout')) {
        toast.error('⏰ Transcription timed out. Try with a shorter recording.', {
          duration: 4000
        });
      } else {
        toast.error('❌ Failed to transcribe audio. Try recording again or use live speech recognition.', {
          duration: 5000
        });
      }
    } finally {
      setIsTranscribing(false);
    }
  };
  // Reset recording state
  const resetRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    
    // Stop any ongoing transcription
    if (transcriptionServiceRef.current) {
      transcriptionServiceRef.current.stop();
    }
    
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    
    setAudioURL(null);
    setAudioBlob(null);
    setDuration(0);
    setError(null);
    setIsTranscribing(false);
    audioChunksRef.current = [];
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
    };
  }, [audioURL]);

  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    audioURL,
    audioBlob,
    duration: formatDuration(duration),
    durationSeconds: duration,
    isTranscribing,
    error,
    isSupported: isSupported(),
    startRecording,
    stopRecording,
    transcribeAudio,
    resetRecording
  };
};

export default useVoiceRecording;
