import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  globalError: null,
  errorType: null, // 'api', 'network', 'validation', 'unknown'
  timestamp: null,
}

const errorSlice = createSlice({
  name: 'error',
  initialState,
  reducers: {
    setGlobalError: (state, action) => {
      state.globalError = action.payload.message || action.payload
      state.errorType = action.payload.type || 'unknown'
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

