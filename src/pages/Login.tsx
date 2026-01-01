import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { login, verifyLoginOTP, clearError } from '../store/slices/authSlice'
import AuthNavbar from '../components/AuthNavbar'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'

interface TouchedFields {
  email: boolean
  password: boolean
}

interface LocationState {
  message?: string
}

function Login() {
  // Load saved email from localStorage if rememberMe was previously checked
  const [email, setEmail] = useState<string>(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    return savedEmail || ''
  })
  const [password, setPassword] = useState<string>('')
  const [emailError, setEmailError] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')
  const [touched, setTouched] = useState<TouchedFields>({ email: false, password: false })
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false)
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    // Check if email was previously remembered
    return !!localStorage.getItem('rememberedEmail')
  })
  // 2FA OTP state
  const [showOTPInput, setShowOTPInput] = useState<boolean>(false)
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState<string>('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, error } = useAppSelector((state: RootState) => state.auth)
  const errorMessage = typeof error === 'string' ? error : (error?.message || '')
  const errorCode = typeof error === 'object' && error?.code ? error.code : null

  useEffect(() => {
    // Check if redirected from registration with success message
    const locationState = location.state as LocationState | null
    if (locationState?.message) {
      setSuccessMessage(locationState.message)
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location])

  useEffect(() => {
    // Show error modal when login fails
    if (error && !showOTPInput) {
      setShowErrorModal(true)
    }
  }, [error, showOTPInput])

  useEffect(() => {
    // Focus first OTP input when OTP input is shown
    if (showOTPInput && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [showOTPInput])

  // Prevent form submission on Enter key if there's an error
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && error) {
      e.preventDefault()
    }
  }

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

  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError('Please fill out this field')
      return false
    }
    setPasswordError('')
    return true
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (touched.email) {
      validateEmail(e.target.value)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (touched.password) {
      validatePassword(e.target.value)
    }
  }

  const handleBlur = (field: keyof TouchedFields) => {
    setTouched({ ...touched, [field]: true })
    if (field === 'email') {
      validateEmail(email)
    } else if (field === 'password') {
      validatePassword(password)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Prevent any default form behavior
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }
    
    // Clear any previous errors
    dispatch(clearError())
    setShowErrorModal(false)
    
    setTouched({ email: true, password: true })
    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)
    
        if (isEmailValid && isPasswordValid) {
      try {
        const result = await dispatch(login({ email, password, rememberMe }))
        if (login.fulfilled.match(result)) {
          // Save email to localStorage if rememberMe is checked
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email)
          } else {
            localStorage.removeItem('rememberedEmail')
          }
          
          // Check if admin login (token provided) or regular user (OTP required)
          if (result.payload.token && !result.payload.requiresOTP) {
            // Admin login - redirect directly
            const user = result.payload.user
            if (user?.role === 'admin') {
              navigate('/admin/dashboard')
            } else {
              navigate('/dashboard')
            }
          } else {
            // Regular user - show OTP input for 2FA
            setShowOTPInput(true)
            setOtp(['', '', '', '', '', ''])
            setOtpError('')
          }
        } else if (login.rejected.match(result)) {
          // Error will be set in Redux state, useEffect will show modal
          // Don't navigate or reload - just show the error
        }
      } catch (err) {
        // Additional error handling if needed
        console.error('Login error:', err)
      }
    }
    
    // Explicitly return false to prevent any form submission
    return false
  }

  // OTP input handlers
  const handleOTPChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setOtpError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('')
        const newOtp = [...otp]
        digits.forEach((digit, i) => {
          if (i < 6) {
            newOtp[i] = digit
          }
        })
        setOtp(newOtp)
        setOtpError('')
        if (digits.length === 6) {
          inputRefs.current[5]?.focus()
        } else if (digits.length > 0) {
          inputRefs.current[digits.length]?.focus()
        }
      })
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const otpString = otp.join('')
    
    // Validate OTP length
    if (otpString.length !== 6) {
      setOtpError('Please enter the complete 6-digit OTP')
      return
    }

    // Clear previous errors
    dispatch(clearError())
    setOtpError('')
    
    try {
      const result = await dispatch(verifyLoginOTP({ email, otp: otpString, rememberMe }))
      if (verifyLoginOTP.fulfilled.match(result)) {
        // Redirect based on user role
        const user = result.payload?.user
        if (user?.role === 'admin') {
          navigate('/admin/dashboard')
        } else {
          navigate('/dashboard')
        }
      } else if (verifyLoginOTP.rejected.match(result)) {
        // Handle OTP errors
        const error = result.payload
        if (error?.code === 'INVALID_OTP' || error?.code === 'OTP_EXPIRED') {
          setOtpError(error.message || 'Invalid OTP. Please try again.')
          // Clear OTP on error
          setOtp(['', '', '', '', '', ''])
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus()
          }
        } else {
          setShowErrorModal(true)
        }
      }
    } catch (err) {
      console.error('OTP verification error:', err)
      setOtpError('An error occurred. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Navigation Bar */}
      <AuthNavbar />

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left Side - Login Form */}
        <div className="w-full order-2 lg:order-1">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 max-w-lg mx-auto">
            {/* Logo/Title */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Welcome back
              </h1>
              <p className="text-gray-600 text-lg">Sign in to continue to Lead Stitch</p>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-800 font-medium">{successMessage}</p>
              </div>
            )}

            {/* Global Error Message - Only show if modal is not shown */}
            {error && !showErrorModal && !showOTPInput && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800 font-medium">{errorMessage}</p>
              </div>
            )}

            {/* OTP Input Form */}
            {showOTPInput ? (
              <>
                <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-800 font-medium mb-1">OTP sent to your email</p>
                    <p className="text-xs text-blue-600">{email}</p>
                  </div>
                </div>

                {/* OTP Error Message */}
                {otpError && (
                  <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-800 font-medium">{otpError}</p>
                  </div>
                )}

                <form onSubmit={handleOTPSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                      Enter 6-digit OTP
                    </label>
                    <div className="flex justify-center gap-3">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            if (el) {
                              inputRefs.current[index] = el
                            }
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOTPChange(index, e.target.value)}
                          onKeyDown={(e) => handleOTPKeyDown(index, e)}
                          className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 border-gray-300 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loading}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.join('').length !== 6}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      'Verify OTP'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowOTPInput(false)
                      setOtp(['', '', '', '', '', ''])
                      setOtpError('')
                      dispatch(clearError())
                    }}
                    className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    ← Back to login
                  </button>
                </form>
              </>
            ) : (
              /* Login Form */
              <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} noValidate className="space-y-6" action="#" method="post">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={() => handleBlur('email')}
                      className={`w-full pl-12 pr-4 py-3.5 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 ${
                        touched.email && emailError
                          ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                      }`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {touched.email && emailError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {emailError}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      onBlur={() => handleBlur('password')}
                      className={`w-full pl-12 pr-12 py-3.5 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 ${
                        touched.password && passwordError
                          ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 focus:outline-none transition-colors p-1.5 rounded-md hover:bg-gray-100"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {touched.password && passwordError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {passwordError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer transition-all hover:border-blue-400" 
                    />
                    <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    'Login'
                  )}
                </button>
              </form>
            )}

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline inline-flex items-center gap-1">
                  Register
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Promotional Content */}
        <div className="hidden lg:flex order-1 lg:order-2 items-center justify-center">
          <div className="relative w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden min-h-[600px]">
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
            
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 py-12 text-center text-white">
              <div className="max-w-md">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl mb-8 border border-white/30 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  Grow Your Business
                </h2>
                <p className="text-lg text-white/90 leading-relaxed mb-10">
                  Generate leads faster with our advanced platform. Connect with decision-makers and scale your business.
                </p>
                <div className="grid grid-cols-3 gap-6 mt-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">10K+</div>
                    <div className="text-sm text-white/80">Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">95%</div>
                    <div className="text-sm text-white/80">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">24/7</div>
                    <div className="text-sm text-white/80">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

      {/* Error Modal */}
      {showErrorModal && error && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
          onClick={() => {
            setShowErrorModal(false)
            dispatch(clearError())
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8 animate-in slide-in-from-top-2" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${
                errorCode === 'USER_NOT_FOUND' ? 'bg-blue-100' : 'bg-red-100'
              }`}>
                {errorCode === 'USER_NOT_FOUND' ? (
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {errorCode === 'USER_NOT_FOUND' ? 'User Not Found' : 'Login Failed'}
                </h3>
                <p className="text-base text-gray-700 leading-relaxed mb-4">
                  {errorMessage}
                </p>
                {errorCode === 'USER_NOT_FOUND' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 font-medium mb-2">Possible reasons:</p>
                    <ul className="text-xs text-blue-700 space-y-1 mb-3 list-disc list-inside">
                      <li>Email address might be misspelled</li>
                      <li>You might not have an account yet</li>
                    </ul>
                    <div className="flex gap-2 flex-wrap">
                      <Link 
                        to="/register" 
                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm underline"
                        onClick={() => {
                          setShowErrorModal(false)
                          dispatch(clearError())
                        }}
                      >
                        Sign up to create an account
                      </Link>
                      {/* TODO: Add forgot email functionality later */}
                      {/* <span className="text-blue-400">•</span>
                      <Link 
                        to="/forgot-password" 
                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm underline"
                        onClick={() => {
                          setShowErrorModal(false)
                          dispatch(clearError())
                        }}
                      >
                        Forgot email?
                      </Link> */}
                    </div>
                  </div>
                )}
                {errorCode === 'INVALID_CREDENTIALS' && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-800 font-medium mb-2">Need help?</p>
                    <Link 
                      to="/forgot-password" 
                      className="text-orange-600 hover:text-orange-700 font-semibold text-sm underline"
                      onClick={() => {
                        setShowErrorModal(false)
                        dispatch(clearError())
                      }}
                    >
                      Reset your password
                    </Link>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowErrorModal(false)
                  dispatch(clearError())
                }}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors text-base ${
                  errorCode === 'USER_NOT_FOUND' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  )
}

export default Login
