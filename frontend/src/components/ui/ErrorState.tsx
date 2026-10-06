import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  message: string
  referenceId?: string
  onRetry?: () => void
}

export function ErrorState({ title = "Couldn't load data", message, referenceId, onRetry }: ErrorStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--color-surface)',
      borderRadius: 'var(--radius-md)'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        backgroundColor: 'var(--color-warning-bg)',
        color: 'var(--color-warning)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <AlertCircle size={24} />
      </div>
      <h3 style={{
        margin: '0 0 8px 0',
        fontSize: '15px',
        fontWeight: 600,
        color: 'var(--color-text-primary)'
      }}>
        {title}
      </h3>
      <p style={{
        margin: '0 0 24px 0',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        maxWidth: '320px'
      }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
      {referenceId && (
        <p style={{
          marginTop: '16px',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
          fontFamily: 'monospace'
        }}>
          Ref: {referenceId}
        </p>
      )}
    </div>
  )
}
