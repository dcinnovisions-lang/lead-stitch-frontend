import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  globalLoading: false,
  loadingOperations: {}, // Track individual operations: { 'campaigns/fetch': true, 'tickets/create': false }
}

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload
    },
    setLoadingOperation: (state, action) => {
      const { operation, loading } = action.payload
      if (loading) {
        state.loadingOperations[operation] = true
        state.globalLoading = true // Set global loading if any operation is loading
      } else {
        delete state.loadingOperations[operation]
        // Set global loading to false only if no operations are loading
        state.globalLoading = Object.keys(state.loadingOperations).length > 0
      }
    },
    clearAllLoading: (state) => {
      state.globalLoading = false
      state.loadingOperations = {}
    },
  },
})

export const { setGlobalLoading, setLoadingOperation, clearAllLoading } = loadingSlice.actions
export default loadingSlice.reducer

