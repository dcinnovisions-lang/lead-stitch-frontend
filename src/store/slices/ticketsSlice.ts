import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../../config/api'
import type { Ticket, TicketComment, CreateTicketData, TicketFilters, TicketPagination, TicketStatus, TicketCategory, TicketPriority } from '../../types/api/ticket.types'

interface TicketsState {
  tickets: Ticket[]
  currentTicket: Ticket | null
  pagination: TicketPagination
  filters: TicketFilters
  loading: boolean
  submitting: boolean
  error: string | null
}

interface GetTicketsParams {
  page?: number
  limit?: number
  search?: string
  status?: TicketStatus
  category?: TicketCategory
  priority?: TicketPriority
}

interface GetTicketsResponse {
  tickets: Ticket[]
  pagination: TicketPagination
}

interface AddCommentPayload {
  ticketId: number | string
  comment: string
  attachments?: File[]
}

interface AddCommentResponse {
  ticketId: number | string
  comment: TicketComment
}

// Async thunks
export const getTickets = createAsyncThunk<
  GetTicketsResponse,
  GetTicketsParams | void,
  { rejectValue: string }
>(
  'tickets/getAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20, search = '', status = '', category = '', priority = '' } = params
      const queryParams = {
        page,
        limit,
        ...(search && { search }),
        ...(status && { status }),
        ...(category && { category }),
        ...(priority && { priority }),
      }
      const response = await api.get<GetTicketsResponse>('/tickets', { params: queryParams })
      return {
        tickets: response.data.tickets || [],
        pagination: response.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tickets')
    }
  }
)

export const getTicketById = createAsyncThunk<
  Ticket,
  number | string,
  { rejectValue: string }
>(
  'tickets/getById',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await api.get<{ ticket: Ticket }>(`/tickets/${ticketId}`)
      return response.data.ticket
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch ticket')
    }
  }
)

export const createTicket = createAsyncThunk<
  Ticket,
  CreateTicketData,
  { rejectValue: string }
>(
  'tickets/create',
  async (ticketData, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('subject', ticketData.subject)
      formData.append('description', ticketData.description)
      formData.append('category', ticketData.category)
      formData.append('priority', ticketData.priority)
      
      if (ticketData.attachments && ticketData.attachments.length > 0) {
        ticketData.attachments.forEach((file) => {
          formData.append('attachments', file)
        })
      }

      const response = await api.post<{ ticket: Ticket }>('/tickets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data.ticket
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create ticket')
    }
  }
)

export const addComment = createAsyncThunk<
  AddCommentResponse,
  AddCommentPayload,
  { rejectValue: string }
>(
  'tickets/addComment',
  async ({ ticketId, comment, attachments = [] }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('comment', comment)
      
      if (attachments && attachments.length > 0) {
        attachments.forEach((file) => {
          formData.append('attachments', file)
        })
      }

      const response = await api.post<{ comment: TicketComment }>(`/tickets/${ticketId}/comments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return { ticketId, comment: response.data.comment }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add comment')
    }
  }
)

export const closeTicket = createAsyncThunk<
  Ticket,
  number | string,
  { rejectValue: string }
>(
  'tickets/close',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await api.post<{ ticket: Ticket }>(`/tickets/${ticketId}/close`)
      return response.data.ticket
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to close ticket')
    }
  }
)

const initialState: TicketsState = {
  tickets: [],
  currentTicket: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  filters: {
    search: '',
    status: '',
    category: '',
    priority: '',
  },
  loading: false,
  submitting: false,
  error: null,
}

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<TicketFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        status: '',
        category: '',
        priority: '',
      }
    },
    setCurrentTicket: (state, action: PayloadAction<Ticket>) => {
      state.currentTicket = action.payload
    },
    clearCurrentTicket: (state) => {
      state.currentTicket = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Tickets
      .addCase(getTickets.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getTickets.fulfilled, (state, action) => {
        state.loading = false
        state.tickets = action.payload.tickets
        state.pagination = {
          ...state.pagination,
          ...action.payload.pagination,
        }
      })
      .addCase(getTickets.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch tickets'
      })
      // Get Ticket By ID
      .addCase(getTicketById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getTicketById.fulfilled, (state, action) => {
        state.loading = false
        state.currentTicket = action.payload
        const index = state.tickets.findIndex((t) => t.id === action.payload.id)
        if (index > -1) {
          state.tickets[index] = action.payload
        }
      })
      .addCase(getTicketById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch ticket'
      })
      // Create Ticket
      .addCase(createTicket.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.loading = false
        state.tickets.unshift(action.payload)
        state.currentTicket = action.payload
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to create ticket'
      })
      // Add Comment
      .addCase(addComment.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.submitting = false
        if (state.currentTicket && state.currentTicket.id === action.payload.ticketId) {
          if (!state.currentTicket.comments) {
            state.currentTicket.comments = []
          }
          state.currentTicket.comments.push(action.payload.comment)
        }
      })
      .addCase(addComment.rejected, (state, action) => {
        state.submitting = false
        state.error = action.payload || 'Failed to add comment'
      })
      // Close Ticket
      .addCase(closeTicket.fulfilled, (state, action) => {
        const index = state.tickets.findIndex((t) => t.id === action.payload.id)
        if (index > -1) {
          state.tickets[index] = action.payload
        }
        if (state.currentTicket && state.currentTicket.id === action.payload.id) {
          state.currentTicket = action.payload
        }
      })
  },
})

export const { setFilters, clearFilters, setCurrentTicket, clearCurrentTicket, clearError } = ticketsSlice.actions
export default ticketsSlice.reducer

