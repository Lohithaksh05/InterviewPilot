import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AudioPlayer from '../components/AudioPlayer';

const AudioPlayerDebug = () => {
  const [testAudioSrc, setTestAudioSrc] = useState(null);
  const [diagnostics, setDiagnostics] = useState('');
  const audioRef = useRef(null);

  // Create a simple test audio programmatically
  const createTestBeep = () => {
    try {
      setDiagnostics('Creating test audio...\n');
      
      // Create a simple audio beep using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 2; // 2 seconds
      const numSamples = sampleRate * duration;
      
      const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Generate a 440Hz sine wave (A note)
      for (let i = 0; i < numSamples; i++) {
        channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.3;
      }
      
      // Convert to WAV format
      const length = numSamples;
      const arrayBuffer = new ArrayBuffer(44 + length * 2);
      const view = new DataView(arrayBuffer);
      
      // WAV header
      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + length * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, length * 2, true);
      
      // Convert float samples to 16-bit PCM
      let offset = 44;
      for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
      
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      setDiagnostics(prev => prev + `WAV blob created:\n- Size: ${blob.size} bytes\n- Type: ${blob.type}\n- URL: ${url.substring(0, 50)}...\n\n`);
      setTestAudioSrc(url);
      toast.success('Test audio created!');
      
    } catch (error) {
      console.error('Error creating test audio:', error);
      setDiagnostics(prev => prev + `Error creating test audio: ${error.message}\n\n`);
      toast.error('Failed to create test audio');
    }
  };

  // Test creating audio from base64 (like what we get from backend)
  const createTestFromBase64 = () => {
    try {
      setDiagnostics(prev => prev + 'Creating test from base64 simulation...\n');
      
      // Create a simple beep as base64
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = 22050; // Lower sample rate for smaller size
      const duration = 1; // 1 second
      const numSamples = sampleRate * duration;
      
      const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Generate a 800Hz sine wave
      for (let i = 0; i < numSamples; i++) {
        channelData[i] = Math.sin(2 * Math.PI * 800 * i / sampleRate) * 0.2;
      }
      
      // Convert to a simple PCM format
      const pcmData = new Int16Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        pcmData[i] = channelData[i] * 32767;
      }
      
      // Convert to base64 (simulating what backend would send)
      const uint8Array = new Uint8Array(pcmData.buffer);
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binaryString);
      
      setDiagnostics(prev => prev + `Base64 created:\n- Length: ${base64.length} chars\n- First 50 chars: ${base64.substring(0, 50)}\n\n`);
      
      // Now convert back to blob (like our AudioPlayer would do)
      const binaryStringBack = atob(base64);
      const bytes = new Uint8Array(binaryStringBack.length);
      
      for (let i = 0; i < binaryStringBack.length; i++) {
        bytes[i] = binaryStringBack.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      setDiagnostics(prev => prev + `Blob from base64:\n- Size: ${blob.size} bytes\n- Type: ${blob.type}\n- URL: ${url.substring(0, 50)}...\n\n`);
      setTestAudioSrc(url);
      toast.success('Test audio from base64 created!');
      
    } catch (error) {
      console.error('Error creating test from base64:', error);
      setDiagnostics(prev => prev + `Error creating from base64: ${error.message}\n\n`);
      toast.error('Failed to create test from base64');
    }
  };

  // Test direct HTML5 audio
  const testDirectAudio = (audioSrc) => {
    setDiagnostics(prev => prev + 'Testing direct HTML5 audio element...\n');
    
    const audio = new Audio(audioSrc);
    
    audio.onloadstart = () => setDiagnostics(prev => prev + '- loadstart event fired\n');
    audio.onloadedmetadata = () => setDiagnostics(prev => prev + `- loadedmetadata: duration=${audio.duration}\n`);
    audio.onloadeddata = () => setDiagnostics(prev => prev + `- loadeddata: readyState=${audio.readyState}\n`);
    audio.oncanplay = () => setDiagnostics(prev => prev + '- canplay event fired\n');
    audio.oncanplaythrough = () => setDiagnostics(prev => prev + '- canplaythrough event fired\n');
    audio.onerror = (e) => setDiagnostics(prev => prev + `- ERROR: ${e.message || 'Unknown error'}\n`);
    
    audio.load();
    
    setTimeout(() => {
      setDiagnostics(prev => prev + `\nFinal state after 2s:\n- readyState: ${audio.readyState}\n- networkState: ${audio.networkState}\n- duration: ${audio.duration}\n- error: ${audio.error}\n\n`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔧 AudioPlayer Debug Tool
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Control Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            
            <div className="space-y-3">
              <button
                onClick={createTestBeep}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                🎵 Create Test Audio (Direct WAV)
              </button>
              
              <button
                onClick={createTestFromBase64}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                🔄 Create Test Audio (Base64 Simulation)
              </button>
              
              {testAudioSrc && (
                <button
                  onClick={() => testDirectAudio(testAudioSrc)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  🔍 Test Direct HTML5 Audio
                </button>
              )}
              
              <button
                onClick={() => {
                  setDiagnostics('');
                  setTestAudioSrc(null);
                }}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                🗑️ Clear All
              </button>
            </div>
            
            {/* Diagnostics */}
            <div className="mt-6">
              <h3 className="font-medium mb-2">Diagnostics Log:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64 font-mono">
                {diagnostics || 'No diagnostics yet...'}
              </pre>
            </div>
          </div>

          {/* Audio Tests */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Audio Tests</h2>
            
            {testAudioSrc ? (
              <div className="space-y-6">
                {/* Direct HTML5 Audio Control */}
                <div className="border border-gray-200 rounded p-4">
                  <h3 className="font-medium mb-2">Direct HTML5 Audio:</h3>
                  <audio 
                    ref={audioRef}
                    controls 
                    src={testAudioSrc}
                    className="w-full"
                    onLoadStart={() => console.log('Direct: loadstart')}
                    onLoadedMetadata={() => console.log('Direct: loadedmetadata')}
                    onCanPlay={() => console.log('Direct: canplay')}
                    onError={(e) => console.error('Direct audio error:', e)}
                  >
                    Your browser does not support the audio element.
                  </audio>
                  <p className="text-xs text-gray-500 mt-1">
                    If this works, the audio blob is fine. If not, there's an issue with the blob creation.
                  </p>
                </div>
                
                {/* Our AudioPlayer Component */}
                <div className="border border-gray-200 rounded p-4">
                  <h3 className="font-medium mb-2">Our AudioPlayer Component:</h3>
                  <AudioPlayer 
                    audioSrc={testAudioSrc}
                    filename="test-audio.wav"
                    onError={(error) => {
                      console.error('AudioPlayer error:', error);
                      setDiagnostics(prev => prev + `AudioPlayer Error: ${error}\n`);
                      toast.error('AudioPlayer error: ' + error);
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This should show the same audio with our custom controls.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Create test audio using the buttons on the left to test the AudioPlayer component.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayerDebug;
