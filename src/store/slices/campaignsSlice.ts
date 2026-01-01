import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../../config/api'
import type { Campaign, CampaignRecipient, CreateCampaignData, UpdateCampaignData } from '../../types/api/campaign.types'

interface CampaignsState {
  campaigns: Campaign[]
  currentCampaign: Campaign | null
  recipients: CampaignRecipient[]
  loading: boolean
  sending: boolean
  error: string | null
}

interface GetRecipientsResponse {
  campaignId: string | number
  recipients: CampaignRecipient[]
}

// Async thunks
export const getCampaigns = createAsyncThunk<
  Campaign[],
  void,
  { rejectValue: string }
>(
  'campaigns/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<Campaign[]>('/campaigns')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch campaigns')
    }
  }
)

export const createCampaign = createAsyncThunk<
  Campaign,
  CreateCampaignData,
  { rejectValue: string }
>(
  'campaigns/create',
  async (campaignData, { rejectWithValue }) => {
    try {
      const response = await api.post<Campaign>('/campaigns', campaignData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create campaign')
    }
  }
)

export const updateCampaign = createAsyncThunk<
  Campaign,
  { id: number; data: UpdateCampaignData },
  { rejectValue: string }
>(
  'campaigns/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put<Campaign>(`/campaigns/${id}`, data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update campaign')
    }
  }
)

export const sendCampaign = createAsyncThunk<
  Campaign,
  string | number,
  { rejectValue: string }
>(
  'campaigns/send',
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await api.post<Campaign>(`/campaigns/${campaignId}/send`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send campaign')
    }
  }
)

export const getCampaignById = createAsyncThunk<
  Campaign,
  string | number,
  { rejectValue: string }
>(
  'campaigns/getById',
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await api.get<Campaign>(`/campaigns/${campaignId}`)
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch campaign'
      console.error('Error fetching campaign:', error)
      console.error('Error response:', error.response?.data)
      return rejectWithValue(errorMessage)
    }
  }
)

export const deleteCampaign = createAsyncThunk<
  string | number,
  string | number,
  { rejectValue: string }
>(
  'campaigns/delete',
  async (campaignId, { rejectWithValue }) => {
    try {
      await api.delete(`/campaigns/${campaignId}`)
      return campaignId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete campaign')
    }
  }
)

export const getCampaignRecipients = createAsyncThunk<
  GetRecipientsResponse,
  string | number,
  { rejectValue: string }
>(
  'campaigns/getRecipients',
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await api.get<CampaignRecipient[]>(`/campaigns/${campaignId}/recipients`)
      return { campaignId: typeof campaignId === 'number' ? campaignId : campaignId, recipients: response.data || [] }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch recipients'
      console.error('❌ Error fetching campaign recipients:', campaignId, error)
      console.error('❌ Error response:', error.response?.data)
      return rejectWithValue(errorMessage)
    }
  }
)

const initialState: CampaignsState = {
  campaigns: [],
  currentCampaign: null,
  recipients: [],
  loading: false,
  sending: false,
  error: null,
}

const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    setCurrentCampaign: (state, action: PayloadAction<Campaign>) => {
      state.currentCampaign = action.payload
    },
    clearCurrentCampaign: (state) => {
      state.currentCampaign = null
      state.recipients = []
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Campaigns
      .addCase(getCampaigns.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getCampaigns.fulfilled, (state, action) => {
        state.loading = false
        state.campaigns = action.payload
      })
      .addCase(getCampaigns.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch campaigns'
      })
      // Get Campaign By ID
      .addCase(getCampaignById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getCampaignById.fulfilled, (state, action) => {
        state.loading = false
        state.currentCampaign = action.payload
        const index = state.campaigns.findIndex((c) => c.id === action.payload.id)
        if (index > -1) {
          state.campaigns[index] = action.payload
        }
      })
      .addCase(getCampaignById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch campaign'
      })
      // Create Campaign
      .addCase(createCampaign.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.loading = false
        state.campaigns.unshift(action.payload)
        state.currentCampaign = action.payload
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to create campaign'
      })
      // Update Campaign
      .addCase(updateCampaign.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        state.loading = false
        const index = state.campaigns.findIndex((c) => c.id === action.payload.id)
        if (index > -1) {
          state.campaigns[index] = action.payload
        }
        if (state.currentCampaign?.id === action.payload.id) {
          state.currentCampaign = action.payload
        }
      })
      .addCase(updateCampaign.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to update campaign'
      })
      // Delete Campaign
      .addCase(deleteCampaign.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.loading = false
        state.campaigns = state.campaigns.filter((c) => c.id !== action.payload)
        if (state.currentCampaign?.id === action.payload) {
          state.currentCampaign = null
        }
      })
      .addCase(deleteCampaign.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to delete campaign'
      })
      // Send Campaign
      .addCase(sendCampaign.pending, (state) => {
        state.sending = true
        state.error = null
      })
      .addCase(sendCampaign.fulfilled, (state, action) => {
        state.sending = false
        const index = state.campaigns.findIndex((c) => c.id === action.payload.id)
        if (index > -1) {
          state.campaigns[index] = action.payload
        }
        if (state.currentCampaign?.id === action.payload.id) {
          state.currentCampaign = action.payload
        }
      })
      .addCase(sendCampaign.rejected, (state, action) => {
        state.sending = false
        state.error = action.payload || 'Failed to send campaign'
      })
      // Get Campaign Recipients
      .addCase(getCampaignRecipients.fulfilled, (state, action) => {
        state.recipients = action.payload.recipients
      })
  },
})

export const { setCurrentCampaign, clearCurrentCampaign, clearError } = campaignsSlice.actions
export default campaignsSlice.reducer

