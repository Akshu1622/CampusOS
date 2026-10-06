import React, { ButtonHTMLAttributes } from 'react'
import { Tooltip } from './Tooltip'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  label: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'border' | 'borderless'
}

export function IconButton({
  icon,
  label,
  size = 'md',
  variant = 'border',
  className = '',
  disabled,
  ...props
}: IconButtonProps) {
  const sizes = { sm: '32px', md: '36px', lg: '40px' }
  const borderStyle = variant === 'border' ? '1px solid var(--color-border-strong)' : 'none'

  return (
    <Tooltip content={label}>
      <button
        aria-label={label}
        className={className}
        disabled={disabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: sizes[size],
          height: sizes[size],
          borderRadius: 'var(--radius-sm)',
          border: borderStyle,
          backgroundColor: 'transparent',
          color: 'var(--color-text-secondary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 120ms',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)'
            e.currentTarget.style.color = 'var(--color-text-primary)'
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--color-text-secondary)'
          }
        }}
        {...props}
      >
        {icon}
      </button>
    </Tooltip>
  )
}
