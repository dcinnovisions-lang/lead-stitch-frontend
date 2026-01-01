import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../config/api'

// Async thunks
export const getProfiles = createAsyncThunk(
  'profiles/getProfiles',
  async (requirementId = null, { rejectWithValue }) => {
    try {
      const params = requirementId ? { requirementId } : {}
      const response = await api.get('/profiles', { params })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profiles')
    }
  }
)

export const getProfileById = createAsyncThunk(
  'profiles/getProfileById',
  async (profileId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/profiles/${profileId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile')
    }
  }
)

export const startScraping = createAsyncThunk(
  'profiles/startScraping',
  async ({ requirementId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/profiles/scrape', {
        requirementId,
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start scraping')
    }
  }
)

export const getScrapingStatus = createAsyncThunk(
  'profiles/getScrapingStatus',
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/profiles/scraping-status/${jobId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get scraping status')
    }
  }
)

export const enrichWithEmails = createAsyncThunk(
  'profiles/enrichWithEmails',
  async (profileIds, { rejectWithValue }) => {
    try {
      const response = await api.post('/profiles/enrich-emails', { profileIds })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to enrich emails')
    }
  }
)

const initialState = {
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
    setFilters: (state, action) => {
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
    // Get profiles
    builder
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
        state.error = action.payload
      })

    // Get profile by ID
    builder
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
        state.error = action.payload
      })

    // Start scraping
    builder
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
        state.error = action.payload
      })

    // Get scraping status
    builder
      .addCase(getScrapingStatus.fulfilled, (state, action) => {
        state.scrapingStatus = action.payload
        if (action.payload.status === 'completed' && action.payload.profiles) {
          // Refresh profiles after scraping completes
          state.profiles = [...state.profiles, ...action.payload.profiles]
        }
      })

    // Enrich with emails
    builder
      .addCase(enrichWithEmails.pending, (state) => {
        state.loading = true
      })
      .addCase(enrichWithEmails.fulfilled, (state, action) => {
        state.loading = false
        // Update profiles with enriched emails
        action.payload.profiles.forEach((enrichedProfile) => {
          const index = state.profiles.findIndex((p) => p.id === enrichedProfile.id)
          if (index !== -1) {
            state.profiles[index] = enrichedProfile
          }
        })
      })
      .addCase(enrichWithEmails.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { setFilters, clearFilters, clearScrapingStatus } = profilesSlice.actions
export default profilesSlice.reducer
