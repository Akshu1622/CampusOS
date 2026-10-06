import React from 'react'

interface CardProps {
  children: React.ReactNode
  variant?: 'standard' | 'compact' | 'tinted' | 'banner'
  className?: string
  style?: React.CSSProperties
  padding?: number | string
  title?: string
  onClick?: () => void
}

export function Card({ children, variant = 'standard', className = '', style, padding, title, onClick }: CardProps) {
  const paddings = {
    standard: '20px',
    compact: '16px',
    tinted: '20px',
    banner: '24px'
  }
  
  const bgColors = {
    standard: 'var(--color-surface)',
    compact: 'var(--color-surface)',
    tinted: 'var(--color-primary-subtle)', // Can be overridden by specific module colors
    banner: 'linear-gradient(to right, var(--color-primary-subtle), var(--color-surface))'
  }

  const radii = {
    standard: 'var(--radius-md)',
    compact: 'var(--radius-md)',
    tinted: 'var(--radius-md)',
    banner: 'var(--radius-xl)'
  }

  const effectivePadding = padding !== undefined ? (typeof padding === 'number' ? `${padding}px` : padding) : paddings[variant]

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: bgColors[variant],
        borderRadius: radii[variant],
        padding: effectivePadding,
        border: variant === 'tinted' || variant === 'banner' ? 'none' : '1px solid var(--color-border)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 150ms',
        boxShadow: 'none',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {title && (
        <div style={{ paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{title}</h3>
        </div>
      )}
      {children}
    </div>
  )
}
