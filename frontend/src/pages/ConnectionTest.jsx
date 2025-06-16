import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const ConnectionTest = () => {
  const [apiStatus, setApiStatus] = useState('checking');
  const [apiUrl, setApiUrl] = useState('');
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    testApiConnection();
  }, []);

  const testApiConnection = async () => {
    try {
      setApiStatus('checking');
      
      // Get the API URL from environment
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      setApiUrl(baseUrl);
      
      console.log('Testing API connection to:', baseUrl);
      
      // Test direct health endpoint (without /api prefix)
      const healthUrl = baseUrl.replace('/api', '') + '/health';
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        setApiStatus('connected');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('API Connection Error:', error);
      setApiStatus('failed');
      setErrorDetails(error.message);
    }
  };

  const getStatusIcon = () => {
    switch (apiStatus) {
      case 'checking':
        return <Loader className="h-6 w-6 text-blue-400 animate-spin" />;
      case 'connected':
        return <CheckCircle className="h-6 w-6 text-green-400" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-400" />;
      default:
        return <Loader className="h-6 w-6 text-blue-400 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (apiStatus) {
      case 'checking':
        return 'Testing connection...';
      case 'connected':
        return 'Connected successfully!';
      case 'failed':
        return 'Connection failed';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'checking':
        return 'text-blue-400';
      case 'connected':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/test" 
            className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 mb-4"
          >
            <span>← Back to Test</span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">API Connection Test</h1>
          <p className="text-gray-300">Testing connection between frontend and backend</p>
        </div>

        {/* API Configuration */}
        <div className="space-y-6">
          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">API Configuration</h2>
            <div className="space-y-2 text-gray-300">
              <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
              <p><strong>API Base URL:</strong> <code className="bg-gray-800 px-2 py-1 rounded">{apiUrl}</code></p>
              <p><strong>Frontend URL:</strong> <code className="bg-gray-800 px-2 py-1 rounded">http://localhost:5173</code></p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Connection Status</h2>
            <div className="flex items-center space-x-3 mb-4">
              {getStatusIcon()}
              <span className={`text-lg font-semibold ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            
            {errorDetails && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
                <h3 className="text-red-400 font-semibold mb-2">Error Details:</h3>
                <p className="text-red-300 font-mono text-sm">{errorDetails}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={testApiConnection}
                className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 transition-colors"
              >
                Retry Connection
              </button>
              <a
                href={apiUrl.replace('/api', '') + '/health'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-500/20 text-green-300 rounded hover:bg-green-500/30 transition-colors"
              >
                Open Health Endpoint
              </a>
              <a
                href={apiUrl.replace('/api', '') + '/docs'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30 transition-colors"
              >
                Open API Docs
              </a>
            </div>
          </div>

          {/* Next Steps */}
          {apiStatus === 'connected' && (
            <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-6">
              <h2 className="text-green-400 font-bold text-xl mb-4">✅ Connection Successful!</h2>
              <p className="text-green-300 mb-4">
                The frontend is successfully connected to the local backend. You can now test the full application.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link 
                  to="/results/test-session"
                  className="px-4 py-2 bg-green-500/20 text-green-300 rounded hover:bg-green-500/30 transition-colors"
                >
                  Test Results Page
                </Link>
                <Link 
                  to="/login"
                  className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded hover:bg-cyan-500/30 transition-colors"
                >
                  Test Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionTest;
