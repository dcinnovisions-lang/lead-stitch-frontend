import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../config/api'
import type { DecisionMaker } from '../../types/api/businessRequirement.types'

interface CreateDecisionMakerPayload {
  requirementId: string
  roleTitle: string
  priority?: number | null
}

interface UpdateDecisionMakerPayload {
  id: number
  roleTitle: string
  priority?: 'high' | 'medium' | 'low' | null
}

interface DecisionMakersState {
  decisionMakers: DecisionMaker[]
  loading: boolean
  error: string | null
}

// Async thunks
export const getDecisionMakers = createAsyncThunk<
  DecisionMaker[],
  string,
  { rejectValue: string }
>(
  'decisionMakers/getDecisionMakers',
  async (requirementId, { rejectWithValue }) => {
    try {
      const response = await api.get<DecisionMaker[]>(`/decision-makers/requirement/${requirementId}`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch decision makers')
    }
  }
)

export const createDecisionMaker = createAsyncThunk<
  DecisionMaker,
  CreateDecisionMakerPayload,
  { rejectValue: string }
>(
  'decisionMakers/createDecisionMaker',
  async ({ requirementId, roleTitle, priority }, { rejectWithValue }) => {
    try {
      const response = await api.post<DecisionMaker>('/decision-makers', {
        requirementId,
        roleTitle,
        priority: priority || null,
      })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create decision maker')
    }
  }
)

export const updateDecisionMaker = createAsyncThunk<
  DecisionMaker,
  UpdateDecisionMakerPayload,
  { rejectValue: string }
>(
  'decisionMakers/updateDecisionMaker',
  async ({ id, roleTitle, priority }, { rejectWithValue }) => {
    try {
      const response = await api.put<DecisionMaker>(`/decision-makers/${id}`, {
        roleTitle,
        priority,
      })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update decision maker')
    }
  }
)

export const deleteDecisionMaker = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>(
  'decisionMakers/deleteDecisionMaker',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/decision-makers/${id}`)
      return id
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete decision maker')
    }
  }
)

export const finalizeDecisionMakers = createAsyncThunk<
  any,
  string,
  { rejectValue: string }
>(
  'decisionMakers/finalizeDecisionMakers',
  async (requirementId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/decision-makers/requirement/${requirementId}/finalize`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to finalize decision makers')
    }
  }
)

const initialState: DecisionMakersState = {
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
    builder
      // Get decision makers
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
        state.error = action.payload || 'Failed to fetch decision makers'
      })
      // Create decision maker
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
        state.error = action.payload || 'Failed to create decision maker'
      })
      // Update decision maker
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
        state.error = action.payload || 'Failed to update decision maker'
      })
      // Delete decision maker
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
        state.error = action.payload || 'Failed to delete decision maker'
      })
      // Finalize decision makers
      .addCase(finalizeDecisionMakers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(finalizeDecisionMakers.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(finalizeDecisionMakers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to finalize decision makers'
      })
  },
})

export const { clearError } = decisionMakerSlice.actions
export default decisionMakerSlice.reducer

