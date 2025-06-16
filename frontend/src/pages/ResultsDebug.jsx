import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ResultsDebug = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState({
    sessionId,
    timestamp: new Date().toISOString(),
    componentMounted: false
  });

  useEffect(() => {
    console.log('ResultsDebug mounted with sessionId:', sessionId);
    setDebugInfo(prev => ({
      ...prev,
      componentMounted: true
    }));
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Results Debug Page</h1>
          <p className="text-gray-300">Testing Results page functionality</p>
        </div>

        {/* Debug Info */}
        <div className="space-y-6">
          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-bold text-green-400 mb-4">✅ Component Status</h2>
            <div className="space-y-2 text-gray-300">
              <p><strong>Session ID:</strong> {debugInfo.sessionId || 'Not provided'}</p>
              <p><strong>Component Mounted:</strong> {debugInfo.componentMounted ? 'Yes' : 'No'}</p>
              <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
            </div>
          </div>

          {sessionId ? (
            <div className="bg-blue-500/10 rounded-lg p-6 border border-blue-400/30">
              <h2 className="text-xl font-bold text-blue-400 mb-4">🔍 Session Info</h2>
              <p className="text-gray-300">Session ID found: <code className="bg-gray-800 px-2 py-1 rounded">{sessionId}</code></p>
              <p className="text-gray-300 mt-2">This would normally fetch interview results from the backend.</p>
            </div>
          ) : (
            <div className="bg-red-500/10 rounded-lg p-6 border border-red-400/30">
              <h2 className="text-xl font-bold text-red-400 mb-4">❌ No Session ID</h2>
              <p className="text-gray-300">No session ID provided in the URL parameters.</p>
              <p className="text-gray-300 mt-2">URL should be: <code className="bg-gray-800 px-2 py-1 rounded">/results/your-session-id</code></p>
            </div>
          )}

          {/* Navigation Links */}
          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-bold text-purple-400 mb-4">🔗 Navigation</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard" className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded hover:bg-cyan-500/30">Dashboard</Link>
              <Link to="/interview" className="px-4 py-2 bg-green-500/20 text-green-300 rounded hover:bg-green-500/30">New Interview</Link>
              <Link to="/test" className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30">Test Page</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDebug;
