import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AxiosError } from 'axios'
import api from '../config/api'

function ForgotPassword() {
  const [email, setEmail] = useState<string>('')
  const [emailError, setEmailError] = useState<string>('')
  const [touched, setTouched] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false)
  const navigate = useNavigate()

  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError('Please fill out this field')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError('')
    return true
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setError('')
    if (touched) {
      validateEmail(e.target.value)
    }
  }

  const handleBlur = () => {
    setTouched(true)
    validateEmail(email)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setTouched(true)
    setError('')
    
    const isEmailValid = validateEmail(email)
    
    if (!isEmailValid) {
      return
    }

    setLoading(true)
    try {
      const response = await api.post<{ message?: string; email?: string }>('/auth/forgot-password', { email })
      
      if (response.data.message === 'Kindly signup') {
        setShowErrorModal(true)
        setLoading(false)
        return
      }

      // OTP sent successfully - navigate to verify OTP page with email
      navigate('/verify-otp', { state: { email: response.data.email || email } })
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      console.error('Forgot password error:', err)
      
      // Handle specific error cases
      if (axiosError.response?.data?.message === 'Kindly signup') {
        setShowErrorModal(true)
        setLoading(false)
        return
      }
      
      // Get error message from response or use default
      let errorMessage = 'Failed to send OTP. Please try again.'
      
      if (axiosError.response?.data?.message) {
        const backendMessage = axiosError.response.data.message
        
        // Map backend error messages to user-friendly messages
        if (backendMessage === 'Internal server error') {
          errorMessage = 'Something went wrong on our end. Please try again in a few moments. If the problem persists, please contact support.'
        } else if (backendMessage.includes('Email service not configured')) {
          errorMessage = 'Email service is temporarily unavailable. Please contact support for assistance.'
        } else if (backendMessage.includes('Failed to send OTP email')) {
          errorMessage = 'We couldn\'t send the OTP email. Please check your email address and try again, or contact support if the issue continues.'
        } else if (backendMessage === 'Email is required') {
          errorMessage = 'Please enter your email address.'
        } else {
          // Use the backend message if it's already user-friendly
          errorMessage = backendMessage
        }
      } else if (axiosError.message === 'Network Error' || !axiosError.response) {
        // Network error - no response from server
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.'
      } else if (axiosError.response?.status === 500) {
        // Generic 500 error
        errorMessage = 'Server error occurred. Please try again in a few moments. If the problem persists, please contact support.'
      } else if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
        // Client error (4xx)
        errorMessage = 'Invalid request. Please check your email address and try again.'
      }
      
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md mx-auto relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-200/50">
          {/* Logo/Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2">
              Lead Stitch
            </h1>
            <p className="text-gray-600 text-base">Enter your email to receive a password reset OTP</p>
          </div>

          {/* Global Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                  touched && emailError
                    ? 'border-red-500 bg-red-50/50 focus:border-red-500' 
                    : touched && !emailError && email.trim().length > 0
                    ? 'border-green-500 bg-green-50/30 focus:border-green-500'
                    : 'border-gray-300 bg-white focus:border-blue-500 hover:border-gray-400'
                }`}
                placeholder="your@email.com"
                disabled={loading}
              />
              {touched && emailError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {emailError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 active:from-blue-700 active:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending OTP...
                </span>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>

      {/* Error Modal - Kindly signup - Bigger */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in slide-in-from-top-2">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Email Not Found</h3>
                <p className="text-base text-gray-700 leading-relaxed">The email address you entered is not registered in our system. Kindly signup to create a new account.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowErrorModal(false)
                  navigate('/register')
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-base"
              >
                Sign Up
              </button>
              <button
                onClick={() => setShowErrorModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}

export default ForgotPassword

