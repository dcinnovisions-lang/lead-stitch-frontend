import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../config/api'

// Async thunks
export const getTemplates = createAsyncThunk(
  'templates/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/email/templates')
      return response.data || []
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch templates')
    }
  }
)

export const getTemplateById = createAsyncThunk(
  'templates/getById',
  async (templateId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/email/templates/${templateId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch template')
    }
  }
)

export const createTemplate = createAsyncThunk(
  'templates/create',
  async (templateData, { rejectWithValue }) => {
    try {
      const response = await api.post('/email/templates', templateData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create template')
    }
  }
)

export const updateTemplate = createAsyncThunk(
  'templates/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/email/templates/${id}`, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update template')
    }
  }
)

export const deleteTemplate = createAsyncThunk(
  'templates/delete',
  async (templateId, { rejectWithValue }) => {
    try {
      await api.delete(`/email/templates/${templateId}`)
      return templateId
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete template')
    }
  }
)

const initialState = {
  templates: [],
  currentTemplate: null,
  loading: false,
  saving: false,
  error: null,
}

const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    setCurrentTemplate: (state, action) => {
      state.currentTemplate = action.payload
    },
    clearCurrentTemplate: (state) => {
      state.currentTemplate = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Templates
      .addCase(getTemplates.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getTemplates.fulfilled, (state, action) => {
        state.loading = false
        state.templates = action.payload
      })
      .addCase(getTemplates.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Get Template By ID
      .addCase(getTemplateById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getTemplateById.fulfilled, (state, action) => {
        state.loading = false
        state.currentTemplate = action.payload
      })
      .addCase(getTemplateById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create Template
      .addCase(createTemplate.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.saving = false
        state.templates.unshift(action.payload)
        state.currentTemplate = action.payload
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload
      })
      // Update Template
      .addCase(updateTemplate.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        state.saving = false
        const index = state.templates.findIndex((t) => t.id === action.payload.id)
        if (index > -1) {
          state.templates[index] = action.payload
        }
        if (state.currentTemplate && state.currentTemplate.id === action.payload.id) {
          state.currentTemplate = action.payload
        }
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload
      })
      // Delete Template
      .addCase(deleteTemplate.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.loading = false
        state.templates = state.templates.filter((t) => t.id !== action.payload)
        if (state.currentTemplate && state.currentTemplate.id === action.payload) {
          state.currentTemplate = null
        }
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { setCurrentTemplate, clearCurrentTemplate, clearError } = templatesSlice.actions
export default templatesSlice.reducer

