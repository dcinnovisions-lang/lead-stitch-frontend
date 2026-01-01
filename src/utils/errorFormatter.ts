/**
 * Error formatting utilities for displaying structured errors from the API
 */

interface StructuredError {
  error_code?: string
  category?: string
  message?: string
  user_message?: string
  actionable?: boolean
  retry?: boolean
  details?: string
  timestamp?: string
}

interface ErrorDetails {
  has_errors?: boolean
  errors?: StructuredError[]
  primary_error?: StructuredError
  error_summary?: {
    total_errors?: number
    error_categories?: string[]
    can_retry?: boolean
    actionable?: boolean
  }
}

/**
 * Extract user-friendly error message from API response
 */
export function getErrorMessage(error: any): string {
  // Check for structured error details first
  if (error?.response?.data?.error_details) {
    const errorDetails: ErrorDetails = error.response.data.error_details
    
    if (errorDetails.primary_error?.user_message) {
      return errorDetails.primary_error.user_message
    }
    
    if (errorDetails.errors && errorDetails.errors.length > 0) {
      // Return first error's user message
      const firstError = errorDetails.errors[0]
      if (firstError.user_message) {
        return firstError.user_message
      }
      if (firstError.message) {
        return firstError.message
      }
    }
  }
  
  // Check for direct error message in response
  if (error?.response?.data?.error) {
    return error.response.data.error
  }
  
  // Check for message field
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  
  // Fallback to error string
  if (typeof error === 'string') {
    return error
  }
  
  if (error?.message) {
    return error.message
  }
  
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Get error code from API response
 */
export function getErrorCode(error: any): string | null {
  if (error?.response?.data?.error_details?.primary_error?.error_code) {
    return error.response.data.error_details.primary_error.error_code
  }
  
  if (error?.response?.data?.error_code) {
    return error.response.data.error_code
  }
  
  return null
}

/**
 * Check if error is retryable
 */
export function isErrorRetryable(error: any): boolean {
  if (error?.response?.data?.error_details?.primary_error?.retry !== undefined) {
    return error.response.data.error_details.primary_error.retry === true
  }
  
  if (error?.response?.data?.error_details?.error_summary?.can_retry !== undefined) {
    return error.response.data.error_details.error_summary.can_retry === true
  }
  
  // Default: allow retry for most errors
  return true
}

/**
 * Get error category
 */
export function getErrorCategory(error: any): string | null {
  if (error?.response?.data?.error_details?.primary_error?.category) {
    return error.response.data.error_details.primary_error.category
  }
  
  return null
}

/**
 * Get all errors from API response (for displaying multiple errors)
 */
export function getAllErrors(error: any): StructuredError[] {
  if (error?.response?.data?.error_details?.errors) {
    return error.response.data.error_details.errors
  }
  
  return []
}

/**
 * Format error message for display with icon/category information
 */
export function formatErrorDisplay(error: any): {
  message: string
  code: string | null
  category: string | null
  retryable: boolean
  actionable: boolean
  icon?: string
  color?: string
} {
  const message = getErrorMessage(error)
  const code = getErrorCode(error)
  const category = getErrorCategory(error)
  const retryable = isErrorRetryable(error)
  
  const errorDetails = error?.response?.data?.error_details
  const primaryError = errorDetails?.primary_error
  const actionable = primaryError?.actionable ?? false
  
  // Determine icon and color based on category
  let icon = '⚠️'
  let color = 'text-red-600'
  
  if (category === 'AUTH_ERROR') {
    icon = '🔐'
    color = 'text-orange-600'
  } else if (category === 'RATE_LIMIT_ERROR') {
    icon = '⏱️'
    color = 'text-yellow-600'
  } else if (category === 'SYSTEM_ERROR') {
    icon = '🔧'
    color = 'text-red-600'
  } else if (category === 'NETWORK_ERROR') {
    icon = '🌐'
    color = 'text-blue-600'
  } else if (category === 'USER_ERROR') {
    icon = '📝'
    color = 'text-gray-600'
  }
  
  return {
    message,
    code,
    category,
    retryable,
    actionable,
    icon,
    color,
  }
}

