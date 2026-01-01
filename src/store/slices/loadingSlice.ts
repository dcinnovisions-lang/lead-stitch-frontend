import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { LoadingState } from '../../types/redux/loading.types'

const initialState: LoadingState = {
  globalLoading: false,
  loadingOperations: {},
}

interface SetLoadingOperationPayload {
  operation: string
  loading: boolean
}

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload
    },
    setLoadingOperation: (state, action: PayloadAction<SetLoadingOperationPayload>) => {
      const { operation, loading } = action.payload
      if (loading) {
        state.loadingOperations[operation] = true
        state.globalLoading = true
      } else {
        delete state.loadingOperations[operation]
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

