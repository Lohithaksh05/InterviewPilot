import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Interview from './pages/Interview';
import InterviewSession from './pages/InterviewSession';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import FormDemo from './pages/FormDemo';
import VoiceRecordingDemo from './pages/VoiceRecordingDemo';
import VoiceTranscriptionTest from './pages/VoiceTranscriptionTest';
import SimplifiedVoiceDemo from './pages/SimplifiedVoiceDemo';
import RecordingTest from './pages/RecordingTest';
import RecordingResultsTest from './pages/RecordingResultsTest';
import AudioPlayerDebug from './pages/AudioPlayerDebug';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/interview" element={
              <ProtectedRoute>
                <Interview />
              </ProtectedRoute>
            } />
            <Route path="/interview/:sessionId" element={
              <ProtectedRoute>
                <InterviewSession />
              </ProtectedRoute>
            } />
            <Route path="/results/:sessionId" element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              border: '1px solid #e5e7eb',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
