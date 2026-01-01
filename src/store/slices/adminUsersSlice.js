import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../config/api'

// Async thunks
export const fetchUsers = createAsyncThunk(
  'adminUsers/fetchUsers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/users', { params })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users')
    }
  }
)

export const updateUser = createAsyncThunk(
  'adminUsers/updateUser',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user')
    }
  }
)

export const deleteUser = createAsyncThunk(
  'adminUsers/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/users/${userId}`)
      return userId
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user')
    }
  }
)

const initialState = {
  users: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  filters: {
    search: '',
    role: '',
    is_active: '',
  },
  loading: false,
  error: null,
}

const adminUsersSlice = createSlice({
  name: 'adminUsers',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
      state.pagination.page = 1 // Reset to first page when filters change
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.users = action.payload.users
        state.pagination = action.payload.pagination
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false
        const updatedUser = action.payload.user
        const index = state.users.findIndex((u) => u.id === updatedUser.id)
        if (index !== -1) {
          state.users[index] = updatedUser
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false
        state.users = state.users.filter((u) => u.id !== action.payload)
        state.pagination.total -= 1
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { setFilters, setPage, clearError } = adminUsersSlice.actions
export default adminUsersSlice.reducer
