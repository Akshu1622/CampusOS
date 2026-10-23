import React from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, description, action, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      width: '100%',
      height: '100%'
    }}>
      {icon && (
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: 'var(--color-surface-muted)',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          {icon}
        </div>
      )}
      <h3 style={{
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--color-text-primary)',
        margin: '0 0 8px 0'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '14px',
        color: 'var(--color-text-muted)',
        maxWidth: '400px',
        margin: '0 0 24px 0',
        lineHeight: 1.5
      }}>
        {description}
      </p>
      {action && <div>{action}</div>}
      {!action && actionLabel && onAction && (
        <div>
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
