import React from 'react'
import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui'

export function ErrorPage() {
  const navigate = useNavigate()
  const error = useRouteError()
  
  let title = "Something went wrong"
  let message = "An unexpected error occurred. Please try again or contact support if the issue persists."
  
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Page not found"
      message = "The page you are looking for doesn't exist or has been moved."
    } else if (error.status === 403) {
      title = "Access denied"
      message = "You don't have permission to view this page."
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg)',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          backgroundColor: 'var(--color-error-bg)',
          color: 'var(--color-error)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <AlertTriangle size={32} />
        </div>
        <h2 style={{ margin: '0 0 12px 0', fontSize: 'var(--font-size-2xl)', fontWeight: 600 }}>
          {title}
        </h2>
        <p style={{ margin: '0 0 32px 0', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Button onClick={() => navigate('/')}>
            Return home
          </Button>
        </div>
      </div>
    </div>
  )
}
