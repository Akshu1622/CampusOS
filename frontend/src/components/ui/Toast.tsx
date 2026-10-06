import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { StatusFamily } from './StatusPill'
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

interface ToastMessage {
  id: string
  title: string
  message?: string
  variant: StatusFamily
}

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }].slice(-3)) // max 3
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
      }}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  useEffect(() => {
    if (toast.variant !== 'error') {
      const timer = setTimeout(() => {
        onRemove()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [toast.variant, onRemove])

  const Icon = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
    info: Info,
    neutral: Info
  }[toast.variant]

  const text = `var(--color-${toast.variant})`

  return (
    <div style={{
      width: '360px',
      backgroundColor: 'var(--color-surface)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--color-border)',
      padding: '16px',
      display: 'flex',
      pointerEvents: 'auto',
      animation: 'slideIn 0.2s ease-out'
    }}>
      <div style={{ flexShrink: 0, marginRight: '12px', color: text }}>
        <Icon size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {toast.title}
        </h4>
        {toast.message && (
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {toast.message}
          </p>
        )}
      </div>
      <button 
        onClick={onRemove}
        style={{ flexShrink: 0, marginLeft: '12px', color: 'var(--color-text-muted)', alignSelf: 'flex-start' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
