import React from 'react';
import VoiceAnalysis from '../components/VoiceAnalysis';

const Voice = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8">
      <div className="container mx-auto px-4">
        <VoiceAnalysis />
      </div>
    </div>
  );
};

export default Voice;
