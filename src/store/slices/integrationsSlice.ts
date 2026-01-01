import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../../config/api'
import type { LinkedInCredentials } from '../../types/api/integration.types'

interface SaveLinkedInCredentialsPayload {
  email: string
  password: string
}

interface LinkedInCredentialsResponse {
  exists: boolean
  credentials?: LinkedInCredentials
}

interface IntegrationsState {
  linkedInCredentials: LinkedInCredentials | null
  loading: boolean
  saving: boolean
  error: string | null
}

// Async thunks
export const getLinkedInCredentials = createAsyncThunk<
  LinkedInCredentialsResponse,
  void,
  { rejectValue: string }
>(
  'integrations/getLinkedInCredentials',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<LinkedInCredentialsResponse>('/integrations/linkedin')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch LinkedIn credentials')
    }
  }
)

export const saveLinkedInCredentials = createAsyncThunk<
  { success: boolean; message?: string },
  SaveLinkedInCredentialsPayload,
  { rejectValue: string }
>(
  'integrations/saveLinkedInCredentials',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post<{ success: boolean; message?: string }>('/integrations/linkedin', {
        email,
        password,
        skipVerification: true,
      })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save LinkedIn credentials')
    }
  }
)

export const deleteLinkedInCredentials = createAsyncThunk<
  boolean,
  void,
  { rejectValue: string }
>(
  'integrations/deleteLinkedInCredentials',
  async (_, { rejectWithValue }) => {
    try {
      await api.delete('/integrations/linkedin')
      return true
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete LinkedIn credentials')
    }
  }
)

const initialState: IntegrationsState = {
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
          state.linkedInCredentials = action.payload.credentials || null
        } else {
          state.linkedInCredentials = null
        }
      })
      .addCase(getLinkedInCredentials.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch LinkedIn credentials'
      })
      // Save LinkedIn Credentials
      .addCase(saveLinkedInCredentials.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(saveLinkedInCredentials.fulfilled, (state) => {
        state.saving = false
      })
      .addCase(saveLinkedInCredentials.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload || 'Failed to save LinkedIn credentials'
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
        state.error = action.payload || 'Failed to delete LinkedIn credentials'
      })
  },
})

export const { clearError } = integrationsSlice.actions
export default integrationsSlice.reducer

