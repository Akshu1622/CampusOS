import React from 'react'
import type { StatusFamily } from './StatusPill'
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

interface AlertProps {
  title: string
  message?: string
  variant?: StatusFamily
  action?: {
    label: string
    onClick: () => void
  }
  onDismiss?: () => void
}

export function Alert({ title, message, variant = 'info', action, onDismiss }: AlertProps) {
  const bg = `var(--color-${variant}-bg)`
  const border = `var(--color-${variant})`
  const text = `var(--color-${variant})` // Wait, usually text is primary but icon is colored

  const Icon = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
    info: Info,
    neutral: Info
  }[variant]

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      padding: '16px',
      borderRadius: 'var(--radius-md)',
      backgroundColor: bg,
      border: `1px solid ${bg}`,
      // Optionally tint border: 1px solid color.border
    }}>
      <div style={{ flexShrink: 0, marginRight: '12px', color: text }}>
        <Icon size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {title}
        </h4>
        {message && (
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {message}
          </p>
        )}
        {action && (
          <button 
            onClick={action.onClick}
            style={{ 
              alignSelf: 'flex-start',
              marginTop: '4px',
              color: text, 
              fontWeight: 500, 
              fontSize: 'var(--font-size-sm)' 
            }}
          >
            {action.label}
          </button>
        )}
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          style={{ flexShrink: 0, marginLeft: '16px', color: 'var(--color-text-muted)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  )
}
