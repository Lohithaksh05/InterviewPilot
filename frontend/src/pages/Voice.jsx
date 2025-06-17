import React, { useState } from 'react';
import VoiceAnalysis from '../components/VoiceAnalysis';
import LiveVoiceRecorder from '../components/LiveVoiceRecorder';
import { Mic, Volume2, BarChart3, Zap, MessageSquare } from 'lucide-react';

const Voice = () => {
  const [transcript, setTranscript] = useState('');
  const [audioData, setAudioData] = useState(null);
  const [duration, setDuration] = useState(0);  const handleTranscriptionComplete = (transcriptData) => {
    console.log('Transcription completed:', transcriptData);
    
    // Handle both string and object formats
    if (typeof transcriptData === 'string') {
      setTranscript(transcriptData);
      // For now, we don't have audioData from the hook, so we'll work with transcript only
      setAudioData(null);
      setDuration(0);
      console.log('Set transcript (string format):', transcriptData);
    } else {
      setTranscript(transcriptData.transcript || '');
      setAudioData(transcriptData.audioData || null);
      // Use durationSeconds if available, otherwise use duration
      const durationInSeconds = transcriptData.durationSeconds || transcriptData.duration || 0;
      setDuration(durationInSeconds);
      console.log('Set data (object format):', {
        transcript: transcriptData.transcript || '',
        audioData: !!transcriptData.audioData,
        duration: durationInSeconds,
        originalDuration: transcriptData.duration
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="glass-morphism rounded-2xl p-8 mb-8 border border-white/10">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                  <Mic className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                🎤 Voice Analysis
              </span>
            </h1>
            
            <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Improve your communication skills with AI-powered voice analysis. 
              Get insights on your speaking pace, clarity, confidence, and receive personalized coaching tips.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6 rounded-xl border border-purple-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Volume2 className="w-6 h-6 text-purple-400" />
                <span className="text-purple-300 font-medium">Real-time Analysis</span>
              </div>
              <p className="text-gray-300 text-sm">Get instant feedback on your speaking patterns</p>
            </div>
            
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-6 rounded-xl border border-cyan-500/20">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-6 h-6 text-cyan-400" />
                <span className="text-cyan-300 font-medium">Detailed Metrics</span>
              </div>
              <p className="text-gray-300 text-sm">Track pace, clarity, confidence, and filler words</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-6 rounded-xl border border-orange-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-6 h-6 text-orange-400" />
                <span className="text-orange-300 font-medium">AI Coaching</span>
              </div>
              <p className="text-gray-300 text-sm">Personalized tips to improve your communication</p>
            </div>
          </div>
        </div>        {/* Voice Analysis Component */}
        <VoiceAnalysis 
          audioData={audioData}
          transcript={transcript}
          duration={duration}
          sessionId="voice_practice"
          questionIndex={0}
        />

        {/* Practice Section */}
        <div className="glass-morphism rounded-2xl p-8 border border-white/10">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Practice Speaking</h2>
            <p className="text-gray-300">
              Record yourself speaking and get instant voice analysis feedback
            </p>
          </div>          <LiveVoiceRecorder 
            onTranscriptionComplete={handleTranscriptionComplete}
            className="max-w-2xl mx-auto"
          />

          {/* Prompt to convert to text if recording is done but transcript not yet available */}
          {audioData && !transcript && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-300 text-center">
              Recording complete. Click <b>Convert to Text</b> to see your transcript and get instant analysis.
            </div>
          )}{transcript && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium text-white mb-2">Your Transcript:</h3>
                <p className="text-gray-300 leading-relaxed">{transcript}</p>
              </div>
              
              {duration > 0 && (
                <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-green-300">
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-medium">
                      Voice analysis is ready! Check the analysis above for insights on your speaking patterns.
                    </span>
                  </div>
                  <p className="text-sm text-green-400 mt-2">
                    Recording duration: {duration.toFixed(1)} seconds
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Voice;
