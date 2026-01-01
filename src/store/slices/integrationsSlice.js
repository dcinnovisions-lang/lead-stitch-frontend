import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../config/api'

// Async thunks
export const getLinkedInCredentials = createAsyncThunk(
  'integrations/getLinkedInCredentials',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/integrations/linkedin')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch LinkedIn credentials')
    }
  }
)

export const saveLinkedInCredentials = createAsyncThunk(
  'integrations/saveLinkedInCredentials',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/integrations/linkedin', {
        email,
        password,
        skipVerification: true,
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save LinkedIn credentials')
    }
  }
)

export const deleteLinkedInCredentials = createAsyncThunk(
  'integrations/deleteLinkedInCredentials',
  async (_, { rejectWithValue }) => {
    try {
      await api.delete('/integrations/linkedin')
      return true
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete LinkedIn credentials')
    }
  }
)

const initialState = {
  linkedInCredentials: null,
  loading: false,
  saving: false,
  error: null,
}

const integrationsSlice = createSlice({
  name: 'integrations',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Get LinkedIn Credentials
      .addCase(getLinkedInCredentials.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getLinkedInCredentials.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.exists) {
          state.linkedInCredentials = action.payload.credentials
        } else {
          state.linkedInCredentials = null
        }
      })
      .addCase(getLinkedInCredentials.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Save LinkedIn Credentials
      .addCase(saveLinkedInCredentials.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(saveLinkedInCredentials.fulfilled, (state, action) => {
        state.saving = false
        if (action.payload.success) {
          // Credentials saved successfully, but we need to fetch again to get the updated data
          // The credentials will be updated when getLinkedInCredentials is called
        }
      })
      .addCase(saveLinkedInCredentials.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload
      })
      // Delete LinkedIn Credentials
      .addCase(deleteLinkedInCredentials.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(deleteLinkedInCredentials.fulfilled, (state) => {
        state.saving = false
        state.linkedInCredentials = null
      })
      .addCase(deleteLinkedInCredentials.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload
      })
  },
})

export const { clearError } = integrationsSlice.actions
export default integrationsSlice.reducer

