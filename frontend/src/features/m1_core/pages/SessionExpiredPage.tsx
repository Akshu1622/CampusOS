import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui'

export function SessionExpiredPage() {
  const navigate = useNavigate()

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
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        padding: '32px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          backgroundColor: 'var(--color-warning-bg)',
          color: 'var(--color-warning)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <Clock size={32} />
        </div>
        <h2 style={{ margin: '0 0 12px 0', fontSize: 'var(--font-size-2xl)', fontWeight: 600 }}>
          Session Expired
        </h2>
        <p style={{ margin: '0 0 32px 0', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          For your security, your session has timed out due to inactivity. Please sign in again to continue.
        </p>
        <Button size="lg" onClick={() => navigate('/login')} style={{ width: '100%' }}>
          Sign in
        </Button>
      </div>
    </div>
  )
}
