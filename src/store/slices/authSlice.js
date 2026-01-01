import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../config/api'

// Helper function to get token from storage
const getTokenFromStorage = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || null
}

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { rememberMe, ...loginData } = credentials
      const response = await api.post('/auth/login', loginData)
      
      // If admin, token is returned directly - save it
      if (response.data.token && !response.data.requiresOTP) {
        if (rememberMe) {
          localStorage.setItem('token', response.data.token)
          sessionStorage.removeItem('token')
        } else {
          sessionStorage.setItem('token', response.data.token)
          localStorage.removeItem('token')
        }
      }
      
      return response.data
    } catch (error) {
      // Return the error message or error object from backend
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Login failed'
      const errorCode = error.response?.data?.message // USER_NOT_FOUND or INVALID_CREDENTIALS
      return rejectWithValue({ message: errorMessage, code: errorCode })
    }
  }
)

export const verifyLoginOTP = createAsyncThunk(
  'auth/verifyLoginOTP',
  async (credentials, { rejectWithValue }) => {
    try {
      const { rememberMe, ...otpData } = credentials
      const response = await api.post('/auth/verify-login-otp', otpData)
      
      // Save token to localStorage if rememberMe is true, otherwise sessionStorage
      if (rememberMe) {
        localStorage.setItem('token', response.data.token)
        sessionStorage.removeItem('token')
      } else {
        sessionStorage.setItem('token', response.data.token)
        localStorage.removeItem('token')
      }
      
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'OTP verification failed'
      const errorCode = error.response?.data?.message
      return rejectWithValue({ message: errorMessage, code: errorCode })
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData)
      // Don't store token or auto-login after registration
      // User needs to login manually with their credentials
      return response.data
    } catch (error) {
      // Return user-friendly error message from backend
      const errorMessage = error.response?.data?.message || 'Unable to create account. Please try again.'
      return rejectWithValue(errorMessage)
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user')
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  // Clear token from both storages
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
  // Also clear remembered email
  localStorage.removeItem('rememberedEmail')
  return null
})

const initialState = {
  user: null,
  token: getTokenFromStorage(),
  isAuthenticated: !!getTokenFromStorage(),
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        // If admin login (token provided), set authenticated immediately
        if (action.payload.token && !action.payload.requiresOTP) {
          state.isAuthenticated = true
          state.token = action.payload.token
          state.user = action.payload.user
        }
        // For regular users, OTP verification will complete the login
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Verify Login OTP
      .addCase(verifyLoginOTP.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(verifyLoginOTP.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.token = action.payload.token
        state.user = action.payload.user
      })
      .addCase(verifyLoginOTP.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false
        // Don't auto-login after registration
        // User needs to login manually with their credentials
        state.isAuthenticated = false
        state.token = null
        state.user = null
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Get Current User
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isAuthenticated = false
        state.token = null
        state.user = null
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer

