// Speech-to-Text Service using Web Speech API and fallback transcription
class SpeechToTextService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResult = null;
    this.onError = null;
    this.onEnd = null;
  }

  // Check if browser supports Web Speech API
  isSupported() {
    return !!(
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition
    );
  }

  // Initialize speech recognition
  initialize() {
    if (!this.isSupported()) {
      throw new Error('Speech recognition is not supported in this browser');
    }

    const SpeechRecognition = 
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;

    this.recognition = new SpeechRecognition();
    
    // Configure recognition settings
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Set up event handlers
    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (this.onResult) {
        this.onResult({
          final: finalTranscript,
          interim: interimTranscript,
          isFinal: finalTranscript.length > 0
        });
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (this.onError) {
        this.onError(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) {
        this.onEnd();
      }
    };

    this.recognition.onstart = () => {
      this.isListening = true;
    };
  }

  // Start listening
  startListening(callbacks = {}) {
    if (this.isListening) {
      return Promise.reject(new Error('Already listening'));
    }

    this.onResult = callbacks.onResult;
    this.onError = callbacks.onError;
    this.onEnd = callbacks.onEnd;

    try {
      if (!this.recognition) {
        this.initialize();
      }
      
      this.recognition.start();
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Stop listening
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // Abort listening
  abort() {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  // Clean up
  cleanup() {
    if (this.recognition) {
      this.abort();
      this.recognition = null;
    }
    this.onResult = null;
    this.onError = null;
    this.onEnd = null;
  }
}

// Fallback transcription using mock API (for demonstration)
class MockTranscriptionService {  static async transcribeAudio(audioBlob) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Log audio blob info for debugging
    console.log('Transcribing audio blob:', {
      size: audioBlob.size,
      type: audioBlob.type
    });
    
    // Generate mock transcription based on audio duration
    const mockResponses = [
      "I believe my greatest strength is my ability to work well in team environments. Throughout my career, I've consistently demonstrated strong collaboration skills and have been able to contribute effectively to cross-functional projects.",
      
      "In my previous role as a software developer, I successfully led a project to optimize our application's performance, which resulted in a 40% improvement in load times and significantly enhanced user experience.",
      
      "When faced with challenging problems, I take a systematic approach. I start by breaking down the problem into smaller, manageable components, research potential solutions, and then implement the most effective approach while keeping stakeholders informed throughout the process.",
      
      "I'm particularly interested in this position because it aligns perfectly with my career goals and allows me to leverage my expertise in full-stack development while working with cutting-edge technologies in a collaborative environment.",
      
      "One of my most significant achievements was implementing an automated testing framework that reduced our bug detection time by 60% and improved overall code quality across multiple development teams.",
    ];
    
    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
  }
}

export { SpeechToTextService, MockTranscriptionService };
