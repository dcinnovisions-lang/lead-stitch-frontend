import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { clearGlobalError } from '../store/slices/errorSlice'

function GlobalErrorToast() {
  const dispatch = useAppDispatch()
  const { globalError, errorType } = useAppSelector((state) => state.error)

  useEffect(() => {
    if (globalError) {
      const timer = setTimeout(() => {
        dispatch(clearGlobalError())
      }, 8000)

      return () => clearTimeout(timer)
    }
  }, [globalError, dispatch])

  if (!globalError) return null

  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        )
      case 'api':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        )
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in-right">
      <div className="bg-red-50 border-2 border-red-300 rounded-xl shadow-xl p-4 flex items-start gap-3">
        <div className="flex-shrink-0 text-red-600 mt-0.5">{getErrorIcon()}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-900 mb-1">Error</h3>
          <p className="text-sm text-red-800 break-words">{globalError}</p>
        </div>
        <button
          onClick={() => dispatch(clearGlobalError())}
          className="flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
          aria-label="Dismiss error"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default GlobalErrorToast

