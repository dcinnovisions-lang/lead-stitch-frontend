import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../config/api'

// Async thunks
export const submitBusinessRequirement = createAsyncThunk(
    'businessRequirement/submit',
    async (requirementData, { rejectWithValue }) => {

        try {
            // Client-side validation before API call
            const trimmedText = requirementData.requirementText?.trim() || ''

            if (!trimmedText || trimmedText.length === 0) {
                return rejectWithValue('Requirement text is required')
            }
            if (trimmedText.length < 10) {
                return rejectWithValue('Requirement text must be at least 10 characters long')
            }

            const response = await api.post('/business-requirements', {
                ...requirementData,
                requirementText: trimmedText
            })
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
    async ({ requirementId, suggestions }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/business-requirements/${requirementId}/identify-decision-makers`, {
                suggestions: suggestions || []
            })
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
        try {
            const response = await api.post('/business-requirements/identify-industry', {
                requirementText: requirementText?.trim()
            })
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
    industrySuggestions: [],
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
            state.industrySuggestions = []
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
                const suggestions = action.payload?.industries || (action.payload?.industry ? [action.payload.industry] : [])
                state.industrySuggestions = suggestions.filter(Boolean)
            })
            .addCase(identifyIndustry.rejected, (state, action) => {
                state.identifyingIndustry = false
                state.industryError = action.payload
            })
    },
})

export const { setCurrentRequirement, clearCurrentRequirement, clearError } = businessRequirementSlice.actions
export default businessRequirementSlice.reducer

