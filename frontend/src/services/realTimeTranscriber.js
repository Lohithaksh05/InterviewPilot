// Enhanced audio transcription with multiple approaches
class RealTimeAudioTranscriber {
  constructor() {
    this.recognition = null;
    this.isTranscribing = false;
  }

  // Check comprehensive browser support
  checkSupport() {
    const hasMediaRecorder = !!(window.MediaRecorder);
    const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const hasAudioContext = !!(window.AudioContext || window.webkitAudioContext);
    const hasUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    return {
      mediaRecorder: hasMediaRecorder,
      speechRecognition: hasSpeechRecognition,
      audioContext: hasAudioContext,
      userMedia: hasUserMedia,
      fullSupport: hasMediaRecorder && hasSpeechRecognition && hasAudioContext && hasUserMedia
    };
  }

  // Method 1: Direct audio blob transcription using audio playback
  async transcribeAudioBlob(audioBlob, options = {}) {
    const support = this.checkSupport();
    
    if (!support.speechRecognition) {
      throw new Error('Speech recognition is not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = options.language || 'en-US';
        this.recognition.maxAlternatives = 1;

        let transcription = '';
        let isCompleted = false;
        
        // Create audio URL and element
        const audioURL = URL.createObjectURL(audioBlob);
        const audioElement = new Audio(audioURL);
        
        // Set up recognition events
        this.recognition.onresult = (event) => {
          let newTranscription = '';
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              newTranscription += event.results[i][0].transcript + ' ';
            }
          }
          transcription = newTranscription.trim();
        };

        this.recognition.onerror = (event) => {
          console.error('Recognition error:', event.error);
          this.cleanup(audioURL, audioElement);
          if (!isCompleted) {
            isCompleted = true;
            reject(new Error(`Speech recognition failed: ${event.error}`));
          }
        };

        this.recognition.onend = () => {
          this.cleanup(audioURL, audioElement);
          if (!isCompleted) {
            isCompleted = true;
            if (transcription.trim()) {
              resolve(transcription);
            } else {
              resolve('No clear speech detected in the recording. Please try speaking more clearly or use live speech recognition.');
            }
          }
        };

        // Start recognition first, then play audio
        this.recognition.start();
        this.isTranscribing = true;

        // Configure audio playback
        audioElement.oncanplaythrough = () => {
          audioElement.play().catch(error => {
            console.error('Audio play error:', error);
            this.recognition.stop();
          });
        };

        audioElement.onended = () => {
          // Give recognition a moment to process final results
          setTimeout(() => {
            if (this.recognition && this.isTranscribing) {
              this.recognition.stop();
            }
          }, 1000);
        };

        audioElement.onerror = (error) => {
          console.error('Audio error:', error);
          this.cleanup(audioURL, audioElement);
          if (!isCompleted) {
            isCompleted = true;
            reject(new Error('Failed to play recorded audio'));
          }
        };

        // Fallback timeout
        setTimeout(() => {
          if (!isCompleted && this.isTranscribing) {
            this.recognition.stop();
          }
        }, 30000); // 30 second timeout

      } catch (error) {
        reject(error);
      }
    });
  }

  // Method 2: Convert audio to different format for better compatibility
  async convertAndTranscribe(audioBlob, options = {}) {
    try {
      // First, try direct transcription
      return await this.transcribeAudioBlob(audioBlob, options);
    } catch (error) {
      console.warn('Direct transcription failed, trying audio conversion:', error);
      
      // Try converting to a different format
      try {
        const convertedBlob = await this.convertAudioFormat(audioBlob);
        return await this.transcribeAudioBlob(convertedBlob, options);
      } catch (conversionError) {
        console.error('Audio conversion failed:', conversionError);
        throw new Error('Unable to transcribe audio. Browser compatibility issue.');
      }
    }
  }
  // Method 3: Live transcription during playback with better audio processing
  async transcribeWithAudioContext(audioBlob, options = {}) {
    const support = this.checkSupport();
    
    if (!support.audioContext || !support.speechRecognition) {
      throw new Error('Required APIs not supported');
    }

    return new Promise((resolve, reject) => {
      this.performAudioContextTranscription(audioBlob, options, resolve, reject);
    });
  }

  // Helper method for audio context transcription
  async performAudioContextTranscription(audioBlob, options, resolve, reject) {
    let audioContext = null;
    let audioURL = null;
    
    try {
      // Create audio context
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioURL = URL.createObjectURL(audioBlob);
      
      // Fetch and decode audio data
      const response = await fetch(audioURL);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Set up speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = options.language || 'en-US';

      let transcription = '';
      let isCompleted = false;

      this.recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcription += event.results[i][0].transcript + ' ';
          }
        }
      };

      this.recognition.onerror = (event) => {
        this.cleanup(audioURL, null, audioContext);
        if (!isCompleted) {
          isCompleted = true;
          reject(new Error(`Recognition error: ${event.error}`));
        }
      };

      this.recognition.onend = () => {
        this.cleanup(audioURL, null, audioContext);
        if (!isCompleted) {
          isCompleted = true;
          resolve(transcription.trim() || 'No speech detected');
        }
      };

      // Create audio source and play
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Connect to destination with very low volume
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.01; // Very quiet
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Start recognition then play audio
      this.recognition.start();
      source.start(0);

      // Stop recognition when audio ends
      source.onended = () => {
        setTimeout(() => {
          if (this.recognition && !isCompleted) {
            this.recognition.stop();
          }
        }, 1000);
      };

    } catch (error) {
      this.cleanup(audioURL, null, audioContext);
      reject(error);
    }
  }

  // Convert audio to a more compatible format
  async convertAudioFormat(audioBlob) {
    return new Promise((resolve, reject) => {
      const audioURL = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioURL);
      
      audio.onloadeddata = () => {
        // For now, return the original blob
        // In a more advanced implementation, you could use Web Audio API to convert
        URL.revokeObjectURL(audioURL);
        resolve(audioBlob);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioURL);
        reject(new Error('Failed to load audio for conversion'));
      };
    });
  }

  // Main transcription method with multiple fallbacks
  async transcribe(audioBlob, options = {}) {
    const methods = [
      { name: 'Audio Context Method', fn: () => this.transcribeWithAudioContext(audioBlob, options) },
      { name: 'Direct Transcription', fn: () => this.transcribeAudioBlob(audioBlob, options) },
      { name: 'Convert and Transcribe', fn: () => this.convertAndTranscribe(audioBlob, options) }
    ];

    let lastError = null;

    for (const method of methods) {
      try {
        console.log(`Trying transcription method: ${method.name}`);
        const result = await method.fn();
        if (result && result.trim()) {
          console.log(`Success with method: ${method.name}`);
          return result;
        }
      } catch (error) {
        console.warn(`Method ${method.name} failed:`, error);
        lastError = error;
        continue;
      }
    }

    // If all methods fail, provide a helpful fallback
    throw new Error(lastError?.message || 'All transcription methods failed. Please try live speech recognition instead.');
  }

  // Cleanup resources
  cleanup(audioURL, audioElement, audioContext) {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }
    this.isTranscribing = false;
  }

  // Stop current transcription
  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.isTranscribing = false;
  }
}

export default RealTimeAudioTranscriber;
