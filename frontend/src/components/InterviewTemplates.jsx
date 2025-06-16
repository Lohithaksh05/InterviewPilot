import React, { useState, useEffect } from 'react';
import { templatesAPI } from '../services/api';
import { 
  Layers, Clock, User, Star, ChevronRight, X, Eye, Play, CheckCircle, 
  ChevronDown, ChevronUp, BookOpen, BarChart3, Zap, Award, TrendingUp, Plus, 
  Minus, Lightbulb, Code, MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const InterviewTemplates = ({ onTemplateSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareTemplates, setCompareTemplates] = useState([]);
  const [expandedSkills, setExpandedSkills] = useState({});

  // Filter templates based on selected role
  const filteredTemplates = templates.filter(template => 
    selectedRole === 'all' || template.job_role === selectedRole
  );

  useEffect(() => {
    loadTemplates();
    loadJobRoles();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await templatesAPI.getTemplates();
      setTemplates(response.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load interview templates');
    } finally {
      setLoading(false);
    }
  };

  const loadJobRoles = async () => {
    try {
      const response = await templatesAPI.getJobRoles();
      setJobRoles([
        { value: 'all', label: 'All Roles' },
        ...response.job_roles || []
      ]);
    } catch (error) {
      console.error('Error loading job roles:', error);
    }
  };

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
    setShowModal(true);
  };

  const handleTemplateSelect = (template) => {
    setShowModal(false);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTemplate(null);
  };

  const renderSkillTags = (skills, limit = 3) => {
    if (!skills || skills.length === 0) return null;
    
    const displayedSkills = skills.slice(0, limit);
    const remainingCount = skills.length - limit;

    return (
      <div className="flex flex-wrap gap-1">
        {displayedSkills.map((skill, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30"
          >
            {skill}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full border border-gray-500/30 cursor-pointer hover:bg-gray-500/30 transition-colors">
            +{remainingCount} more
          </span>
        )}
      </div>
    );
  };

  const formatJobRole = (role) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getExperienceColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'junior': return 'text-green-400';
      case 'mid': return 'text-yellow-400';
      case 'senior': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getDifficultyBreakdown = (breakdown) => {
    if (!breakdown) return [];
    return [
      { label: 'Easy', count: breakdown.easy || 0, color: 'bg-green-500' },
      { label: 'Medium', count: breakdown.medium || 0, color: 'bg-yellow-500' },
      { label: 'Hard', count: breakdown.hard || 0, color: 'bg-red-500' }
    ];
  };

  const toggleSkillsExpansion = (templateId) => {
    setExpandedSkills(prev => ({
      ...prev,
      [templateId]: !prev[templateId]
    }));
  };

  const openTemplateModal = (template, event) => {
    event.stopPropagation();
    setSelectedTemplate(template);
    setShowModal(true);
  };

  const toggleCompareTemplate = (template, event) => {
    event.stopPropagation();
    setCompareTemplates(prev => {
      const exists = prev.find(t => t.id === template.id);
      if (exists) {
        return prev.filter(t => t.id !== template.id);
      } else if (prev.length < 3) { // Max 3 templates for comparison
        return [...prev, template];
      }
      return prev;
    });
  };

  const renderSkillsWithExpansion = (skills, templateId, maxDisplay = 3) => {
    if (!skills || skills.length === 0) return null;
    
    const isExpanded = expandedSkills[templateId];
    const displaySkills = isExpanded ? skills : skills.slice(0, maxDisplay);
    const remainingCount = skills.length - maxDisplay;

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {displaySkills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm font-medium border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
            >
              {skill}
            </span>
          ))}
        </div>
        
        {remainingCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSkillsExpansion(templateId);
            }}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium hover:bg-cyan-500/10 px-2 py-1 rounded"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                +{remainingCount} more skills
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
        <span className="ml-3 text-gray-300">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header with comparison controls */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Interview Templates
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Choose from professionally designed templates tailored for specific job roles and experience levels
          </p>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-8">
            {/* Role Filter */}
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-6 py-3 bg-gray-800/80 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 backdrop-blur-sm appearance-none pr-10"
              >
                <option value="all">All Job Roles</option>
                {jobRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Comparison controls */}
            {compareTemplates.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-gray-300">
                  {compareTemplates.length} template{compareTemplates.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setCompareMode(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors"
                >
                  <Compare className="w-4 h-4" />
                  Compare
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
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading templates...</p>
          </div>
        ) : (
          <>          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => onTemplateSelect && onTemplateSelect(template)}
                className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-500 cursor-pointer hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/10"
              >
                {/* Template Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {template.job_role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplate(template);
                        setShowModal(true);
                      }}
                      className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompareTemplate(template, e);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        compareTemplates.find(t => t.id === template.id)
                          ? 'bg-green-600/30 text-green-400' 
                          : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-400'
                      }`}
                      title={compareTemplates.find(t => t.id === template.id) ? 'Remove from comparison' : 'Add to comparison'}
                    >
                      {compareTemplates.find(t => t.id === template.id) ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Template Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-700/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-400 text-sm font-medium">Duration</span>
                    </div>
                    <p className="text-white font-semibold">{template.duration_minutes} min</p>
                  </div>
                  
                  <div className="bg-gray-700/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm font-medium">Level</span>
                    </div>
                    <p className="text-white font-semibold capitalize">{template.experience_level}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">{template.description}</p>

                {/* Key Skills with expansion */}
                <div className="mb-4">
                  <h4 className="text-cyan-400 font-medium mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Key Skills
                  </h4>
                  {renderSkillsWithExpansion(template.key_skills, template.id)}
                </div>

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTemplateSelect) {
                      onTemplateSelect(template);
                    }
                  }}
                  className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-cyan-500/25"
                >
                  <Play className="w-4 h-4" />
                  Start Interview
                </button>

                {/* Comparison badge */}
                {compareTemplates.find(t => t.id === template.id) && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Selected
                  </div>
                )}
              </div>
            ))}
          </div>

            {/* Empty State */}
            {filteredTemplates.length === 0 && (
              <div className="text-center py-20">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No templates found</h3>
                <p className="text-gray-500">Try adjusting your filter criteria</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showModal && <TemplateModal />}
      {compareMode && <ComparisonModal />}
    </div>
  );
};

export default InterviewTemplates;
