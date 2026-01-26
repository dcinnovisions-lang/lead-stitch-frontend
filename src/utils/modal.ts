/**
 * Custom Modal Utility
 * Provides a programmatic way to show modals using React state
 */

interface ModalState {
  setModal: (config: ModalConfig | null) => void
}

import type { ReactNode } from 'react'

interface ModalConfig {
  title?: string
  message: string | ReactNode
  type?: 'info' | 'warning' | 'error' | 'success'
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  showPasswordInput?: boolean
  hideIcon?: boolean
}

// This will be set by the ModalProvider
let modalState: ModalState | null = null

export const setModalState = (state: ModalState) => {
  modalState = state
}

export const showModal = (config: ModalConfig) => {
  if (modalState) {
    modalState.setModal(config)
  } else {
    // Fallback to browser alert if modal provider not available
    if (config.showCancel) {
      const result = window.confirm(config.message as string)
      if (result && config.onConfirm) {
        config.onConfirm()
      } else if (!result && config.onCancel) {
        config.onCancel()
      }
    } else {
      window.alert(config.message as string)
      if (config.onConfirm) {
        config.onConfirm()
      }
    }
  }
}

export const hideModal = () => {
  if (modalState) {
    modalState.setModal(null)
  }
}

export type { ModalConfig }

