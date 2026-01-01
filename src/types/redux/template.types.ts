// Template Redux types
import type { EmailTemplate } from '../api/template.types'

export interface TemplatesState {
  templates: EmailTemplate[]
  currentTemplate: EmailTemplate | null
  loading: boolean
  saving: boolean
  error: string | null
}

export interface UpdateTemplatePayload {
  id: number
  data: Partial<EmailTemplate>
}

