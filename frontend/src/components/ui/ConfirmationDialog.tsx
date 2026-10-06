import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { AlertTriangle, AlertCircle } from 'lucide-react'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose?: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
  isDanger?: boolean
  isLoading?: boolean
  onCancel?: () => void
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  confirmLabel,
  cancelLabel,
  isDestructive = false,
  isDanger = false,
  isLoading = false,
  onCancel,
}: ConfirmationDialogProps) {
  const handleClose = onClose || onCancel || (() => {})
  const effectiveConfirmText = confirmText || confirmLabel || 'Confirm'
  const effectiveCancelText = cancelText || cancelLabel || 'Cancel'
  const effectiveDestructive = isDestructive || isDanger
  const Icon = effectiveDestructive ? AlertCircle : AlertTriangle
  const chipBg = effectiveDestructive ? 'var(--color-error-bg)' : 'var(--color-warning-bg)'
  const chipColor = effectiveDestructive ? 'var(--color-error)' : 'var(--color-warning)'

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
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
          onClick={handleClose}
          style={{ flex: 1 }}
          disabled={isLoading}
        >
          {effectiveCancelText}
        </Button>
        <Button 
          variant={effectiveDestructive ? 'danger' : 'primary'} 
          onClick={onConfirm}
          style={{ flex: 1 }}
          isLoading={isLoading}
        >
          {effectiveConfirmText}
        </Button>
      </div>
    </Modal>
  )
}
