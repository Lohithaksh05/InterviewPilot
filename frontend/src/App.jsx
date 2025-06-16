import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Interview from './pages/Interview';
import InterviewSession from './pages/InterviewSession';
import Results from './pages/Results';
import ResultsDebug from './pages/ResultsDebug';
import Dashboard from './pages/Dashboard';
import Templates from './pages/Templates';
// import EnhancedTemplates from './pages/EnhancedTemplates';

import Voice from './pages/Voice';
import Test from './pages/Test';
import ConnectionTest from './pages/ConnectionTest';

function AppContent() {
  const location = useLocation();
  const hideNavbarRoutes = ['/', '/login', '/signup'];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-900">
      {!shouldHideNavbar && <Navbar />}
      <main>
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
            } />            <Route path="/results/:sessionId" element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            } />
            <Route path="/results-debug/:sessionId" element={
              <ProtectedRoute>
                <ResultsDebug />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />            <Route path="/templates" element={
              <ProtectedRoute>
                <Templates />
              </ProtectedRoute>
            } />
            {/* <Route path="/enhanced-templates" element={
              <ProtectedRoute>
                <EnhancedTemplates />
              </ProtectedRoute>
            } /> */}<Route path="/voice-analysis" element={
              <ProtectedRoute>
                <Voice />
              </ProtectedRoute>
            } />            <Route path="/test" element={<Test />} />
            <Route path="/connection-test" element={<ConnectionTest />} />
            {/* Demo/Test Routes */}
          </Routes>
        </main>        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 2000,
            style: {
              background: 'rgba(17, 24, 39, 0.95)',
              color: '#f9fafb',
              border: '1px solid rgba(75, 85, 99, 0.3)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            },
            success: {
              style: {
                background: 'rgba(5, 46, 22, 0.95)',
                color: '#dcfce7',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              },
            },
            error: {
              style: {
                background: 'rgba(69, 10, 10, 0.95)',
                color: '#fecaca',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              },
            },
          }}
        />
      </div>
    );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
