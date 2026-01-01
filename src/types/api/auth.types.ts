// Auth API types

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface User {
  id: number
  email: string
  firstName?: string
  lastName?: string
  first_name?: string
  last_name?: string
  role?: 'user' | 'admin'
  is_active?: boolean
  isActive?: boolean
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  suspended_at?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginResponse extends AuthResponse {}

export interface LoginOTPResponse {
  message: string
  email?: string
  requiresOTP: boolean
  token?: string
  user?: User
}

export interface VerifyLoginOTPCredentials {
  email: string
  otp: string
}

export interface RegisterResponse {
  message?: string
  user?: User
}

