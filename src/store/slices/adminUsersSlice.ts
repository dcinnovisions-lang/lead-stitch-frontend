import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../../config/api'
import type { User } from '../../types/api/auth.types'

interface AdminUsersState {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters: {
    search: string
    role: string
    is_active: string
  }
  loading: boolean
  error: string | null
}

interface FetchUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  is_active?: string
  sort?: string
  order?: string
}

interface UsersResponse {
  users: User[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

interface UpdateUserPayload {
  userId: number
  userData: {
    first_name?: string
    last_name?: string
    role?: 'user' | 'admin'
    password?: string
    is_active?: boolean
  }
}

interface UpdateUserResponse {
  message: string
  user: User
  passwordChanged?: boolean
}

const initialState: AdminUsersState = {
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

// Async thunks
export const fetchUsers = createAsyncThunk<
  UsersResponse,
  FetchUsersParams | void,
  { rejectValue: string }
>(
  'adminUsers/fetchUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        role = '',
        is_active = '',
        sort = 'created_at',
        order = 'DESC',
      } = params

      const queryParams: Record<string, string | number> = {
        page,
        limit,
        sort,
        order,
      }

      if (search && search.trim()) {
        queryParams.search = search.trim()
      }
      if (role) {
        queryParams.role = role
      }
      if (is_active !== undefined && is_active !== '') {
        queryParams.is_active = is_active
      }

      const response = await api.get<UsersResponse>('/admin/users', { params: queryParams })
      console.log('FetchUsers response:', response.data)
      // Ensure we return the data in the expected format
      if (response.data && response.data.users && response.data.pagination) {
        return response.data
      }
      // Handle case where response might be wrapped differently
      if (response.data && Array.isArray(response.data.users)) {
        return response.data as UsersResponse
      }
      // Fallback: return empty data if format is unexpected
      console.warn('Unexpected response format:', response.data)
      return {
        users: [],
        pagination: {
          total: 0,
          page: parseInt(String(queryParams.page)) || 1,
          limit: parseInt(String(queryParams.limit)) || 20,
          pages: 0,
        },
      }
    } catch (error: any) {
      console.error('FetchUsers error:', error)
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch users')
    }
  }
)

export const updateUser = createAsyncThunk<
  UpdateUserResponse,
  UpdateUserPayload,
  { rejectValue: string }
>(
  'adminUsers/updateUser',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const response = await api.put<UpdateUserResponse>(`/admin/users/${userId}`, userData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user')
    }
  }
)

export const deleteUser = createAsyncThunk<
  { message: string },
  number,
  { rejectValue: string }
>(
  'adminUsers/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.delete<{ message: string }>(`/admin/users/${userId}`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user')
    }
  }
)

const adminUsersSlice = createSlice({
  name: 'adminUsers',
  initialState: { ...initialState }, // Ensure new object reference
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<AdminUsersState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
      state.pagination.page = 1 // Reset to first page when filters change
    },
    setPage: (state, action: PayloadAction<number>) => {
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
        console.log('REDUCER: fetchUsers.fulfilled called')
        console.log('REDUCER: action.payload:', action.payload)
        console.log('REDUCER: state before update:', JSON.parse(JSON.stringify(state)))
        
        state.loading = false
        
        if (action.payload && action.payload.users) {
          state.users = action.payload.users
          console.log('REDUCER: users set to:', action.payload.users.length, 'users')
        } else {
          console.warn('REDUCER: unexpected payload structure:', action.payload)
          state.users = []
        }
        
        if (action.payload && action.payload.pagination) {
          state.pagination = { ...action.payload.pagination }
          console.log('REDUCER: pagination set to:', action.payload.pagination)
        }
        
        console.log('REDUCER: state after update:', JSON.parse(JSON.stringify(state)))
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch users'
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
        state.error = action.payload || 'Failed to update user'
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.loading = false
        // User will be removed from list after refresh
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to delete user'
      })
  },
})

export const { setFilters, setPage, clearError } = adminUsersSlice.actions
export default adminUsersSlice.reducer

