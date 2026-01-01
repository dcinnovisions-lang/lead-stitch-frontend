import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../../config/api'
import type { LoginCredentials, RegisterData, User, AuthResponse, LoginResponse, LoginOTPResponse, VerifyLoginOTPCredentials } from '../../types/api/auth.types'
import type { AuthState, AuthError } from '../../types/redux/auth.types'

// Helper function to get token from storage
const getTokenFromStorage = (): string | null => {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || null
}

// Async thunks
export const login = createAsyncThunk<
  LoginOTPResponse,
  LoginCredentials,
  { rejectValue: AuthError }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { rememberMe, ...loginData } = credentials
      const response = await api.post<LoginOTPResponse>('/auth/login', loginData)
      
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
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Login failed'
      const errorCode = error.response?.data?.message
      return rejectWithValue({ message: errorMessage, code: errorCode })
    }
  }
)

export const verifyLoginOTP = createAsyncThunk<
  AuthResponse,
  VerifyLoginOTPCredentials & { rememberMe?: boolean },
  { rejectValue: AuthError }
>(
  'auth/verifyLoginOTP',
  async (credentials, { rejectWithValue }) => {
    try {
      const { rememberMe, ...otpData } = credentials
      const response = await api.post<LoginResponse>('/auth/verify-login-otp', otpData)
      
      // Save token to localStorage if rememberMe is true, otherwise sessionStorage
      if (rememberMe) {
        localStorage.setItem('token', response.data.token)
        sessionStorage.removeItem('token')
      } else {
        sessionStorage.setItem('token', response.data.token)
        localStorage.removeItem('token')
      }
      
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'OTP verification failed'
      const errorCode = error.response?.data?.message
      return rejectWithValue({ message: errorMessage, code: errorCode })
    }
  }
)

export const register = createAsyncThunk<
  any,
  RegisterData,
  { rejectValue: string }
>(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Unable to create account. Please try again.'
      return rejectWithValue(errorMessage)
    }
  }
)

export const getCurrentUser = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<User>('/auth/me')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user')
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
  localStorage.removeItem('rememberedEmail')
  return null
})

const initialState: AuthState = {
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
          state.user = action.payload.user || null
        }
        // For regular users, OTP verification will complete the login
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Login failed'
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
        state.error = action.payload || 'OTP verification failed'
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false
        state.isAuthenticated = false
        state.token = null
        state.user = null
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Registration failed'
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

