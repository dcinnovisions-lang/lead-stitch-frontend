// Error Redux types

export type ErrorType = 'api' | 'network' | 'validation' | 'unknown'

export interface ErrorState {
  globalError: string | null
  errorType: ErrorType | null
  timestamp: number | null
}

