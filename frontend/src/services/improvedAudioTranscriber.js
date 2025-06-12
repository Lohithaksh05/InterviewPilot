// Improved Audio Transcription Service
// This service provides a better approach for transcribing recorded audio

class ImprovedAudioTranscriber {
  constructor() {
    this.recognition = null;
    this.isProcessing = false;
    this.abortController = null;
  }

  // Check browser support
  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  // Main transcription method
  async transcribe(audioBlob, options = {}) {
    if (!this.isSupported()) {
      throw new Error('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
    }

    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('No audio data to transcribe');
    }

    console.log('Starting audio transcription...', {
      size: audioBlob.size,
      type: audioBlob.type
    });

    // Try the improved playback method
    try {
      return await this.transcribeWithSyncedPlayback(audioBlob, options);
    } catch (error) {
      console.error('Transcription failed:', error);
      
      // Provide helpful error messages based on the error type
      if (error.message.includes('not-allowed')) {
        throw new Error('Microphone permission denied. Please allow microphone access and try again.');
      } else if (error.message.includes('network')) {
        throw new Error('Network error occurred during transcription. Please check your connection.');
      } else if (error.message.includes('no-speech')) {
        throw new Error('No speech detected in the recording. Please speak louder and try again.');
      } else {
        throw new Error('Unable to transcribe audio. Try using live speech recognition instead.');
      }
    }
  }

  // Improved transcription method with better synchronization
  async transcribeWithSyncedPlayback(audioBlob, options = {}) {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.abortController = new AbortController();
      
      // Configure recognition
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = options.language || 'en-US';
      this.recognition.maxAlternatives = 3;

      let finalTranscript = '';
      let interimTranscript = '';
      let hasStarted = false;
      let hasEnded = false;
      
      // Create audio element
      const audioURL = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioURL);
      audio.volume = 1.0;
      audio.preload = 'auto';

      // Cleanup function
      const cleanup = () => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        if (audioURL) {
          URL.revokeObjectURL(audioURL);
        }        if (this.recognition && hasStarted && !hasEnded) {
          try {
            this.recognition.stop();
          } catch (error) {
            // Ignore errors when stopping
            console.warn('Error stopping recognition:', error);
          }
        }
        this.isProcessing = false;
      };

      // Set up abort signal
      this.abortController.signal.addEventListener('abort', () => {
        cleanup();
        reject(new Error('Transcription was cancelled'));
      });

      // Speech recognition events
      this.recognition.onstart = () => {
        console.log('Speech recognition started');
        hasStarted = true;
        this.isProcessing = true;
      };

      this.recognition.onresult = (event) => {
        interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        console.log('Recognition result:', {
          final: finalTranscript,
          interim: interimTranscript
        });
      };

      this.recognition.onend = () => {
        console.log('Speech recognition ended');
        hasEnded = true;
        cleanup();
        
        const result = finalTranscript.trim();
        if (result) {
          resolve(result);
        } else {
          reject(new Error('No speech was detected in the recording. Please ensure you spoke clearly during recording.'));
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        hasEnded = true;
        cleanup();
        
        switch (event.error) {
          case 'not-allowed':
            reject(new Error('Microphone permission denied'));
            break;
          case 'no-speech':
            reject(new Error('No speech detected in audio'));
            break;
          case 'audio-capture':
            reject(new Error('Audio capture failed'));
            break;
          case 'network':
            reject(new Error('Network error during transcription'));
            break;
          default:
            reject(new Error(`Speech recognition error: ${event.error}`));
        }
      };

      // Audio events
      audio.oncanplaythrough = () => {
        console.log('Audio ready, starting transcription...');
        
        // Start recognition first, then play audio
        try {
          this.recognition.start();
          
          // Small delay to ensure recognition is active
          setTimeout(() => {
            audio.play().catch(error => {
              console.error('Audio play error:', error);
              cleanup();
              reject(new Error('Failed to play recorded audio'));
            });
          }, 100);
          
        } catch (error) {
          console.error('Recognition start error:', error);
          cleanup();
          reject(new Error('Failed to start speech recognition'));
        }
      };      audio.onended = () => {
        console.log('Audio playback finished');
        
        // Give recognition time to process final audio
        setTimeout(() => {
          if (this.recognition && hasStarted && !hasEnded) {
            try {
              this.recognition.stop();
            } catch (error) {
              // Ignore errors when stopping
              console.warn('Error stopping recognition:', error);
            }
          }
        }, 1500); // Increased delay for better results
      };

      audio.onerror = (error) => {
        console.error('Audio error:', error);
        cleanup();
        reject(new Error('Failed to play audio for transcription'));
      };

      audio.onloadedmetadata = () => {
        console.log('Audio metadata loaded, duration:', audio.duration);
      };

      // Timeout failsafe
      const timeoutMs = Math.max(30000, (audio.duration || 10) * 1000 + 10000);
      setTimeout(() => {
        if (this.isProcessing && !hasEnded) {
          console.log('Transcription timeout');
          cleanup();
          reject(new Error('Transcription timed out. Please try with a shorter recording.'));
        }
      }, timeoutMs);

      // Start loading audio
      audio.load();
    });
  }

  // Stop ongoing transcription
  stop() {
    if (this.abortController) {
      this.abortController.abort();
    }
      if (this.recognition && this.isProcessing) {
      try {
        this.recognition.stop();
      } catch (error) {
        // Ignore errors when stopping
        console.warn('Error stopping recognition:', error);
      }
    }
    
    this.isProcessing = false;
  }

  // Clean up resources
  cleanup() {
    this.stop();
    this.recognition = null;
    this.abortController = null;
  }
}

export default ImprovedAudioTranscriber;
