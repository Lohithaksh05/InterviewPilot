// Real Audio Transcription Service
// This service provides actual audio-to-text conversion for recorded audio blobs

class RealAudioTranscriber {
  constructor() {
    this.recognition = null;
    this.isProcessing = false;
    this.audioContext = null;
  }

  // Check browser support for required APIs
  checkBrowserSupport() {
    const support = {
      speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      audioContext: !!(window.AudioContext || window.webkitAudioContext),
      mediaRecorder: !!window.MediaRecorder,
      userMedia: !!(navigator.mediaDevices?.getUserMedia)
    };

    return {
      ...support,
      canTranscribe: support.speechRecognition,
      canProcessAudio: support.audioContext,
      fullSupport: Object.values(support).every(s => s)
    };
  }

  // Main method: Transcribe recorded audio blob to text
  async transcribe(audioBlob, options = {}) {
    return await this.transcribeRecordedAudio(audioBlob, options);
  }

  // Main transcription method with multiple fallback approaches
  async transcribeRecordedAudio(audioBlob, options = {}) {
    const browserSupport = this.checkBrowserSupport();
    
    if (!browserSupport.canTranscribe) {
      throw new Error('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
    }

    console.log('Starting real audio transcription...', {
      audioSize: audioBlob.size,
      audioType: audioBlob.type,
      duration: options.duration || 'unknown'
    });

    // Try multiple transcription methods in order of reliability
    const methods = [
      () => this.transcribeWithDirectPlayback(audioBlob, options),
      () => this.transcribeWithAudioContext(audioBlob, options),
      () => this.transcribeWithStreamProcessing(audioBlob, options)
    ];

    let lastError = null;
    
    for (const method of methods) {
      try {
        const result = await method();
        if (result && result.trim()) {
          console.log('Transcription successful:', result.substring(0, 100) + '...');
          return result;
        }
      } catch (error) {
        console.warn('Transcription method failed:', error.message);
        lastError = error;
        continue;
      }
    }

    // If all methods fail, throw the last error
    throw lastError || new Error('All transcription methods failed');
  }

  // Method 1: Direct audio playback with speech recognition
  async transcribeWithDirectPlayback(audioBlob, options = {}) {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Configure recognition for optimal results
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = options.language || 'en-US';
      this.recognition.maxAlternatives = 3;

      let finalTranscript = '';
      let processingComplete = false;
      
      // Create audio element from blob
      const audioURL = URL.createObjectURL(audioBlob);
      const audioElement = new Audio(audioURL);
      
      // Ensure audio is ready to play
      audioElement.preload = 'auto';
      audioElement.volume = 1.0;

      // Speech recognition event handlers
      this.recognition.onstart = () => {
        console.log('Speech recognition started for recorded audio');
        this.isProcessing = true;
      };

      this.recognition.onresult = (event) => {
        console.log('Recognition results received:', event.results.length);
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          }
        }
      };

