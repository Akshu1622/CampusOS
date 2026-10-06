import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { AlertTriangle, AlertCircle } from 'lucide-react'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false
}: ConfirmationDialogProps) {
  const Icon = isDestructive ? AlertCircle : AlertTriangle
  const chipBg = isDestructive ? 'var(--color-error-bg)' : 'var(--color-warning-bg)'
  const chipColor = isDestructive ? 'var(--color-error)' : 'var(--color-warning)'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: chipBg,
          color: chipColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <Icon size={24} />
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
          {title}
        </h3>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          {message}
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', width: '100%' }}>
        <Button 
          variant="secondary" 
          onClick={onClose}
          style={{ flex: 1 }}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button 
          variant={isDestructive ? 'danger' : 'primary'} 
          onClick={onConfirm}
          style={{ flex: 1 }}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
