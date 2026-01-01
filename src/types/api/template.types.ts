// Email Template API types

export interface EmailTemplate {
  id: number
  name: string
  subject: string
  body?: string
  body_html?: string
  body_text?: string
  is_default?: boolean
  variables?: Record<string, string> | string[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateTemplateData {
  name: string
  subject: string
  body?: string
  body_html?: string
  body_text?: string
  is_default?: boolean
  variables?: Record<string, string> | string[]
}

export interface UpdateTemplateData {
  name?: string
  subject?: string
  body?: string
  body_html?: string
  body_text?: string
  is_default?: boolean
  variables?: Record<string, string> | string[]
}

