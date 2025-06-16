import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EnhancedInterviewTemplates from '../components/EnhancedInterviewTemplates';
import { Button } from '../components/ui/button';
import { ArrowRight, Settings, Play, FileText } from 'lucide-react';

const Templates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const navigate = useNavigate();

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleStartInterview = () => {
    if (selectedTemplate) {
      // Navigate to interview page with selected template
      navigate('/interview', { 
        state: { 
          selectedTemplate: selectedTemplate,
          useTemplate: true 
        } 
      });
    }
  };

  const handleCustomizeTemplate = () => {
    setShowCustomization(true);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb bg-gradient-to-r from-cyan-400/20 to-purple-500/20 w-72 h-72 -top-36 -left-36"></div>
        <div className="floating-orb bg-gradient-to-r from-purple-500/20 to-pink-500/20 w-96 h-96 -top-48 -right-48 animation-delay-2000"></div>
        <div className="floating-orb bg-gradient-to-r from-blue-500/20 to-cyan-400/20 w-64 h-64 bottom-0 left-1/4 animation-delay-4000"></div>
        <div className="floating-orb bg-gradient-to-r from-pink-500/20 to-purple-500/20 w-80 h-80 bottom-0 right-0 animation-delay-6000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in-up">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x flex items-center">
              <FileText className="h-10 w-10 mr-4 text-cyan-400 animate-pulse" />
              Interview Templates
            </h1>
            <p className="text-gray-300 text-lg font-medium">Choose from expertly crafted interview templates</p>
          </div>
        </div>

        {/* Templates Section */}
        <div className="animate-fade-in-up animation-delay-400">
          <EnhancedInterviewTemplates onTemplateSelect={handleTemplateSelect} />
        </div>        
        {/* Selected Template Actions */}
        {selectedTemplate && (
          <div className="mt-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-800">
            <div className="glass-card">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Selected: {selectedTemplate.name}
                </h3>
                <p className="text-gray-400 mb-6">
                  {selectedTemplate.description}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleStartInterview}
                    className="glass-button bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-400/30 hover:to-purple-400/30 flex items-center space-x-2 px-6 py-3"
                  >
                    <Play className="h-5 w-5" />
                    <span>Start Interview</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={handleCustomizeTemplate}
                    className="glass-button bg-white/10 hover:bg-white/20 flex items-center space-x-2 text-gray-300 hover:text-white px-6 py-3"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Customize Template</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Template Customization Modal */}
        {showCustomization && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="glass-card max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-white mb-4">
                Customize Template
              </h3>
              <p className="text-gray-400 mb-4">
                Template customization will be available soon. For now, you can start the interview with default settings.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCustomization(false)}
                  className="glass-button flex-1 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowCustomization(false);
                    handleStartInterview();
                  }}
                  className="glass-button flex-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-400/30 hover:to-purple-400/30 text-white"
                >
                  Start Interview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;
