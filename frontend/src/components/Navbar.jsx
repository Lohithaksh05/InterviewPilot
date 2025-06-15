import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, BarChart3, User, LogOut, LogIn, Menu, X } from 'lucide-react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
    useEffect(() => {
    // Check if user is logged in on mount
    const checkAuthState = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    // Check auth state on mount
    checkAuthState();

    // Listen for storage changes (when user logs in/out in other tabs or components)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        checkAuthState();
      }
    };

    // Listen for custom auth events
    const handleAuthChange = () => {
      checkAuthState();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);
  // Close mobile menu and user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('nav')) {
        setIsMobileMenuOpen(false);
      }
      if (showUserDropdown && !event.target.closest('.user-dropdown-nav')) {
        setShowUserDropdown(false);
      }
    };

    if (isMobileMenuOpen || showUserDropdown) {
      document.addEventListener('click', handleClickOutside);
    }    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileMenuOpen, showUserDropdown]);const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setIsMobileMenuOpen(false); // Close mobile menu on logout
    setShowUserDropdown(false); // Close user dropdown on logout
    
    // Trigger auth state change event
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    
    toast.success('Logged out successfully');
    navigate('/');
  };
    const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };  return (
    <nav className="bg-gradient-to-r from-slate-900/80 via-gray-900/90 to-slate-900/80 backdrop-blur-xl shadow-2xl border-b border-cyan-500/20 sticky top-0 z-50 animate-slideDown">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-18">          {/* Brand Name - Clean and Simple */}
          <Link to="/" className="group">
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:to-purple-300 transition-all duration-300">
              InterviewPilot
            </span>
          </Link>          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {user && (
              <>
                <Link
                  to="/interview"
                  className={`flex items-center space-x-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-500 group ${
                    isActive('/interview')
                      ? 'text-purple-300 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/40 shadow-lg shadow-purple-500/20'
                      : 'text-gray-300 hover:text-purple-300 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 hover:border hover:border-purple-400/30 hover:shadow-md'
                  }`}
                >
                  <BookOpen className="h-5 w-5 group-hover:animate-pulse" />
                  <span>Start Interview</span>
                </Link>

                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-500 group ${
                    isActive('/dashboard')
                      ? 'text-emerald-300 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 shadow-lg shadow-emerald-500/20'
                      : 'text-gray-300 hover:text-emerald-300 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-teal-500/10 hover:border hover:border-emerald-400/30 hover:shadow-md'
                  }`}
                >
                  <BarChart3 className="h-5 w-5 group-hover:animate-pulse" />
                  <span>Dashboard</span>
                </Link>
              </>
            )}
          </div>          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative user-dropdown-nav">                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center p-2 rounded-full bg-gradient-to-r from-slate-800/50 to-gray-800/50 border border-white/10 hover:border-cyan-400/30 transition-all duration-300"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center justify-center">
                    <User className="h-4 w-4 text-black font-bold" />
                  </div>
                </button>                {/* User Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-800/95 backdrop-blur-md border border-gray-600/50 rounded-2xl shadow-xl z-50">
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
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-semibold text-gray-300 hover:text-cyan-300 bg-gradient-to-r from-slate-800/30 to-gray-800/30 hover:from-cyan-500/10 hover:to-blue-500/10 border border-white/10 hover:border-cyan-400/30 transition-all duration-300 group"
                >
                  <LogIn className="h-4 w-4 group-hover:animate-bounce" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
                >
                  <span>Sign Up</span>
                  <User className="h-4 w-4 group-hover:animate-pulse" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-300 hover:text-cyan-300 p-3 rounded-2xl bg-gradient-to-r from-slate-800/30 to-gray-800/30 hover:from-cyan-500/10 hover:to-blue-500/10 border border-white/10 hover:border-cyan-400/30 transition-all duration-300 group"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 group-hover:animate-spin" />
              ) : (
                <Menu className="h-6 w-6 group-hover:animate-pulse" />
              )}
            </button>
          </div>
        </div>        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 bg-gray-900">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user && (
                <>
                  <Link
                    to="/interview"
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive('/interview')
                        ? 'text-primary-400 bg-gray-800/80'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <BookOpen className="h-5 w-5" />
                    <span>Start Interview</span>
                  </Link>

                  <Link
                    to="/dashboard"
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive('/dashboard')
                        ? 'text-primary-400 bg-gray-800/80'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Auth Section */}
            <div className="border-t border-gray-700 px-2 pt-4 pb-3">
              {user ? (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 px-3 py-2">                    <User className="h-5 w-5 text-gray-300" />
                    <span className="text-base text-gray-200">{user.username || user.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/signup"
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                  >
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
