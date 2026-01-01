// Ticket API types

export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketCategory = 'technical' | 'billing' | 'feature_request' | 'bug' | 'bug_report' | 'account' | 'other'

export interface TicketAttachment {
  id: number
  file_name: string
  file_size: number
}

export interface TicketAssignee {
  id: number
  email: string
  first_name?: string
  last_name?: string
  firstName?: string
  lastName?: string
}

export interface Ticket {
  id: number | string
  userId?: number
  ticket_number?: string
  subject: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  attachments?: TicketAttachment[] | string[]
  assignee?: TicketAssignee
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  resolved_at?: string
  resolvedAt?: string
  comments?: TicketComment[]
}

export interface TicketComment {
  id: number
  ticketId?: number
  ticket_id?: number
  userId?: number
  user_id?: number
  comment?: string
  content?: string
  is_internal?: boolean
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  user?: {
    id?: number
    email: string
    first_name?: string
    last_name?: string
    firstName?: string
    lastName?: string
  }
  attachments?: TicketAttachment[]
}

export interface CreateTicketData {
  subject: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  attachments?: File[]
}

export interface TicketFilters {
  search?: string
  status?: TicketStatus
  category?: TicketCategory
  priority?: TicketPriority
  page?: number
  limit?: number
}

export interface TicketPagination {
  page: number
  limit: number
  total: number
  pages: number
}

