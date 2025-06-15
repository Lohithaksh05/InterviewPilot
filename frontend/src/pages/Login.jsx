import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { Mail, Lock, Eye, EyeOff, UserCheck, Sparkles, Zap, Shield } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
        if (response.access_token) {
        // Store token in localStorage
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Trigger auth state change event for Navbar
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        
        toast.success('Login successful!');
        
        // Redirect to intended page or dashboard
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: error.message || 'Login failed' });
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb bg-gradient-to-r from-cyan-400/20 to-purple-500/20 w-72 h-72 -top-36 -left-36"></div>
        <div className="floating-orb bg-gradient-to-r from-purple-500/20 to-pink-500/20 w-96 h-96 -top-48 -right-48 animation-delay-2000"></div>
        <div className="floating-orb bg-gradient-to-r from-blue-500/20 to-cyan-400/20 w-64 h-64 bottom-0 left-1/4 animation-delay-4000"></div>
        <div className="floating-orb bg-gradient-to-r from-pink-500/20 to-purple-500/20 w-80 h-80 bottom-0 right-0 animation-delay-6000"></div>
      </div>

      <div className="relative z-10 max-w-md w-full animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="relative">              <div className="bg-gradient-to-r from-cyan-500 to-purple-600 p-4 rounded-2xl shadow-2xl shadow-purple-500/25">
                <UserCheck className="h-10 w-10 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-purple-400/30 rounded-2xl animate-pulse blur-xl"></div>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x mb-4">
            Welcome Back
          </h2>
          <p className="text-xl text-gray-300 font-medium">
            Sign in to continue your AI interview journey
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8 animate-fade-in-up animation-delay-200">
          {errors.general && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-2xl text-red-300 text-sm animate-shake">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-red-400" />
                <span>{errors.general}</span>
              </div>
            </div>
          )}          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-lg font-semibold text-white">
                Email Address
              </label>
              <div className="relative group">                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-cyan-400 group-focus-within:text-cyan-300 transition-colors duration-300" />
                </div><input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-12 pr-4 py-4 bg-gradient-to-br from-slate-900/90 via-gray-900/80 to-slate-800/90 border border-cyan-500/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/60 transition-all duration-300 text-white placeholder-cyan-200/60 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10 backdrop-blur-md"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-lg font-semibold text-white">
                Password
              </label>
              <div className="relative group">                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-cyan-400 group-focus-within:text-cyan-300 transition-colors duration-300" />
                </div><input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-12 pr-14 py-4 bg-gradient-to-br from-slate-900/90 via-gray-900/80 to-slate-800/90 border border-cyan-500/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/60 transition-all duration-300 text-white placeholder-cyan-200/60 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10 backdrop-blur-md"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center group"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-cyan-400 transition-colors duration-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-cyan-400 transition-colors duration-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-6 w-6 transition-transform duration-300" />
                  <span>Sign in</span>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            </button>
          </form>          {/* Divider */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600/50" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-900 text-gray-400 font-medium">New to InterviewPilot?</span>
              </div>
            </div>
          </div>

          {/* Sign up link */}
          <div className="mt-8 text-center">
            <Link
              to="/signup"
              className="group inline-flex items-center space-x-2 font-semibold text-lg bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent hover:from-cyan-300 hover:to-purple-300 transition-all duration-300"
            >
              <span>Create your account</span>
              <Sparkles className="h-5 w-5 text-cyan-400 transition-all duration-300" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center animate-fade-in-up animation-delay-400">
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <Shield className="h-4 w-4 text-cyan-400" />
            <p className="text-sm">
              Secure login powered by industry-standard encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
