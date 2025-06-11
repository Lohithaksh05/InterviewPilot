import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Briefcase, Users, Brain, Target } from 'lucide-react';
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
      case 'hr': return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
      case 'tech_lead': return 'border-green-200 bg-green-50 hover:bg-green-100';
      case 'behavioral': return 'border-purple-200 bg-purple-50 hover:bg-purple-100';
      default: return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Setup Your Interview</h1>
        <p className="text-lg text-gray-600">
          Upload your resume, add the job description, and choose your interviewer
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((stepNum) => (
            <React.Fragment key={stepNum}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNum 
                  ? 'bg-gray-200 text-gray-600' 
                  : 'bg-primary-600 text-black'
              }`}>
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div className={`w-12 h-1 ${
                  step > stepNum ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Resume Upload */}
      {step === 1 && (
        <div className="card space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Step 1: Upload Your Resume</span>
          </h2>
          
          {/* File Upload */}
          <div className="space-y-4">
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {uploadedFile ? uploadedFile.name : 'Upload your resume'}
                </p>
                <p className="text-sm text-gray-600">
                  Supports PDF, DOCX, and TXT files
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

            <div className="text-center text-gray-500">or</div>

            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste your resume text
              </label>
              <textarea
                className="textarea-field h-32"
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
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Job Description
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Job Description */}
      {step === 2 && (
        <div className="card space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Briefcase className="h-5 w-5" />
            <span>Step 2: Job Description</span>
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste the job description or job requirements
            </label>
            <textarea
              className="textarea-field h-40"
              placeholder="Paste the job description here..."
              value={formData.job_description}
              onChange={handleTextareaChange('job_description')}
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="btn-secondary"
            >
              Back: Resume
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!formData.job_description.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Choose Interviewer & Difficulty
            </button>
          </div>
        </div>
      )}      {/* Step 3: Choose Interviewer & Difficulty */}
      {step === 3 && (
        <div className="card space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Step 3: Choose Your Interviewer & Difficulty
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {interviewerTypes.map((interviewer) => (
              <button
                key={interviewer.type}
                onClick={() => handleInterviewerSelect(interviewer.type)}
                className={`p-6 rounded-lg border-2 text-left transition-all ${
                  getInterviewerColor(interviewer.type)
                } ${
                  formData.interviewer_type === interviewer.type
                    ? 'ring-2 ring-primary-500 border-primary-300'
                    : ''
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  {getInterviewerIcon(interviewer.type)}
                  <h3 className="font-semibold text-gray-900">{interviewer.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">{interviewer.description}</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700">Focus Areas:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {interviewer.focus_areas.slice(0, 3).map((area, index) => (
                      <li key={index}>• {area}</li>
                    ))}
                  </ul>
                </div>
              </button>
            ))}          </div>

          {/* Difficulty Level Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Select Difficulty Level</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {difficultyLevels.map((level) => (
                <button
                  key={level.level}
                  onClick={() => setFormData(prev => ({ ...prev, difficulty: level.level }))}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    formData.difficulty === level.level
                      ? 'border-primary-300 bg-primary-50 ring-2 ring-primary-500'
                      : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${
                      level.level === 'easy' ? 'bg-green-500' :
                      level.level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <h4 className="font-semibold text-gray-900">{level.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{level.description}</p>
                  <div className="text-xs text-gray-500">
                    {level.characteristics.slice(0, 2).map((char, index) => (
                      <div key={index}>• {char}</div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Number of Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions
            </label>
            <select
              className="input-field w-32"
              value={formData.num_questions}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                num_questions: parseInt(e.target.value)
              }))}
            >
              <option value={3}>3 Questions</option>
              <option value={5}>5 Questions</option>
              <option value={8}>8 Questions</option>
              <option value={10}>10 Questions</option>
            </select>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="btn-secondary"
            >
              Back: Job Description
            </button>
            <button
              onClick={startInterview}
              disabled={!formData.interviewer_type || loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Starting Interview...</span>
                </>
              ) : (
                <span>Start Interview</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interview;
