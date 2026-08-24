import React, { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import backgroundImage from '../assets/Background_Image.png'; // Adjust path as needed

// API Base URL - adjust based on your environment
const API_BASE_URL =  'http://localhost:8000';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    location: '',
    category: '',
    enquiryType: 'retail' // manufacturing, wholesale, retail
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Axios instance
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!formData.contactNumber.trim()) {
      toast.error('Please enter your contact number');
      return;
    }
    if (formData.contactNumber.trim().length < 5) {
      toast.error('Contact number must be at least 5 characters');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await api.post('/api/submissions', {
        name: formData.name.trim(),
        contactNumber: formData.contactNumber.trim(),
        location: formData.location.trim() || undefined,
        category: formData.category.trim() || undefined,
        enquiryType: formData.enquiryType
      });

      console.log('Form submitted successfully:', response.data);
      
      // Show success message
      toast.success('Thank you! We\'ll get back to you soon.');
      setSubmitSuccess(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        setFormData({
          name: '',
          contactNumber: '',
          location: '',
          category: '',
          enquiryType: 'retail'
        });
      }, 3000);

    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      let errorMsg = 'Failed to submit. Please try again.';
      
      if (error.response) {
        // Server responded with error
        if (error.response.data?.detail) {
          errorMsg = error.response.data.detail;
        } else if (error.response.status === 400) {
          errorMsg = 'Please check your input and try again.';
        } else if (error.response.status === 500) {
          errorMsg = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // Request made but no response
        errorMsg = 'Network error. Please check your connection.';
      }
      
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ 
        backgroundImage: `url(${backgroundImage})`,
        backgroundColor: '#1a0a0a',
      }}
    >
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-bold text-yellow-400 mb-4 tracking-wider">
            THANGATAMIL
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
            CRACKERS
          </h3>
          <div className="w-24 h-1 bg-red-600 mx-auto my-4"></div>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Bringing Joy, Lights & Happiness to Your Celebrations
          </p>
        </div>

        {/* Contact Form */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
            <h3 className="text-3xl font-bold text-white mb-6 text-center">Get In Touch</h3>
            
            {submitSuccess && (
              <div className="bg-green-500/20 border border-green-400 text-green-200 px-4 py-3 rounded-lg mb-6 text-center">
                Thank you! We'll get back to you soon.
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-500/20 border border-red-400 text-red-200 px-4 py-3 rounded-lg mb-6 text-center">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Location / Address
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your city or address"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., Wedding, Festival, Event"
                />
              </div>

              {/* Enquiry Type */}
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Enquiry Type *
                </label>
                <select
                  name="enquiryType"
                  value={formData.enquiryType}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="retail" className="text-black">Retail</option>
                  <option value="wholesale" className="text-black">Wholesale</option>
                  <option value="manufacturing" className="text-black">Manufacturing</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-red-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;