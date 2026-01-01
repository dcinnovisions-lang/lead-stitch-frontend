import { useState, useEffect, ReactNode } from 'react'
import Modal from './Modal'
import { setModalState } from '../utils/modal'
import type { ModalConfig } from '../utils/modal'

interface ModalProviderProps {
  children: ReactNode
}

function ModalProvider({ children }: ModalProviderProps) {
  const [modal, setModal] = useState<ModalConfig | null>(null)

  useEffect(() => {
    setModalState({ setModal })
  }, [])

  return (
    <>
      {children}
      {modal && (
        <Modal
          isOpen={true}
          onClose={() => setModal(null)}
          title={modal.title}
          message={modal.message}
          type={modal.type || 'info'}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
          confirmText={modal.confirmText || 'OK'}
          cancelText={modal.cancelText || 'Cancel'}
          showCancel={modal.showCancel || false}
          showPasswordInput={modal.showPasswordInput || false}
        />
      )}
    </>
  )
}

export default ModalProvider

