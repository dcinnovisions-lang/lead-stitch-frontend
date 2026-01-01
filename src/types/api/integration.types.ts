// Integration API types

export interface LinkedInCredentials {
  email: string
  exists?: boolean
  lastUsedAt?: string
}

export interface SMTPConfig {
  id?: number
  host: string
  port: number
  secure: boolean
  user: string
  from: string
  isActive?: boolean
}

export type SMTPProvider = 'gmail' | 'outlook' | 'yahoo' | 'custom'

export interface SMTPCredential {
  id: number
  email: string
  provider: SMTPProvider
  smtp_host: string
  smtp_port: number
  smtp_secure?: boolean
  is_verified?: boolean
  is_active?: boolean
  display_name?: string
  username?: string
}

export interface SMTPCredentialFormData {
  provider: SMTPProvider | ''
  email: string
  smtp_host: string
  smtp_port: number
  smtp_secure: boolean
  username: string
  password: string
  display_name: string
}

export interface SMTPCredentialsResponse {
  success: boolean
  credentials: SMTPCredential[]
  message?: string
}

export interface TestConnectionResponse {
  success: boolean
  message: string
}

export interface TestEmailRequest {
  toEmail: string
}

export interface TestEmailResponse {
  success: boolean
  message: string
}

