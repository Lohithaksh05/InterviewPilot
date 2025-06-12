import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

console.log('API Base URL:', API_BASE_URL);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to:`, config.url);
    
    // Add authorization header if token exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error);
      // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear stored auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Trigger auth state change event for Navbar
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.detail || error.response.data?.message || 'Server error';
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - please check your connection');
    } else {
      // Something else happened
      throw new Error(error.message || 'Unknown error occurred');
    }
  }
);

// Authentication API
export const authAPI = {
  // Login user
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  // Register user
  signup: async (userData) => {
    const response = await apiClient.post('/auth/signup', userData);
    return response.data;
  },

  // Get current user info
  me: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Refresh token
  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh-token');
    return response.data;
  },
  // Logout (clear local storage)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Trigger auth state change event for Navbar
    window.dispatchEvent(new CustomEvent('authStateChanged'));
  }
};

// Resume API
export const resumeAPI = {
  // Upload resume file
  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Parse resume text
  parseResumeText: async (text) => {
    const response = await apiClient.post('/resume/parse-text', { text });
    return response.data;
  },
};

// Interview API
export const interviewAPI = {
  // Start new interview session
  startInterview: async ({ interviewer_type, job_description, resume_text, num_questions = 5 }) => {
    const response = await apiClient.post('/interview/start', {
      interviewer_type,
      job_description,
      resume_text,
      num_questions,
    });
    return response.data;
  },

  // Get interview session details
  getSession: async (sessionId) => {
    const response = await apiClient.get(`/interview/session/${sessionId}`);
    return response.data;
  },

  // Submit answer to a question
  submitAnswer: async ({ session_id, answer }) => {
    const response = await apiClient.post('/interview/answer', {
      session_id,
      answer,
    });
    return response.data;
  },

  // Get interview summary
  getSummary: async (sessionId) => {
    const response = await apiClient.get(`/interview/summary/${sessionId}`);
    return response.data;
  },

  // List all interview sessions
  listSessions: async () => {
    const response = await apiClient.get('/interview/sessions');
    return response.data;
  },

  // Delete interview session
  deleteSession: async (sessionId) => {
    const response = await apiClient.delete(`/interview/session/${sessionId}`);
    return response.data;
  },

  // Save audio recording
  saveRecording: async (recordingData) => {
    const response = await apiClient.post('/interview/save-recording', recordingData);
    return response.data;
  },

  // Get session recordings
  getSessionRecordings: async (sessionId) => {
    const response = await apiClient.get(`/interview/recordings/${sessionId}`);
    return response.data;
  },

  // Get specific recording (including audio data)
  getRecording: async (recordingId) => {
    const response = await apiClient.get(`/interview/recording/${recordingId}`);
    return response.data;
  },
};

// Agents API
export const agentsAPI = {
  // Get all interviewer types
  getInterviewerTypes: async () => {
    const response = await apiClient.get('/agents/types');
    return response.data;
  },

  // Get all difficulty levels
  getDifficultyLevels: async () => {
    const response = await apiClient.get('/agents/difficulty-levels');
    return response.data;
  },

  // Generate questions for specific interviewer type
  generateQuestions: async ({ interviewer_type, difficulty = 'medium', resume_text, job_description, num_questions = 5 }) => {
    const response = await apiClient.post('/agents/questions', {
      interviewer_type,
      difficulty,
      resume_text,
      job_description,
      num_questions,
    });
    return response.data;
  },

  // Evaluate an answer
  evaluateAnswer: async ({ interviewer_type, question, answer, job_description }) => {
    const response = await apiClient.post('/agents/evaluate', {
      interviewer_type,
      question,
      answer,
      job_description,
    });
    return response.data;
  },

  // Generate follow-up question
  generateFollowUp: async ({ interviewer_type, original_question, answer }) => {
    const response = await apiClient.post('/agents/follow-up', {
      interviewer_type,
      original_question,
      answer,
    });
    return response.data;
  },
};

// Health check
export const healthAPI = {
  checkHealth: async () => {
    const response = await apiClient.get('/health', {
      baseURL: 'http://localhost:8000', // Direct to root endpoint
    });
    return response.data;
  },
};

// Main API object
const api = {
  auth: authAPI,
  resume: resumeAPI,
  interview: interviewAPI,
  agents: agentsAPI,
  health: healthAPI,
  // Direct access to axios methods for backward compatibility
  get: apiClient.get,
  post: apiClient.post,
  put: apiClient.put,
  delete: apiClient.delete,
  patch: apiClient.patch,
};

export default api;
