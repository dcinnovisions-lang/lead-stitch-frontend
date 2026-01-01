import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../../config/api'
import type { LinkedInProfile, ScrapingJob, ScrapingStatus } from '../../types/api/profile.types'

interface ProfilesState {
  profiles: LinkedInProfile[]
  currentProfile: LinkedInProfile | null
  loading: boolean
  error: string | null
  scrapingJob: ScrapingJob | null
  scrapingStatus: ScrapingStatus | null
  filters: {
    search: string
    role: string
    location: string
  }
}

interface StartScrapingPayload {
  requirementId: number
}

interface ScrapingStatusResponse extends ScrapingStatus {
  profiles?: LinkedInProfile[]
}

interface EnrichEmailsResponse {
  profiles: LinkedInProfile[]
}

// Async thunks
export const getProfiles = createAsyncThunk<
  LinkedInProfile[],
  number | string | null | void,
  { rejectValue: string }
>(
  'profiles/getProfiles',
  async (requirementId = null, { rejectWithValue }) => {
    try {
      const params = requirementId ? { requirementId } : {}
      const response = await api.get<LinkedInProfile[]>('/profiles', { params })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profiles')
    }
  }
)

export const getProfileById = createAsyncThunk<
  LinkedInProfile,
  number,
  { rejectValue: string }
>(
  'profiles/getProfileById',
  async (profileId, { rejectWithValue }) => {
    try {
      const response = await api.get<LinkedInProfile>(`/profiles/${profileId}`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile')
    }
  }
)

export const startScraping = createAsyncThunk<
  ScrapingJob,
  StartScrapingPayload,
  { rejectValue: string }
>(
  'profiles/startScraping',
  async ({ requirementId }, { rejectWithValue }) => {
    try {
      const response = await api.post<ScrapingJob>('/profiles/scrape', {
        requirementId,
      })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start profile search')
    }
  }
)

export const getScrapingStatus = createAsyncThunk<
  ScrapingStatusResponse,
  string,
  { rejectValue: string }
>(
  'profiles/getScrapingStatus',
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await api.get<ScrapingStatusResponse>(`/profiles/scraping-status/${jobId}`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get profile search status')
    }
  }
)

export const enrichWithEmails = createAsyncThunk<
  EnrichEmailsResponse,
  number[],
  { rejectValue: string }
>(
  'profiles/enrichWithEmails',
  async (profileIds, { rejectWithValue }) => {
    try {
      const response = await api.post<EnrichEmailsResponse>('/profiles/enrich-emails', { profileIds })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to enrich emails')
    }
  }
)

const initialState: ProfilesState = {
  profiles: [],
  currentProfile: null,
  loading: false,
  error: null,
  scrapingJob: null,
  scrapingStatus: null,
  filters: {
    search: '',
    role: '',
    location: '',
  },
}

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ProfilesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        role: '',
        location: '',
      }
    },
    clearScrapingStatus: (state) => {
      state.scrapingJob = null
      state.scrapingStatus = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Get profiles
      .addCase(getProfiles.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getProfiles.fulfilled, (state, action) => {
        state.loading = false
        state.profiles = action.payload
      })
      .addCase(getProfiles.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch profiles'
      })
      // Get profile by ID
      .addCase(getProfileById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getProfileById.fulfilled, (state, action) => {
        state.loading = false
        state.currentProfile = action.payload
      })
      .addCase(getProfileById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch profile'
      })
      // Start scraping
      .addCase(startScraping.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(startScraping.fulfilled, (state, action) => {
        state.loading = false
        state.scrapingJob = action.payload
      })
      .addCase(startScraping.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to start profile search'
      })
      // Get scraping status
      .addCase(getScrapingStatus.fulfilled, (state, action) => {
        state.scrapingStatus = action.payload
        if (action.payload.status === 'completed' && action.payload.profiles) {
          state.profiles = [...state.profiles, ...action.payload.profiles]
        }
      })
      // Enrich with emails
      .addCase(enrichWithEmails.pending, (state) => {
        state.loading = true
      })
      .addCase(enrichWithEmails.fulfilled, (state, action) => {
        state.loading = false
        action.payload.profiles.forEach((enrichedProfile) => {
          const index = state.profiles.findIndex((p) => p.id === enrichedProfile.id)
          if (index !== -1) {
            state.profiles[index] = enrichedProfile
          }
        })
      })
      .addCase(enrichWithEmails.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to enrich emails'
      })
  },
})

export const { setFilters, clearFilters, clearScrapingStatus } = profilesSlice.actions
export default profilesSlice.reducer

