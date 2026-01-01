import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../config/api'

// Async thunks
export const getDecisionMakers = createAsyncThunk(
  'decisionMakers/getDecisionMakers',
  async (requirementId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/decision-makers/requirement/${requirementId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch decision makers')
    }
  }
)

export const createDecisionMaker = createAsyncThunk(
  'decisionMakers/createDecisionMaker',
  async ({ requirementId, roleTitle, priority }, { rejectWithValue }) => {
    try {
      const response = await api.post('/decision-makers', {
        requirementId,
        roleTitle,
        priority: priority || null,
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create decision maker')
    }
  }
)

export const updateDecisionMaker = createAsyncThunk(
  'decisionMakers/updateDecisionMaker',
  async ({ id, roleTitle, priority }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/decision-makers/${id}`, {
        roleTitle,
        priority,
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update decision maker')
    }
  }
)

export const deleteDecisionMaker = createAsyncThunk(
  'decisionMakers/deleteDecisionMaker',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/decision-makers/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete decision maker')
    }
  }
)

export const finalizeDecisionMakers = createAsyncThunk(
  'decisionMakers/finalizeDecisionMakers',
  async (requirementId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/decision-makers/requirement/${requirementId}/finalize`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to finalize decision makers')
    }
  }
)

const initialState = {
  decisionMakers: [],
  loading: false,
  error: null,
}

const decisionMakerSlice = createSlice({
  name: 'decisionMakers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Get decision makers
    builder
      .addCase(getDecisionMakers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getDecisionMakers.fulfilled, (state, action) => {
        state.loading = false
        state.decisionMakers = action.payload
      })
      .addCase(getDecisionMakers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Create decision maker
    builder
      .addCase(createDecisionMaker.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createDecisionMaker.fulfilled, (state, action) => {
        state.loading = false
        state.decisionMakers.push(action.payload)
      })
      .addCase(createDecisionMaker.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Update decision maker
    builder
      .addCase(updateDecisionMaker.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateDecisionMaker.fulfilled, (state, action) => {
        state.loading = false
        const index = state.decisionMakers.findIndex(dm => dm.id === action.payload.id)
        if (index !== -1) {
          state.decisionMakers[index] = action.payload
        }
      })
      .addCase(updateDecisionMaker.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Delete decision maker
    builder
      .addCase(deleteDecisionMaker.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteDecisionMaker.fulfilled, (state, action) => {
        state.loading = false
        state.decisionMakers = state.decisionMakers.filter(dm => dm.id !== action.payload)
      })
      .addCase(deleteDecisionMaker.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Finalize decision makers
    builder
      .addCase(finalizeDecisionMakers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(finalizeDecisionMakers.fulfilled, (state, action) => {
        state.loading = false
        // Decision makers are finalized, ready for scraping
      })
      .addCase(finalizeDecisionMakers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = decisionMakerSlice.actions
export default decisionMakerSlice.reducer

