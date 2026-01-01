// Common API types that don't fit in other categories

export interface ApiResponse<T = any> {
  success?: boolean
  data: T
  message?: string
  error?: string
}

export interface ApiError {
  message: string
  code?: string
  errors?: Record<string, string[]>
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

