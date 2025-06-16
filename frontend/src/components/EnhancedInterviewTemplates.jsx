// Create a completely new, enhanced InterviewTemplates component
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { templatesAPI } from '../services/api';
import { 
  FileText, Clock, Users, Target, Star, CheckCircle, 
  ChevronDown, ChevronUp, Eye, Play, BookOpen, 
  BarChart3, X, Zap, Award, TrendingUp, Plus, 
  Minus, GitCompare, Lightbulb, Code, MessageCircle
} from 'lucide-react';

const EnhancedInterviewTemplates = ({ onTemplateSelect }) => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('all');
  const [expandedSkills, setExpandedSkills] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showModal, setShowModal] = useState(false);  const [compareTemplates, setCompareTemplates] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  // Handle template selection and navigation
  const handleTemplateSelect = (template) => {
    // Call the parent callback if provided
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
    
    // Navigate to interview page with selected template
    navigate('/interview', { 
      state: { selectedTemplate: template }
    });
  };

  // Data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        const [templatesResponse, rolesResponse] = await Promise.all([
          templatesAPI.getTemplates(),
          templatesAPI.getJobRoles()
        ]);
        
        setTemplates(templatesResponse.templates || []);
        setJobRoles(rolesResponse.job_roles || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  // Load templates on component mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        const response = await templatesAPI.getTemplates();
        // Handle different response structures
        const templateData = response.templates || response.data || response || [];
        setTemplates(templateData);
          // Extract unique job roles for filter - with safety checks
        const roles = [...new Set(
          templateData
            .map(t => t.job_role)
            .filter(role => {
              // Only include valid string job roles
              if (typeof role === 'string' && role.trim()) {
                return true;
              }
              // If it's an object, extract the value
              if (typeof role === 'object' && role?.value) {
                return true;
              }
              return false;
            })
        )];
        setJobRoles(roles);
      } catch (error) {
        console.error('Error loading templates:', error);
        setTemplates([]); // Set empty array on error
        setJobRoles([]);
      } finally {
        setLoading(false);
      }
    };    loadTemplates();
  }, []);
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal || showComparison) {
      // Prevent scrolling
      document.body.classList.add('modal-open');
    } else {
      // Restore scrolling
      document.body.classList.remove('modal-open');
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showModal, showComparison]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (showModal) setShowModal(false);
        if (showComparison) setShowComparison(false);
      }
    };

    if (showModal || showComparison) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showModal, showComparison]);

  // Filter templates based on selected job role
  const filteredTemplates = templates.filter(template => 
    selectedRole === 'all' || template.job_role === selectedRole
  );

  // Toggle skills expansion for a template
  const toggleSkillsExpansion = (templateId) => {
    setExpandedSkills(prev => ({
      ...prev,
      [templateId]: !prev[templateId]
    }));
  };
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-cyan-400 to-purple-500"></div>
          <div className="absolute inset-2 animate-spin rounded-full h-12 w-12 border-4 border-transparent bg-gradient-to-r from-purple-500 to-cyan-400" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          <div className="absolute inset-4 rounded-full h-8 w-8 bg-gray-900"></div>
        </div>
      </div>
    );
  }

  // Enhanced Comparison Modal Component
  const EnhancedComparisonModal = () => {
    if (compareTemplates.length === 0 || !showComparison) return null;
    return ReactDOM.createPortal(
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 50
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowComparison(false);
          }
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '90rem',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'rgba(17, 24, 39, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(75, 85, 99, 0.5)',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Comparison Header */}
          <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 p-6 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  📊 Template Comparison
                </h2>
                <p className="text-gray-400 mt-2">
                  Compare {compareTemplates.length} templates side by side to make the best choice
                </p>
              </div>
              <button
                onClick={() => setShowComparison(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Comparison Content */}
          <div className="p-6">
            <div className={`grid gap-6 ${compareTemplates.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {compareTemplates.map((template, index) => (
                <div key={template.id} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700/50 hover:border-cyan-500/50 transition-all">
                  {/* Template Header */}
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold text-lg">{index + 1}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{template.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {template.job_role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>

                  {/* Comparison Metrics */}
                  <div className="space-y-4">
                    {/* Duration */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">Duration:</span>
                      <span className="text-white font-semibold">{template.duration_minutes} min</span>
                    </div>
                    {/* Level */}
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">Level:</span>
                      <span className="text-white font-semibold capitalize">{template.experience_level}</span>
                    </div>
                    {/* Questions */}
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300">Questions:</span>
                      <span className="text-white font-semibold">
                        {Object.values(template.question_distribution || {}).reduce((a, b) => a + b, 0)}
                      </span>
                    </div>
                    {/* Interviewers */}
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-400" />
                      <span className="text-gray-300">Interviewers:</span>
                      <span className="text-white font-semibold">{template.interviewer_types?.length || 0}</span>
                    </div>
                  </div>                  {/* Top Skills Preview */}
                  <div className="mt-6">
                    <h4 className="text-gray-300 font-medium mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Top Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {template.key_skills?.slice(0, 4).map((skill, skillIndex) => (
                        <span key={skillIndex} className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-sm border border-cyan-500/30">
                          {skill}
                        </span>
                      ))}
                      {template.key_skills?.length > 4 && (
                        <span className="px-2 py-1 bg-gray-600/50 text-gray-400 rounded text-sm">
                          +{template.key_skills.length - 4}
                        </span>
                      )}
                    </div>
                  </div>                  {/* Sample Questions Preview */}
                  {template.common_questions && template.common_questions.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-gray-300 font-medium mb-3 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Sample Questions
                      </h4>
                      <div className="space-y-2">
                        {template.common_questions.slice(0, 2).map((question, qIndex) => (
                          <div key={qIndex} className="bg-gray-700/30 p-3 rounded text-sm text-gray-300 border-l-2 border-orange-400">
                            "{typeof question === 'string' ? question : question.text}"
                          </div>
                        ))}
                        {template.common_questions.length > 2 && (
                          <p className="text-xs text-gray-500 italic">
                            +{template.common_questions.length - 2} more questions...
                          </p>
                        )}
                      </div>
                    </div>
                  )}                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => {
                        handleTemplateSelect(template);
                        setShowComparison(false);
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Choose This
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowComparison(false);
                        setShowModal(true);
                      }}
                      className="px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg transition-all duration-300 flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>            {/* Comparison Summary */}
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                💡 Quick Comparison Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-purple-400 font-medium">⏱️ Shortest Interview:</span>
                  <span className="text-white ml-2">
                    {Math.min(...compareTemplates.map(t => t.duration_minutes))} minutes
                  </span>
                </div>
                <div>
                  <span className="text-purple-400 font-medium">⏱️ Longest Interview:</span>
                  <span className="text-white ml-2">
                    {Math.max(...compareTemplates.map(t => t.duration_minutes))} minutes
                  </span>
                </div>
                <div>
                  <span className="text-purple-400 font-medium">🎯 Most Questions:</span>
                  <span className="text-white ml-2">
                    {Math.max(...compareTemplates.map(t => Object.values(t.question_distribution || {}).reduce((a, b) => a + b, 0)))} questions
                  </span>
                </div>
                <div>
                  <span className="text-purple-400 font-medium">⚡ Most Skills:</span>
                  <span className="text-white ml-2">
                    {Math.max(...compareTemplates.map(t => t.key_skills?.length || 0))} skills
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex gap-4 mt-6 pt-6 border-t border-gray-700/50">
              <button
                onClick={() => setShowComparison(false)}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-semibold rounded-xl transition-colors"
              >
                Close Comparison
              </button>
              <button
                onClick={() => {
                  setCompareTemplates([]);
                  setShowComparison(false);
                }}
                className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 font-semibold rounded-xl transition-colors border border-red-500/30"
              >
                Clear All Selections
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };  // Template Detail Modal Component - now uses portal and fixed positioning, with full detailed content
  const TemplateModal = () => {
    if (!selectedTemplate) return null;
    return ReactDOM.createPortal(
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 50
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowModal(false);
          }
        }}
      >
        <div 
          className="relative w-full max-w-5xl bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl"
          style={{
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 p-6 z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  🎯 {selectedTemplate.name}
                </h2>
                <p className="text-gray-400 text-lg">
                  {selectedTemplate.job_role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • {selectedTemplate.experience_level} Level
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-4 rounded-xl border border-cyan-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400 font-medium">Duration</span>
                </div>
                <p className="text-white text-xl font-bold">{selectedTemplate.duration_minutes} min</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 p-4 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-400 font-medium">Questions</span>
                </div>
                <p className="text-white text-xl font-bold">
                  {Object.values(selectedTemplate.question_distribution || {}).reduce((a, b) => a + b, 0)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 p-4 rounded-xl border border-orange-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-orange-400" />
                  <span className="text-orange-400 font-medium">Interviewers</span>
                </div>
                <p className="text-white text-xl font-bold">{selectedTemplate.interviewer_types?.length || 0}</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-400" />
                📋 Template Overview
              </h3>
              <p className="text-gray-300 leading-relaxed text-lg">{selectedTemplate.description}</p>
            </div>

            {/* Key Skills */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                ⚡ Key Skills You'll Be Assessed On
              </h3>
              <div className="flex flex-wrap gap-3">
                {selectedTemplate.key_skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 rounded-lg border border-yellow-500/30 font-medium hover:scale-105 transition-transform"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Sample Questions Preview */}
            {selectedTemplate.sample_questions && selectedTemplate.sample_questions.length > 0 && (
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  🎯 Sample Questions You'll Face
                </h3>
                <div className="space-y-4">
                  {selectedTemplate.sample_questions.slice(0, 4).map((question, index) => (
                    <div key={index} className="bg-gray-700/50 p-4 rounded-lg border-l-4 border-orange-400 hover:bg-gray-700/70 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-orange-400 text-gray-900 rounded-full text-sm font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <p className="text-gray-300 leading-relaxed">{question}</p>
                      </div>
                    </div>
                  ))}
                  {selectedTemplate.sample_questions.length > 4 && (
                    <p className="text-gray-400 text-center italic">
                      ...and {selectedTemplate.sample_questions.length - 4} more questions!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-700/50">
              <button
                onClick={() => {
                  handleTemplateSelect(selectedTemplate);
                  setShowModal(false);
                }}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.02]"
              >
                <Play className="w-5 h-5" />
                🚀 Start Interview with This Template
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };
  
  // Handle template comparison
  const handleCompareToggle = (template) => {
    setCompareTemplates(prev => {
      const isSelected = prev.find(t => t.id === template.id);
      if (isSelected) {
        return prev.filter(t => t.id !== template.id);
      } else if (prev.length < 3) {
        return [...prev, template];
      }
      return prev;
    });
  };

  // Main render
  return (
      <div className="relative">
        {/* Templates Grid */}
        <div className="space-y-8">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center justify-between">
            {/* Job Role Filter */}
            <div className="flex items-center gap-3">
              <label className="text-gray-300 font-medium">Filter by Role:</label>            <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="glass-input border border-white/20 text-white px-4 py-2 rounded-lg focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all duration-200 bg-gray-800/50"
                style={{
                  colorScheme: 'dark'
                }}
              >
                <option value="all" className="bg-gray-800 text-white">All Job Roles</option>
                {jobRoles.map((role, index) => {
                  // Handle both string and object formats
                  const roleValue = typeof role === 'string' ? role : (role?.value || role?.id || `role-${index}`);
                  const roleLabel = typeof role === 'string' 
                    ? role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    : (role?.label || role?.name || roleValue);
                    return (
                  <option key={`role-${index}-${roleValue}`} value={roleValue} className="bg-gray-800 text-white">
                    {roleLabel}
                  </option>
                );
                })}
              </select>
            </div>

            {/* Comparison controls */}
            {compareTemplates.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-gray-300 bg-purple-500/20 px-3 py-2 rounded-lg border border-purple-500/20">
                  📊 {compareTemplates.length} template{compareTemplates.length !== 1 ? 's' : ''} selected for comparison
                </span>
                <button
                  onClick={() => setShowComparison(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-600/30 transition-colors"
                >
                  <GitCompare className="w-4 h-4" />
                  Compare Now
                </button>
                <button
                  onClick={() => setCompareTemplates([])}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600/20 text-gray-400 border border-gray-500/30 rounded-lg hover:bg-gray-600/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-cyan-400 to-purple-500"></div>
                <div className="absolute inset-2 animate-spin rounded-full h-12 w-12 border-4 border-transparent bg-gradient-to-r from-purple-500 to-cyan-400" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                <div className="absolute inset-4 rounded-full h-8 w-8 bg-gray-900"></div>
              </div>
            </div>
          )}

          {/* Templates Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTemplates.map((template) => (              <div
                  key={template.id}
                  className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm p-6 rounded-2xl hover:bg-gradient-to-br hover:from-gray-800/80 hover:to-gray-900/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/10"
                >
                  {/* Template Card Content */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {template.job_role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowModal(true);
                        }}
                        className="p-2 bg-gray-700/50 hover:bg-cyan-600/50 text-gray-400 hover:text-white rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCompareToggle(template)}
                        className={`p-2 rounded-lg transition-colors ${
                          compareTemplates.find(t => t.id === template.id)
                            ? 'bg-purple-600/50 text-purple-300'
                            : 'bg-gray-700/50 hover:bg-purple-600/50 text-gray-400 hover:text-white'
                        }`}
                        title="Add to Comparison"
                      >
                        {compareTemplates.find(t => t.id === template.id) ? (
                          <Minus className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Template Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-700/30 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300 text-sm">Duration</span>
                      </div>
                      <p className="text-white font-semibold">{template.duration_minutes} min</p>
                    </div>
                    <div className="bg-gray-700/30 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">Level</span>
                      </div>
                      <p className="text-white font-semibold capitalize">{template.experience_level}</p>
                    </div>
                  </div>

                  {/* Skills Preview */}
                  <div className="mb-4">
                    <h4 className="text-gray-300 font-medium mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Key Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {template.key_skills?.slice(0, expandedSkills[template.id] ? undefined : 3).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-sm border border-cyan-500/30">
                          {skill}
                        </span>
                      ))}
                      {template.key_skills?.length > 3 && (
                        <button
                          onClick={() => toggleSkillsExpansion(template.id)}
                          className="px-2 py-1 bg-gray-600/50 text-gray-400 hover:text-white rounded text-sm transition-colors flex items-center gap-1"
                        >
                          {expandedSkills[template.id] ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              +{template.key_skills.length - 3} more
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>                {/* Action Button */}
                  <button
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Interview
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* No templates found */}
          {!loading && filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No templates found for the selected criteria.</p>
            </div>
          )}
        </div>      {/* Portals for modals */}
      {showModal && selectedTemplate && TemplateModal()}
      {showComparison && compareTemplates.length > 0 && EnhancedComparisonModal()}
      </div>
  );
};

export default EnhancedInterviewTemplates;