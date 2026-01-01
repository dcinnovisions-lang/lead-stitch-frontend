// Ticket Redux types
import type { Ticket, TicketFilters, TicketPagination, TicketStatus, TicketCategory, TicketPriority } from '../api/ticket.types'

export interface TicketsState {
  tickets: Ticket[]
  currentTicket: Ticket | null
  pagination: TicketPagination
  filters: TicketFilters
  loading: boolean
  submitting: boolean
  error: string | null
}

export interface GetTicketsParams {
  page?: number
  limit?: number
  search?: string
  status?: TicketStatus
  category?: TicketCategory
  priority?: TicketPriority
}

export interface GetTicketsResponse {
  tickets: Ticket[]
  pagination: TicketPagination
}

