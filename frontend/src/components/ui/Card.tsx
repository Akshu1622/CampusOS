import React from 'react'

interface CardProps {
  children: React.ReactNode
  variant?: 'standard' | 'compact' | 'tinted' | 'banner'
  className?: string
  onClick?: () => void
}

export function Card({ children, variant = 'standard', className = '', onClick }: CardProps) {
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

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: bgColors[variant],
        borderRadius: radii[variant],
        padding: paddings[variant],
        border: variant === 'tinted' || variant === 'banner' ? 'none' : '1px solid var(--color-border)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 150ms',
        boxShadow: 'none',
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
      {children}
    </div>
  )
}
