import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Drawer({ isOpen, onClose, title, children, footer, size = 'md' }: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handleEsc)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleEsc)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const widths = {
    sm: '420px',
    md: '560px',
    lg: '720px'
  }

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div 
        style={{
          width: '100%',
          maxWidth: widths[size],
          backgroundColor: 'var(--color-surface)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          animation: 'drawerSlideIn 0.2s ease-out'
        }}
      >
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{title}</h3>
          <button 
            onClick={onClose}
            style={{ color: 'var(--color-text-muted)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div style={{
          padding: '24px',
          flex: 1,
          overflowY: 'auto'
        }}>
          {children}
        </div>
        {footer && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            {footer}
          </div>
        )}
      </div>
      <style>{`
        @keyframes drawerSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>,
    document.body
  )
}
