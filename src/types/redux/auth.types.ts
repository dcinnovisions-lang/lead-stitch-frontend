// Auth Redux types
import { User } from '../api/auth.types'

export interface AuthError {
  message: string
  code?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: AuthError | string | null
}

