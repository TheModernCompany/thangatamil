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
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
          <img 
            src={logo} 
            alt="Company Logo" 
            className="w-24 h-24 object-contain rounded-full"
          />
        </div>

        <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">
          Admin Login
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div>
            <label 
              htmlFor="username" 
              className="block text-sm font-medium text-blue-700 mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors text-gray-700"
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
              className="block text-sm font-medium text-blue-700 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors text-gray-700"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition duration-200 transform hover:scale-[1.02] ${
              loading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300'
            } text-white`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Forgot Password Link */}
          <div className="text-center mt-4">
            <a 
              href="#" 
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Forgot password?
            </a>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-blue-100 text-center">
          <p className="text-xs text-blue-400">
            &copy; {new Date().getFullYear()} Admin Panel. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;