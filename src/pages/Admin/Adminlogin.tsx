// src/pages/Admin/Adminlogin.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/Logo.png';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/admin/dashboard');
      } else {
        setError('Invalid username or password. Please try again.');
        setPassword('');
      }
    } catch (error) {
      setError('An error occurred during login. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Black background with subtle gold gradient overlay
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Decorative gold glow effects */}
      <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-gradient-to-br from-yellow-500/5 via-transparent to-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-50%] right-[-50%] w-full h-full bg-gradient-to-tl from-yellow-600/5 via-transparent to-yellow-600/5 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Main Card - Black with gold borders */}
      <div className="bg-black/90 backdrop-blur-sm p-8 rounded-2xl shadow-[0_0_50px_rgba(255,215,0,0.15)] w-full max-w-md border border-yellow-600/30 relative z-10">
        
        {/* Logo Section with Gold Accent Ring */}
        <div className="flex justify-center mb-8 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border-2 border-yellow-500/30 animate-pulse"></div>
          </div>
          <img 
            src={logo} 
            alt="Company Logo" 
            className="w-24 h-24 object-contain rounded-full border-2 border-yellow-500/50 shadow-[0_0_30px_rgba(255,215,0,0.2)] relative z-10"
          />
        </div>

        {/* Title with Gold Text */}
        <h2 className="text-3xl font-bold text-center text-yellow-400 mb-8 tracking-wide">
          Admin Login
          <span className="block w-20 h-0.5 bg-gradient-to-r from-yellow-400/0 via-yellow-400 to-yellow-400/0 mx-auto mt-3"></span>
        </h2>

        {/* Error Message - Gold/Amber themed */}
        {error && (
          <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500/50 text-yellow-300 rounded-lg text-sm backdrop-blur-sm">
            <span className="inline-block mr-2">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div>
            <label 
              htmlFor="username" 
              className="block text-sm font-medium text-yellow-400 mb-2 tracking-wider"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-600/30 rounded-lg focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300 text-white placeholder:text-yellow-600/40"
              placeholder="Enter your username"
              required
              autoComplete="username"
              disabled={loading}
            />
          </div>

          {/* Password Field */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-yellow-400 mb-2 tracking-wider"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-600/30 rounded-lg focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300 text-white placeholder:text-yellow-600/40"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {/* Login Button - Gold gradient */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-[1.02] ${
              loading 
                ? 'bg-yellow-700/50 cursor-not-allowed text-yellow-300/50' 
                : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_rgba(255,215,0,0.5)]'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-yellow-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer - Gold text */}
        <div className="mt-8 pt-6 border-t border-yellow-600/20 text-center">
          <p className="text-xs text-yellow-600/60 tracking-wider">
            &copy; {new Date().getFullYear()} Admin Panel. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;