      this.recognition.onend = () => {
        console.log('Recognition ended, final transcript:', finalTranscript);
        this.cleanup(audioURL, audioElement);
        
        if (!processingComplete) {
          processingComplete = true;
          const result = finalTranscript.trim();
          if (result) {
            resolve(result);
          } else {
            reject(new Error('No speech was detected in the recorded audio'));
          }
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Recognition error:', event.error);
        this.cleanup(audioURL, audioElement);
        
        if (!processingComplete) {
          processingComplete = true;
          reject(new Error(`Speech recognition failed: ${event.error}`));
        }
      };

      // Audio element event handlers
      audioElement.oncanplaythrough = () => {
        console.log('Audio ready to play, starting recognition...');
        try {
          this.recognition.start();
          audioElement.play();
        } catch (error) {
          reject(error);
        }
      };

      audioElement.onended = () => {
        console.log('Audio playback ended');
        setTimeout(() => {
          if (this.recognition && !processingComplete) {
            this.recognition.stop();
          }
        }, 2000);
      };

      audioElement.onerror = (error) => {
        console.error('Audio error:', error);
        this.cleanup(audioURL, audioElement);
        if (!processingComplete) {
          processingComplete = true;
          reject(new Error('Failed to play recorded audio'));
        }
      };

      // Set timeout as failsafe
      setTimeout(() => {
        if (!processingComplete && this.recognition) {
          this.recognition.stop();
        }
      }, 30000);

      // Load the audio
      audioElement.load();
    });
  }

  // Method 2: Audio Context-based transcription
  async transcribeWithAudioContext(audioBlob, options = {}) {
    const support = this.checkBrowserSupport();
    
    if (!support.audioContext || !support.speechRecognition) {
      throw new Error('Required APIs not supported');
    }

    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = options.language || 'en-US';

      let finalTranscript = '';
      let processingComplete = false;
      
      const audioURL = URL.createObjectURL(audioBlob);
      const audioElement = new Audio(audioURL);
      const audioContext = new AudioContext();

      // Recognition event handlers
      this.recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
      };

      this.recognition.onend = () => {
        this.cleanup(audioURL, audioElement, audioContext);
        if (!processingComplete) {
          processingComplete = true;
          const result = finalTranscript.trim();
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Audio Context method did not detect speech'));
          }
        }
      };

      this.recognition.onerror = (event) => {
        this.cleanup(audioURL, audioElement, audioContext);
        if (!processingComplete) {
          processingComplete = true;
          reject(new Error(`Audio Context transcription failed: ${event.error}`));
        }
      };

      // Set up audio processing
      audioElement.oncanplaythrough = async () => {
        try {
          const source = audioContext.createMediaElementSource(audioElement);
          const gainNode = audioContext.createGain();
          
          source.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Boost audio for better recognition
          gainNode.gain.value = 2.0;
          
          this.recognition.start();
          await audioElement.play();
          
        } catch (error) {
          reject(error);
        }
      };

      audioElement.onended = () => {
        setTimeout(() => {
          if (this.recognition && !processingComplete) {
            this.recognition.stop();
          }
        }, 1000);
      };

      audioElement.load();
    });
  }

  // Method 3: Stream-based processing
  async transcribeWithStreamProcessing(audioBlob, options = {}) {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = options.language || 'en-US';

      let finalTranscript = '';
      let interimTranscript = '';
      
      const audioURL = URL.createObjectURL(audioBlob);
      const audioElement = new Audio(audioURL);
      
      this.recognition.onresult = (event) => {
        let newInterim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            newInterim += transcript;
          }
        }
        interimTranscript = newInterim;
        console.log('Streaming transcription:', { final: finalTranscript, interim: interimTranscript });
      };

      this.recognition.onend = () => {
        this.cleanup(audioURL, audioElement);
        const result = finalTranscript.trim();
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Stream processing did not detect any speech'));
        }
      };

      this.recognition.onerror = (event) => {
        this.cleanup(audioURL, audioElement);
        reject(new Error(`Stream processing failed: ${event.error}`));
      };

      // Start recognition and play audio
      audioElement.oncanplaythrough = () => {
        this.recognition.start();
        audioElement.play().catch(reject);
      };

      audioElement.onended = () => {
        setTimeout(() => this.recognition.stop(), 1000);
      };

      audioElement.load();
    });
  }

  // Cleanup resources
  cleanup(audioURL, audioElement, audioContext) {
    this.isProcessing = false;
    
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }
    
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close().catch(console.error);
    }
    
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (error) {
        console.debug('Recognition abort error (expected):', error.message);
      }
      this.recognition = null;
    }
  }

  // Stop current transcription
  stop() {
    if (this.recognition && this.isProcessing) {
      this.recognition.stop();
    }
  }

  // Get detailed browser capability information
  getBrowserCapabilities() {
    const support = this.checkBrowserSupport();
    const userAgent = navigator.userAgent;
    
    let browserName = 'Unknown';
    if (userAgent.includes('Chrome')) browserName = 'Chrome';
    else if (userAgent.includes('Firefox')) browserName = 'Firefox';
    else if (userAgent.includes('Safari')) browserName = 'Safari';
    else if (userAgent.includes('Edge')) browserName = 'Edge';

    return {
      browser: browserName,
      support,
      recommendations: {
        bestFor: 'Chrome or Edge for optimal speech recognition',
        alternatives: 'Safari also supports speech recognition',
        unsupported: 'Firefox does not support Web Speech API'
      }
    };
  }
}

export default RealAudioTranscriber;
