import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { ErrorState, ErrorType } from '../../types/redux/error.types'

const initialState: ErrorState = {
  globalError: null,
  errorType: null,
  timestamp: null,
}

interface SetErrorPayload {
  message?: string
  type?: ErrorType
}

const errorSlice = createSlice({
  name: 'error',
  initialState,
  reducers: {
    setGlobalError: (state, action: PayloadAction<string | SetErrorPayload>) => {
      if (typeof action.payload === 'string') {
        state.globalError = action.payload
        state.errorType = 'unknown'
      } else {
        state.globalError = action.payload.message || null
        state.errorType = action.payload.type || 'unknown'
      }
      state.timestamp = Date.now()
    },
    clearGlobalError: (state) => {
      state.globalError = null
      state.errorType = null
      state.timestamp = null
    },
  },
})

export const { setGlobalError, clearGlobalError } = errorSlice.actions
export default errorSlice.reducer

