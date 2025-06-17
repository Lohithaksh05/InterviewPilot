import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

const useLiveVoiceRecording = ({ onTranscriptionComplete, onRecordingStop }) => {  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // Check browser support
  const isSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  };

  const isSpeechRecognitionSupported = () => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  };

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    if (!isSpeechRecognitionSupported()) {
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          finalTranscriptRef.current = finalTranscript;
        } else {
          interimTranscript += transcript;
        }
      }

      const displayTranscript = finalTranscript + interimTranscript;
      setLiveTranscript(displayTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied for speech recognition');
        toast.error('Please allow microphone access for speech recognition');
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
    };

    return recognition;
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording with live transcription
  const startRecording = async () => {
    if (!isSupported()) {
      setError('Voice recording is not supported in this browser');
      toast.error('Voice recording is not supported in this browser');
      return;
    }

    try {
      setError(null);
      finalTranscriptRef.current = '';
      setLiveTranscript('');
      
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
      
      // Set up MediaRecorder
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
        setAudioBlob(audioBlob);
        
        const audioURL = URL.createObjectURL(audioBlob);
        setAudioURL(audioURL);
        
        // Stop the stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Stop speech recognition
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (error) {
            console.warn('Error stopping speech recognition:', error);
          }
        }
        
        // Calculate final duration
        const finalDuration = Date.now() - startTimeRef.current;
        const finalDurationSeconds = finalDuration / 1000;
        setDuration(formatDuration(finalDurationSeconds));
        setDurationSeconds(finalDurationSeconds);
        
        // Call callback with the live transcript
        if (onRecordingStop) {
          onRecordingStop(audioBlob, finalDurationSeconds);
        }
        
        setIsRecording(false);
        
        // If we have a live transcript, automatically trigger the completion
        const transcript = finalTranscriptRef.current.trim();
        if (transcript && onTranscriptionComplete) {
          onTranscriptionComplete({
            transcript: transcript,
            audioData: audioBlob,
            duration: finalDurationSeconds,
            durationSeconds: finalDurationSeconds
          });
        }
      };
      
      // Start recording
      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      // Start timer
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setDuration(formatDuration(elapsed));
        setDurationSeconds(elapsed);
      }, 100);
      
      // Start speech recognition if supported
      if (isSpeechRecognitionSupported()) {
        recognitionRef.current = initializeSpeechRecognition();
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.warn('Could not start speech recognition:', error);
          }
        }
      }
      
      toast.success('Recording started with live transcription');
      
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
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast.success('Recording stopped');
    }
  };

  // Manual transcription (for cases where live transcription didn't work)
  const transcribeAudio = async () => {
    const transcript = finalTranscriptRef.current.trim();
    
    if (transcript) {
      // We already have the transcript from live recognition
      if (onTranscriptionComplete) {
        onTranscriptionComplete({
          transcript: transcript,
          audioData: audioBlob,
          duration: durationSeconds,
          durationSeconds: durationSeconds
        });
      }
      toast.success('Transcript ready!');
    } else {
      // No live transcript available
      toast.error('No speech was detected during recording. Please try speaking more clearly.');
    }
  };

  // Reset recording
  const resetRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    
    setAudioURL(null);
    setAudioBlob(null);
    setDuration(0);
    setDurationSeconds(0);
    setError(null);
    setLiveTranscript('');
    finalTranscriptRef.current = '';
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.warn('Error stopping recognition during reset:', error);
      }
      recognitionRef.current = null;
    }
  };
  // Cleanup on unmount
  useEffect(() => {
    const cleanup = () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.warn('Error stopping recognition during cleanup:', error);
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
    
    return cleanup;
  }, [audioURL]);
  return {
    isRecording,
    audioURL,
    audioBlob,
    duration,
    durationSeconds,
    error,
    liveTranscript,
    isSupported: isSupported(),
    isSpeechRecognitionSupported: isSpeechRecognitionSupported(),
    startRecording,
    stopRecording,
    transcribeAudio,
    resetRecording
  };
};

export default useLiveVoiceRecording;
