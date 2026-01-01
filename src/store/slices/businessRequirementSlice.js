import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../config/api'

// Async thunks
export const submitBusinessRequirement = createAsyncThunk(
  'businessRequirement/submit',
  async (requirementData, { rejectWithValue }) => {
    console.log('🟡 Redux slice - submitBusinessRequirement called')
    console.log('🟡 Redux slice - requirementData:', requirementData)
    
    try {
      // Client-side validation before API call
      const trimmedText = requirementData.requirementText?.trim() || ''
      console.log('🟡 Redux slice - trimmed text length:', trimmedText.length)
      
      if (!trimmedText || trimmedText.length === 0) {
        console.log('❌ REDUX VALIDATION FAILED: Empty field')
        return rejectWithValue('Requirement text is required')
      }
      if (trimmedText.length < 10) {
        console.log('❌ REDUX VALIDATION FAILED: Less than 10 characters. Length:', trimmedText.length)
        return rejectWithValue('Requirement text must be at least 10 characters long')
      }

      console.log('✅ Redux validation passed - making API call')
      const response = await api.post('/business-requirements', {
        ...requirementData,
        requirementText: trimmedText
      })
      console.log('✅ API call successful:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Redux slice - API error:', error)
      console.error('❌ Error response:', error.response?.data)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit requirement'
      return rejectWithValue(errorMessage)
    }
  }
)

export const identifyDecisionMakers = createAsyncThunk(
  'businessRequirement/identifyDecisionMakers',
  async (requirementId, { rejectWithValue }) => {
    console.log('🟡 Redux - identifyDecisionMakers called for requirement:', requirementId);
    try {
      console.log('🟡 Redux - Making API call to identify decision makers...');
      const response = await api.post(`/business-requirements/${requirementId}/identify-decision-makers`)
      console.log('✅ Redux - Identify decision makers successful:', response.data);
      return response.data
    } catch (error) {
      console.error('❌ Redux - Identify decision makers error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Full error:', error);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to identify decision makers'
      const errorDetails = error.response?.data?.details || error.response?.data
      console.error('❌ Error message:', errorMessage);
      console.error('❌ Error details:', errorDetails);
      
      return rejectWithValue(errorMessage)
    }
  }
)

export const identifyIndustry = createAsyncThunk(
  'businessRequirement/identifyIndustry',
  async (requirementText, { rejectWithValue }) => {
    console.log('🟡 Redux - identifyIndustry called for requirement text:', requirementText?.substring(0, 50));
    try {
      console.log('🟡 Redux - Making API call to identify industry...');
      const response = await api.post('/business-requirements/identify-industry', {
        requirementText: requirementText?.trim()
      })
      console.log('✅ Redux - Identify industry successful:', response.data);
      return response.data
    } catch (error) {
      console.error('❌ Redux - Identify industry error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to identify industry'
      console.error('❌ Error message:', errorMessage);
      
      return rejectWithValue(errorMessage)
    }
  }
)

export const getBusinessRequirements = createAsyncThunk(
  'businessRequirement/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/business-requirements')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch requirements')
    }
  }
)

const initialState = {
  currentRequirement: null,
  requirements: [],
  decisionMakers: [],
  loading: false,
  identifying: false,
  identifyingIndustry: false,
  industryError: null,
  error: null,
}

const businessRequirementSlice = createSlice({
  name: 'businessRequirement',
  initialState,
  reducers: {
    setCurrentRequirement: (state, action) => {
      state.currentRequirement = action.payload
    },
    clearCurrentRequirement: (state) => {
      state.currentRequirement = null
      state.decisionMakers = []
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Submit Requirement
      .addCase(submitBusinessRequirement.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(submitBusinessRequirement.fulfilled, (state, action) => {
        state.loading = false
        state.currentRequirement = action.payload
        state.requirements.unshift(action.payload)
      })
      .addCase(submitBusinessRequirement.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Identify Decision Makers
      .addCase(identifyDecisionMakers.pending, (state) => {
        state.identifying = true
        state.error = null
      })
      .addCase(identifyDecisionMakers.fulfilled, (state, action) => {
        state.identifying = false
        state.decisionMakers = action.payload.decisionMakers || []
        if (state.currentRequirement) {
          state.currentRequirement.decisionMakers = action.payload.decisionMakers
        }
      })
      .addCase(identifyDecisionMakers.rejected, (state, action) => {
        state.identifying = false
        state.error = action.payload
      })
      // Get All Requirements
      .addCase(getBusinessRequirements.fulfilled, (state, action) => {
        state.requirements = action.payload
      })
      // Identify Industry
      .addCase(identifyIndustry.pending, (state) => {
        state.identifyingIndustry = true
        state.industryError = null
      })
      .addCase(identifyIndustry.fulfilled, (state, action) => {
        state.identifyingIndustry = false
        state.industryError = null
      })
      .addCase(identifyIndustry.rejected, (state, action) => {
        state.identifyingIndustry = false
        state.industryError = action.payload
      })
  },
})

export const { setCurrentRequirement, clearCurrentRequirement, clearError } = businessRequirementSlice.actions
export default businessRequirementSlice.reducer

