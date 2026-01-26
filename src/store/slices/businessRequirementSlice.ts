import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../../config/api'
import type { BusinessRequirement, CreateRequirementData, DecisionMaker } from '../../types/api/businessRequirement.types'

interface BusinessRequirementState {
    currentRequirement: BusinessRequirement | null
    requirements: BusinessRequirement[]
    decisionMakers: DecisionMaker[]
    loading: boolean
    identifying: boolean
    identifyingIndustry: boolean
    industryError: string | null
    industrySuggestions: string[]
    error: string | null
}

interface IdentifyDecisionMakersResponse {
    decisionMakers: DecisionMaker[]
}

interface IdentifyIndustryResponse {
    industry?: string
    primaryIndustry?: string
    industries?: string[]
    apiSource?: string
    model?: string
    message?: string
}

// Async thunks
export const submitBusinessRequirement = createAsyncThunk<
    BusinessRequirement,
    CreateRequirementData,
    { rejectValue: string }
>(
    'businessRequirement/submit',
    async (requirementData, { rejectWithValue }) => {
        try {
            const trimmedText = requirementData.requirementText?.trim() || ''

            if (!trimmedText || trimmedText.length === 0) {
                return rejectWithValue('Requirement text is required')
            }
            if (trimmedText.length < 10) {
                return rejectWithValue('Requirement text must be at least 10 characters long')
            }

            const response = await api.post<BusinessRequirement>('/business-requirements', {
                ...requirementData,
                requirementText: trimmedText
            })
            return response.data
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to submit requirement'
            return rejectWithValue(errorMessage)
        }
    }
)

export const identifyDecisionMakers = createAsyncThunk<
    IdentifyDecisionMakersResponse,
    { requirementId: number | string; suggestions: Array<{ suggestion_text: string; industry?: string }> },
    { rejectValue: string }
>(
    'businessRequirement/identifyDecisionMakers',
    async ({ requirementId, suggestions }, { rejectWithValue }) => {
        try {
            const response = await api.post<IdentifyDecisionMakersResponse>(
                `/business-requirements/${requirementId}/identify-decision-makers`,
                { suggestions }
            )
            return response.data
        } catch (error: any) {
            // Ensure error message is always a string
            let errorMessage = 'Failed to identify decision makers'
            if (error.response?.data?.message) {
                errorMessage = typeof error.response.data.message === 'string'
                    ? error.response.data.message
                    : String(error.response.data.message)
            } else if (error.response?.data?.error) {
                errorMessage = typeof error.response.data.error === 'string'
                    ? error.response.data.error
                    : String(error.response.data.error)
            } else if (error.message) {
                errorMessage = typeof error.message === 'string'
                    ? error.message
                    : String(error.message)
            }
            return rejectWithValue(errorMessage)
        }
    }
)

export const identifyIndustry = createAsyncThunk<
    IdentifyIndustryResponse,
    string,
    { rejectValue: string }
>(
    'businessRequirement/identifyIndustry',
    async (requirementText, { rejectWithValue }) => {
        try {
            const trimmed = requirementText?.trim() || ''
            if (!trimmed || trimmed.length < 10) {
                return rejectWithValue('Requirement text must be at least 10 characters long')
            }

            const response = await api.post<IdentifyIndustryResponse>('/business-requirements/identify-industry', {
                requirementText: trimmed
            })
            return response.data
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to identify industry'
            return rejectWithValue(errorMessage)
        }
    }
)

export const getBusinessRequirements = createAsyncThunk<
    BusinessRequirement[],
    void,
    { rejectValue: string }
>(
    'businessRequirement/getAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get<BusinessRequirement[]>('/business-requirements')
            return response.data
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch requirements')
        }
    }
)

const initialState: BusinessRequirementState = {
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
        setCurrentRequirement: (state, action: PayloadAction<BusinessRequirement>) => {
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
                state.error = action.payload || 'Failed to submit requirement'
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
                state.error = action.payload || 'Failed to identify decision makers'
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
                const suggestions = action.payload.industries || (action.payload.industry ? [action.payload.industry] : [])
                state.industrySuggestions = suggestions.filter(Boolean)
            })
            .addCase(identifyIndustry.rejected, (state, action) => {
                state.identifyingIndustry = false
                state.industryError = action.payload || 'Failed to identify industry'
            })
    },
})

export const { setCurrentRequirement, clearCurrentRequirement, clearError } = businessRequirementSlice.actions
export default businessRequirementSlice.reducer

