import React from 'react';

const Test = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="text-center space-y-6">        <h1 className="text-4xl font-bold text-white">InterviewPilot Test Page</h1>
        <p className="text-gray-300">If you can see this, the frontend is working!</p>
        <div className="p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
          <p className="text-green-300 font-semibold">✅ JSX Structure Fixed!</p>
          <p className="text-green-200 text-sm">Results page JSX errors have been resolved</p>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-white/10 rounded-lg border border-white/20">
            <h2 className="text-xl font-semibold text-cyan-400">✅ Frontend: Running</h2>
            <p className="text-gray-300">React app loaded successfully</p>
          </div>
          <div className="p-4 bg-white/10 rounded-lg border border-white/20">
            <h2 className="text-xl font-semibold text-green-400">🔗 Navigation Links</h2>            <div className="flex flex-wrap gap-2 mt-2">
              <a href="/" className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded">Home</a>
              <a href="/login" className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded">Login</a>
              <a href="/signup" className="px-3 py-1 bg-green-500/20 text-green-300 rounded">Signup</a>
              <a href="/dashboard" className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded">Dashboard</a>              <a href="/templates" className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded">Templates</a>
              <a href="/voice-analysis" className="px-3 py-1 bg-red-500/20 text-red-300 rounded">Voice</a><a href="/results/test-session" className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded">Results Test</a>
              <a href="/results-debug/test-session" className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded">Results Debug</a>
              <a href="/connection-test" className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded">Connection Test</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
