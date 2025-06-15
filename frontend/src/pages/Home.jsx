import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Users, BarChart3, ArrowRight, CheckCircle, Star, Sparkles, Zap, Target, Trophy, Rocket, Shield, Award, User, LogOut } from 'lucide-react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const Home = () => {
  const [user, setUser] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [typedText, setTypedText] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const heroRef = useRef(null);
  const navigate = useNavigate();
  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      // Parallax effect for background elements
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll('.parallax');
      
      parallaxElements.forEach((element, index) => {
        const speed = (index + 1) * 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Typing animation effect
  useEffect(() => {
    const text = "Dream Interview";
    let index = 0;
    const timer = setInterval(() => {
      if (index <= text.length) {
        setTypedText(text.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 150);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const checkAuthState = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    // Check auth state on mount
    checkAuthState();

    // Listen for auth state changes
    const handleAuthChange = () => {
      checkAuthState();
    };    window.addEventListener('authStateChanged', handleAuthChange);

    // Trigger animations
    setTimeout(() => setIsVisible(true), 100);

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-dropdown')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showUserDropdown]);const features = [
    {
      icon: <Users className="h-8 w-8 text-white" />,
      title: "Multi-Agent Interviewers",
      description: "Practice with AI-powered HR, Technical Lead, and Behavioral interviewers, each with their unique expertise and questioning style."
    },
    {
      icon: <Brain className="h-8 w-8 text-white" />,
      title: "AI-Powered Feedback",
      description: "Get detailed, personalized feedback on your answers with specific suggestions for improvement from Google Gemini AI."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-white" />,
      title: "Performance Analytics",
      description: "Track your progress with comprehensive analytics, scoring, and recommendations to ace your next interview."
    }
  ];
  const interviewerTypes = [
    {
      type: "HR Interviewer",
      description: "Focuses on cultural fit, communication skills, and soft skills assessment",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
      icon: "👥",
      features: ["Cultural Fit", "Soft Skills", "Communication"]
    },
    {
      type: "Technical Lead",
      description: "Evaluates technical expertise, problem-solving, and system design capabilities",
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      hoverColor: "hover:from-green-600 hover:to-emerald-700",
      icon: "💻",
      features: ["System Design", "Problem Solving", "Technical Skills"]
    },
    {
      type: "Behavioral Expert",
      description: "Uses STAR method to assess past experiences and situational responses",
      color: "bg-gradient-to-br from-purple-500 to-indigo-600",
      hoverColor: "hover:from-purple-600 hover:to-indigo-700",
      icon: "🎯",
      features: ["STAR Method", "Past Experience", "Situational Response"]
    }  ];

  // Logout function
  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setShowUserDropdown(false);
    
    // Trigger auth state change event
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="w-full min-h-screen bg-gray-900 overflow-hidden">      {/* User Profile Dropdown - Top Right */}
      {user && (
        <div className="fixed top-6 right-6 z-50 user-dropdown">
          <div className="relative">            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center glass-morphism-dark border border-gray-600/30 rounded-full p-2 hover:border-primary-500/50 transition-all duration-300"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            </button>            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-800/95 backdrop-blur-md border border-gray-600/50 rounded-2xl shadow-xl">
                <div className="p-2">
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-gray-600/30">
                    <p className="text-sm font-medium text-white">{user.username || user.email}</p>
                    <p className="text-xs text-gray-400">{user.full_name || user.name}</p>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-200 hover:text-red-400 hover:bg-red-500/20 transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}{/* Hero Section with Advanced Animations */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center">        {/* Enhanced Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          {/* Morphing blobs with parallax */}
          <div className="parallax absolute top-10 left-10 w-72 h-72 bg-primary-500/20 animate-morphing filter blur-xl opacity-70"></div>
          <div className="parallax absolute top-20 right-10 w-72 h-72 bg-purple-500/20 animate-morphing filter blur-xl opacity-70 animation-delay-2000"></div>
          <div className="parallax absolute -bottom-8 left-20 w-72 h-72 bg-pink-500/20 animate-morphing filter blur-xl opacity-70 animation-delay-4000"></div>
          
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary-400/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
          
          {/* Interactive glow effect following mouse */}
          <div 
            className="absolute w-96 h-96 bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-full filter blur-3xl pointer-events-none transition-all duration-300"
            style={{
              left: mousePosition.x - 192,
              top: mousePosition.y - 192,
            }}
          />
        </div>        <div className={`relative z-10 text-center space-y-8 max-w-6xl mx-auto px-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* InterviewPilot Brand Logo */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 p-4 rounded-2xl shadow-xl">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              InterviewPilot
            </span>
          </div>

          <div className="space-y-6">
            {/* Enhanced badge with glow effect */}
            <div className="inline-flex items-center space-x-2 glass-morphism-dark rounded-full px-6 py-3 shadow-lg border border-gray-700 animate-glow-pulse">
              <Sparkles className="h-5 w-5 text-primary-400 animate-spin" />
              <span className="text-sm font-medium text-gray-200">AI-Powered Interview Coach</span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse animation-delay-200"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse animation-delay-400"></div>
              </div>
            </div>
              {/* Enhanced title with better 3D effect */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                Master Your
              </h1>              {/* Dream Interview Animation with Color Transition */}
              <div className="relative">
                <h2 className="text-5xl md:text-7xl font-bold holographic transition-all duration-500">
                  {typedText}
                  <span className="animate-blink text-primary-400">|</span>
                </h2>
              </div>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Practice with AI-powered interviewers, get instant feedback, and 
              <span className="text-primary-400 font-semibold"> land your dream job </span>
              with unshakeable confidence.
            </p>
          </div>          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {/* Primary Action Button - Dynamic based on user login status */}
            {user ? (
              <Link
                to="/interview"
                className="group relative overflow-hidden bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-purple-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"></div>
                
                <div className="relative flex items-center space-x-3">
                  <Rocket className="h-6 w-6" />
                  <span className="text-lg">Start Practice Interview</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </Link>
            ) : (
              <Link
                to="/signup"
                className="group relative overflow-hidden bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-purple-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"></div>
                
                <div className="relative flex items-center space-x-3">
                  <Rocket className="h-6 w-6" />
                  <span className="text-lg">Get Started</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </Link>
            )}
            
            {/* Secondary Button - Login for non-users, Dashboard for users */}
            {user ? (
              <Link
                to="/dashboard"
                className="group relative overflow-hidden glass-morphism-dark border-2 border-gray-600 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl hover:border-primary-500 transform hover:scale-105 transition-all duration-300"
              >
                {/* Holographic border effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                
                <div className="relative flex items-center space-x-3">
                  <BarChart3 className="h-6 w-6 group-hover:animate-bounce text-primary-400" />
                  <span className="text-lg">View Dashboard</span>
                  <Shield className="h-5 w-5 group-hover:animate-pulse" />
                </div>
              </Link>
            ) : (
              <Link
                to="/login"
                className="group relative overflow-hidden glass-morphism-dark border-2 border-gray-600 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl hover:border-primary-500 transform hover:scale-105 transition-all duration-300"
              >
                {/* Holographic border effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                
                <div className="relative flex items-center space-x-3">
                  <Users className="h-6 w-6 text-primary-400" />
                  <span className="text-lg">Login</span>
                  <ArrowRight className="h-5 w-5" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>      {/* Modern Features Section */}
      <section className="py-20 px-4">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-full px-6 py-2">
            <Star className="h-5 w-5 text-primary-400" />
            <span className="text-sm font-medium text-gray-200">Why Choose InterviewPilot?</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Supercharge Your
            <span className="block text-white bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
              Interview Success
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-5">
            Our AI-powered platform provides realistic interview practice with cutting-edge technology
          </p>
        </div>        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto perspective-1000 mt-5">
          {features.map((feature, index) => (
            <div key={index} className="group relative glass-morphism-dark border border-gray-700 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:border-primary-500/50 transform hover:scale-105 hover:rotate-y-12 transition-all duration-500 overflow-hidden transform-style-3d">
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-morphing"></div>
              
              {/* Floating particles inside card */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-primary-400/40 rounded-full opacity-0 group-hover:opacity-100 animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 3}s`
                  }}
                />
              ))}
              
              {/* Enhanced icon with 3D effect */}
              <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-primary-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:animate-levitate transition-transform duration-300 shadow-lg">
                {React.cloneElement(feature.icon, { className: "h-8 w-8 text-primary-400 group-hover:animate-rotate3d" })}
                
                {/* Glow effect around icon */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400/30 to-purple-400/30 rounded-2xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300"></div>
              </div>
              
              <div className="relative z-10 space-y-4">
                <h3 className="text-2xl font-bold text-white group-hover:text-primary-400 transition-colors duration-300 group-hover:neon-text">
                  {feature.title}
                </h3>                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                  {feature.description}
                </p>
                
                {/* Feature availability indicator */}
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <CheckCircle className="h-4 w-4 text-green-400 animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">Available Now</span>
                </div>
              </div>
              
              {/* Holographic border effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 animate-gradient-shift"></div>
            </div>
          ))}
        </div>
      </section>      {/* Interviewer Types Section */}
      <section className="py-20 px-4">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-full px-6 py-2">
            <Users className="h-5 w-5 text-green-400" />
            <span className="text-sm font-medium text-gray-200">Meet Your AI Team</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Three Expert
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400">
              AI Interviewers
            </span>
          </h2>          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-16">
            Practice with specialized AI agents, each designed to simulate real interview scenarios
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto perspective-1000 mt-4">
          {interviewerTypes.map((interviewer, index) => (
            <div key={index} className={`group relative ${interviewer.color} ${interviewer.hoverColor} rounded-3xl p-8 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:rotate-y-12 transition-all duration-500 overflow-hidden transform-style-3d`}>
              {/* Enhanced animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent animate-morphing"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full animate-levitate"></div>
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full animate-levitate animation-delay-2000"></div>
              </div>
              
              {/* Matrix-style digital rain effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-0.5 h-8 bg-white animate-matrix"
                    style={{
                      left: `${i * 10}%`,
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>
              
              <div className="relative z-10 space-y-6">
                {/* Enhanced emoji with 3D levitation */}
                <div className="text-6xl group-hover:animate-levitate group-hover:scale-110 transition-transform duration-500 filter drop-shadow-lg">
                  {interviewer.icon}
                  
                  {/* Glow effect around emoji */}
                  <div className="absolute inset-0 text-6xl opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-500">
                    {interviewer.icon}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold group-hover:neon-text transition-all duration-300">
                    {interviewer.type}
                  </h3>
                  <p className="text-white/90 leading-relaxed group-hover:text-white transition-colors duration-300">
                    {interviewer.description}
                  </p>
                </div>                
                {/* Enhanced feature tags with animations */}
                <div className="flex flex-wrap gap-2">
                  {interviewer.features.map((feature, i) => (
                    <span 
                      key={i} 
                      className="relative bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium hover:bg-white/30 transition-all duration-300 cursor-pointer group/tag"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {feature}
                      
                      {/* Micro-interaction on hover */}
                      <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover/tag:opacity-100 animate-pulse transition-opacity duration-300"></div>
                      
                      {/* Success checkmark */}
                      <CheckCircle className="inline-block w-3 h-3 ml-1 text-green-400 opacity-0 group-hover/tag:opacity-100 transition-opacity duration-300" />
                    </span>
                  ))}
                </div>
                  {/* AI Status Indicator */}
                <div className="flex items-center justify-between pt-4 border-t border-white/20">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-white/80">AI Online</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-white/80">Ready to Interview</span>
                    <ArrowRight className="w-3 h-3 text-white/60" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>      {/* How it Works Section */}
      <section className="py-20 px-4 bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-3xl mx-4">
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center space-x-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-full px-6 py-2 shadow-lg">
            <CheckCircle className="h-5 w-5 text-primary-400" />
            <span className="text-sm font-medium text-gray-200">Simple Process</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Get Started in
            <span className="block text-white bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
              4 Easy Steps
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto items-start">
          {[
            { step: "01", title: "Upload Resume", desc: "Upload your resume or paste the job description for personalized questions", icon: <Brain className="h-6 w-6" />, bgColor: "from-blue-500 to-blue-600" },
            { step: "02", title: "Choose Interviewer", desc: "Select from HR, Technical, or Behavioral interviewer based on your needs", icon: <Users className="h-6 w-6" />, bgColor: "from-green-500 to-emerald-600" },
            { step: "03", title: "Practice Interview", desc: "Answer AI-generated questions tailored to your profile and experience", icon: <Target className="h-6 w-6" />, bgColor: "from-purple-500 to-indigo-600" },
            { step: "04", title: "Get Feedback", desc: "Receive detailed feedback and improvement suggestions instantly", icon: <Trophy className="h-6 w-6" />, bgColor: "from-pink-500 to-rose-600" }
          ].map((item, index) => (
            <div key={index} className="relative text-center group perspective-1000 h-full flex flex-col">
              {/* Enhanced connection line with gradient */}
              {index < 3 && (
                <div className="hidden md:block absolute top-16 left-full w-full h-1 bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 transform translate-x-4 -translate-y-1/2 opacity-30 group-hover:opacity-60 transition-opacity duration-300 animate-pulse z-10"></div>
              )}
              
              {/* Enhanced step container - fixed height */}
              <div className="relative transform group-hover:scale-105 transition-all duration-500 mb-6">
                {/* Main step circle with 3D effect */}
                <div className={`relative w-32 h-32 bg-gradient-to-br ${item.bgColor} text-white rounded-3xl flex flex-col items-center justify-center mx-auto shadow-2xl group-hover:shadow-3xl transform group-hover:rotateY-12 transition-all duration-500 border border-white/20`}>
                  {/* Step number with enhanced styling */}
                  <div className="text-3xl font-black text-white/90 leading-none mb-1 transform group-hover:scale-110 transition-transform duration-300">
                    {item.step}
                  </div>
                  
                  {/* Icon inside the circle */}
                  <div className="text-white/80 transform group-hover:animate-levitate">
                    {item.icon}
                  </div>
                  
                  {/* Glowing ring effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                  
                  {/* Floating particles around circle */}
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-70 animate-float transition-opacity duration-300"
                      style={{
                        left: `${15 + (i * 60 / 5)}%`,
                        top: `${10 + (i % 2) * 80}%`,
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: `${2 + Math.random() * 2}s`
                      }}
                    />
                  ))}
                </div>
                
                {/* Enhanced progress indicator */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
              </div>
              
              {/* Enhanced content section - flex-grow to fill remaining space */}
              <div className="flex-grow flex flex-col justify-start space-y-3 transform group-hover:translate-y-2 transition-transform duration-300">
                <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors duration-300 group-hover:neon-text">
                  {item.title}
                </h3>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300 text-sm flex-grow">
                  {item.desc}
                </p>
                
                {/* Status indicator */}
                <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mt-auto">
                  <CheckCircle className="h-4 w-4 text-green-400 animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">Ready</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>      {/* Enhanced CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 text-white rounded-3xl mx-4 mb-8 p-12 md:p-16 shadow-2xl">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent animate-morphing"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full animate-pulse animate-levitate"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full animate-pulse animate-levitate animation-delay-2000"></div>
          
          {/* Matrix rain effect */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-12 bg-white animate-matrix"
                style={{
                  left: `${i * 7}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '4s'
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="relative z-10 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold leading-tight text-white">
              Ready to Ace Your
              <span className="block text-yellow-300 drop-shadow-lg holographic animate-glitch">Next Interview?</span>
            </h2>            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Transform your interview skills with AI-powered practice sessions and get the confidence you need to land your dream job
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {/* Enhanced CTA button with more effects */}
            <Link
              to="/interview"
              className="group relative overflow-hidden bg-white text-primary-600 font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 animate-glow-pulse"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Sparkle effects */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-primary-400 rounded-full animate-pulse"
                    style={{
                      left: `${20 + i * 8}%`,
                      top: `${20 + (i % 3) * 20}%`,
                      animationDelay: `${i * 0.2}s`
                    }}
                  />
                ))}
              </div>
              
              <div className="relative flex items-center space-x-3">
                <Rocket className="h-6 w-6 group-hover:animate-levitate text-primary-600" />
                <span className="text-lg text-black">Start Your First Interview</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </Link>
            
            {/* Enhanced feature badges */}
            <div className="flex flex-wrap justify-center items-center gap-4 text-white/90">
              <div className="flex items-center space-x-2 glass-morphism-dark rounded-full px-4 py-2 hover:scale-105 transition-transform duration-300">
                <span className="text-2xl animate-spin">✨</span>
                <span className="text-sm font-medium">Free to start</span>
              </div>
              <div className="flex items-center space-x-2 glass-morphism-dark rounded-full px-4 py-2 hover:scale-105 transition-transform duration-300">
                <span className="text-2xl animate-bounce">🚀</span>
                <span className="text-sm font-medium">Instant feedback</span>
              </div>
              <div className="flex items-center space-x-2 glass-morphism-dark rounded-full px-4 py-2 hover:scale-105 transition-transform duration-300">
                <span className="text-2xl animate-pulse">🎯</span>
                <span className="text-sm font-medium">Proven results</span>
              </div>
            </div>
          </div>
            {/* Feature highlights instead of false metrics */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300 animate-pulse">AI</div>
              <div className="text-sm text-white/80">Powered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300 animate-pulse animation-delay-500">24/7</div>
              <div className="text-sm text-white/80">Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300 animate-pulse animation-delay-1000">Free</div>
              <div className="text-sm text-white/80">To Start</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
