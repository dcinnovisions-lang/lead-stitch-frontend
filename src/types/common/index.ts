// Common utility types and interfaces

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type Maybe<T> = T | null | undefined

// Common form field types
export interface FormFieldError {
  message: string
  field?: string
}

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

// Common API response wrapper
export interface ApiResponse<T = any> {
  success?: boolean
  data: T
  message?: string
  error?: string
}

// Common error response
export interface ApiError {
  message: string
  code?: string
  errors?: Record<string, string[]>
}

