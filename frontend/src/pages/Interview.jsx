import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Briefcase, Users, Brain, Target, Sparkles, Zap, Clock, Star, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { resumeAPI, agentsAPI, interviewAPI } from '../services/api';

const Interview = () => {
  const navigate = useNavigate();  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [interviewerTypes, setInterviewerTypes] = useState([]);
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    resume_text: '',
    job_description: '',
    interviewer_type: '',
    difficulty: 'medium',
    num_questions: 5
  });

  // File upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  useEffect(() => {
    fetchInterviewerTypes();
    fetchDifficultyLevels();
  }, []);

  const fetchInterviewerTypes = async () => {
    try {
      const response = await agentsAPI.getInterviewerTypes();
      setInterviewerTypes(response.interviewer_types || []);
    } catch (error) {
      console.error('Error fetching interviewer types:', error);
      toast.error('Failed to load interviewer types');
    }
  };

  const fetchDifficultyLevels = async () => {
    try {
      const response = await agentsAPI.getDifficultyLevels();
      setDifficultyLevels(response.difficulty_levels || []);
    } catch (error) {
      console.error('Error fetching difficulty levels:', error);
      toast.error('Failed to load difficulty levels');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const resumeData = await resumeAPI.uploadResume(file);
      setFormData(prev => ({
        ...prev,
        resume_text: resumeData.raw_text
      }));
      setUploadedFile(file);
      toast.success('Resume uploaded successfully!');
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast.error(error.message || 'Failed to upload resume');
    } finally {
      setLoading(false);
    }
  };

  const handleTextareaChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleInterviewerSelect = (type) => {
    setFormData(prev => ({
      ...prev,
      interviewer_type: type
    }));
  };

  const startInterview = async () => {
    if (!formData.resume_text.trim()) {
      toast.error('Please upload your resume or enter resume text');
      return;
    }
    
    if (!formData.job_description.trim()) {
      toast.error('Please enter the job description');
      return;
    }
    
    if (!formData.interviewer_type) {
      toast.error('Please select an interviewer type');
      return;
    }

    setLoading(true);
    try {
      const response = await interviewAPI.startInterview(formData);
      toast.success('Interview session started!');
      navigate(`/interview/${response.session_id}`);
    } catch (error) {
      console.error('Error starting interview:', error);
      toast.error(error.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const getInterviewerIcon = (type) => {
    switch (type) {
      case 'hr': return <Users className="h-6 w-6" />;
      case 'tech_lead': return <Brain className="h-6 w-6" />;
      case 'behavioral': return <Target className="h-6 w-6" />;
      default: return <Users className="h-6 w-6" />;
    }
  };
  const getInterviewerColor = (type) => {
    switch (type) {
      case 'hr': return 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20';
      case 'tech_lead': return 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20';
      case 'behavioral': return 'border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20';
      default: return 'border-gray-500/30 bg-gradient-to-br from-gray-500/10 to-gray-400/10 hover:from-gray-500/20 hover:to-gray-400/20';
    }
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

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-6 animate-fade-in-up">
            <div className="relative">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
                Setup Your Interview
              </h1>
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 blur-xl rounded-3xl opacity-30 animate-pulse"></div>
            </div>
            <p className="text-xl text-gray-300 font-medium max-w-2xl mx-auto">
              Upload your resume, add the job description, and choose your AI interviewer for a personalized practice session
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center animate-fade-in-up animation-delay-200">
            <div className="flex items-center space-x-8 glass-card px-8 py-4">
              {[
                { num: 1, label: 'Resume', icon: FileText },
                { num: 2, label: 'Job Details', icon: Briefcase },
                { num: 3, label: 'Interviewer', icon: Users }
              ].map((stepInfo, index) => (
                <React.Fragment key={stepInfo.num}>
                  <div className="flex items-center space-x-3">
                    <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      step >= stepInfo.num 
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-purple-500/25' 
                        : 'bg-gradient-to-r from-gray-600 to-gray-500 text-gray-300'
                    }`}>
                      {step > stepInfo.num ? (
                        <Star className="h-5 w-5 animate-pulse" />
                      ) : (
                        <stepInfo.icon className="h-5 w-5" />
                      )}
                      {step >= stepInfo.num && (
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-purple-400/30 rounded-full animate-ping"></div>
                      )}
                    </div>
                    <div className={`transition-colors duration-300 ${
                      step >= stepInfo.num ? 'text-white font-semibold' : 'text-gray-400'
                    }`}>
                      {stepInfo.label}
                    </div>
                  </div>
                  {index < 2 && (
                    <ChevronRight className={`h-5 w-5 transition-colors duration-300 ${
                      step > stepInfo.num ? 'text-cyan-400' : 'text-gray-500'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>          {/* Step 1: Resume Upload */}
          {step === 1 && (
            <div className="glass-card space-y-8 animate-fade-in-up animation-delay-400">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                  <FileText className="h-6 w-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Step 1: Upload Your Resume</h2>
              </div>
              
              {/* File Upload */}
              <div className="space-y-6">
                <label className="block group cursor-pointer">
                  <div className="border-2 border-dashed border-gray-600/50 rounded-2xl p-12 text-center hover:border-cyan-500/50 transition-all duration-300 bg-gradient-to-br from-gray-800/30 to-gray-700/30 group-hover:from-gray-700/40 group-hover:to-gray-600/40">
                    <div className="relative">
                      <Upload className="h-16 w-16 text-gray-400 group-hover:text-cyan-400 mx-auto mb-6 transition-colors duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <p className="text-xl font-semibold text-white mb-3">
                      {uploadedFile ? uploadedFile.name : 'Upload your resume'}
                    </p>
                    <p className="text-gray-300">
                      Supports PDF, DOCX, and TXT files (Max 10MB)
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={loading}
                    />
                  </div>
                </label>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600/50"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gray-900 text-gray-400 font-medium">or</span>
                  </div>
                </div>

                {/* Text Input */}
                <div className="space-y-3">
                  <label className="block text-lg font-semibold text-white">
                    Paste your resume text
                  </label>                  <textarea
                    className="w-full h-40 px-6 py-4 bg-gradient-to-br from-slate-900/90 via-gray-900/80 to-slate-800/90 border border-cyan-500/20 rounded-2xl text-white placeholder-cyan-200/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/60 transition-all duration-300 resize-none hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10 backdrop-blur-md"
                    placeholder="Paste your resume content here..."
                    value={formData.resume_text}
                    onChange={handleTextareaChange('resume_text')}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.resume_text.trim()}
                  className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-2"
                >
                  <span>Next: Job Description</span>
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          )}          {/* Step 2: Job Description */}
          {step === 2 && (
            <div className="glass-card space-y-8 animate-fade-in-up animation-delay-400">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Briefcase className="h-6 w-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Step 2: Job Description</h2>
              </div>
              
              <div className="space-y-3">
                <label className="block text-lg font-semibold text-white">
                  Paste the job description or job requirements
                </label>
                <textarea                  className="w-full h-48 px-6 py-4 bg-gradient-to-br from-slate-900/90 via-gray-900/80 to-slate-800/90 border border-purple-500/20 rounded-2xl text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400/60 transition-all duration-300 resize-none hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 backdrop-blur-md"
                  placeholder="Paste the job description here..."
                  value={formData.job_description}
                  onChange={handleTextareaChange('job_description')}
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="group relative overflow-hidden bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                >
                  <ChevronRight className="h-5 w-5 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
                  <span>Back: Resume</span>
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.job_description.trim()}
                  className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-2"
                >
                  <span>Next: Choose Interviewer</span>
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>            </div>
          )}

          {/* Step 3: Choose Interviewer & Difficulty */}
          {step === 3 && (
            <div className="glass-card space-y-10 animate-fade-in-up animation-delay-400">
              <div className="flex items-center space-x-4 mb-8">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Step 3: Choose Your AI Interviewer</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                {interviewerTypes.map((interviewer, index) => (
                  <button
                    key={interviewer.type}
                    onClick={() => handleInterviewerSelect(interviewer.type)}
                    className={`relative p-8 rounded-2xl border-2 text-left transition-all duration-300 transform hover:scale-105 group animate-fade-in-up ${
                      getInterviewerColor(interviewer.type)
                    } ${
                      formData.interviewer_type === interviewer.type
                        ? 'ring-2 ring-cyan-500/50 border-cyan-500/50 shadow-xl shadow-cyan-500/25'
                        : 'hover:shadow-xl hover:shadow-purple-500/10'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-gray-700/50 to-gray-600/50 group-hover:from-gray-600/50 group-hover:to-gray-500/50 transition-all duration-300">
                        {getInterviewerIcon(interviewer.type)}
                      </div>
                      <h3 className="font-bold text-white text-lg">{interviewer.name}</h3>
                    </div>
                    <p className="text-gray-300 mb-4 line-clamp-2">{interviewer.description}</p>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-cyan-400">Focus Areas:</p>
                      <ul className="text-sm text-gray-300 space-y-1">
                        {interviewer.focus_areas.slice(0, 3).map((area, areaIndex) => (
                          <li key={areaIndex} className="flex items-center space-x-2">
                            <Sparkles className="h-3 w-3 text-cyan-400 flex-shrink-0" />
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {formData.interviewer_type === interviewer.type && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                          <Star className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>              {/* Difficulty Level Selection */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <Zap className="h-6 w-6 text-yellow-400" />
                  <span>Select Difficulty Level</span>
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {difficultyLevels.map((level, index) => (
                    <button
                      key={level.level}
                      onClick={() => setFormData(prev => ({ ...prev, difficulty: level.level }))}
                      className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-300 transform hover:scale-105 group animate-fade-in-up ${
                        formData.difficulty === level.level
                          ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 ring-2 ring-yellow-500/50 shadow-xl shadow-yellow-500/25'
                          : 'border-gray-600/30 bg-gradient-to-br from-gray-800/30 to-gray-700/30 hover:border-gray-500/50 hover:shadow-xl hover:shadow-purple-500/10'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-4 h-4 rounded-full ${
                          level.level === 'easy' ? 'bg-green-400' :
                          level.level === 'medium' ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></div>
                        <h4 className="font-bold text-white text-lg">{level.name}</h4>
                      </div>
                      <p className="text-gray-300 mb-3">{level.description}</p>
                      <div className="text-sm text-gray-400 space-y-1">
                        {level.characteristics.slice(0, 2).map((char, charIndex) => (
                          <div key={charIndex} className="flex items-center space-x-2">
                            <Clock className="h-3 w-3 text-cyan-400 flex-shrink-0" />
                            <span>{char}</span>
                          </div>
                        ))}
                      </div>
                      {formData.difficulty === level.level && (
                        <div className="absolute top-4 right-4">
                          <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <Star className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>              {/* Number of Questions */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-white">
                  Number of Questions
                </label>                <select
                  className="w-full px-6 py-4 bg-gradient-to-br from-gray-800/80 to-gray-700/80 border border-gray-600/50 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                  value={formData.num_questions}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    num_questions: parseInt(e.target.value)
                  }))}
                  style={{
                    backgroundColor: 'rgba(31, 41, 55, 0.8)',
                    color: 'white'
                  }}
                >
                  <option value={3} style={{ backgroundColor: '#1f2937', color: 'white' }}>3 Questions (15 mins)</option>
                  <option value={5} style={{ backgroundColor: '#1f2937', color: 'white' }}>5 Questions (25 mins)</option>
                  <option value={8} style={{ backgroundColor: '#1f2937', color: 'white' }}>8 Questions (40 mins)</option>
                  <option value={10} style={{ backgroundColor: '#1f2937', color: 'white' }}>10 Questions (50 mins)</option>
                </select>
              </div>

              <div className="flex justify-between pt-6">
                <button
                  onClick={() => setStep(2)}
                  className="group relative overflow-hidden bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                >
                  <ChevronRight className="h-5 w-5 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
                  <span>Back: Job Description</span>
                </button>
                <button
                  onClick={startInterview}
                  disabled={!formData.interviewer_type || loading}
                  className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-12 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-3"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Starting Interview...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6 group-hover:animate-spin transition-transform duration-300" />
                      <span>Start Interview</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>  );
};

export default Interview;
