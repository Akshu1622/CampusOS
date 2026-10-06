import React, { forwardRef, type InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, className = '', disabled, ...props }, ref) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }} className={className}>
        {label && (
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <span style={{ position: 'absolute', left: '12px', color: 'var(--color-text-muted)' }}>
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            disabled={disabled}
            style={{
              width: '100%',
              height: '40px',
              padding: `12px ${rightIcon ? '36px' : '12px'} 12px ${leftIcon ? '36px' : '12px'}`,
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border-strong)'}`,
              backgroundColor: disabled ? 'var(--color-surface-muted)' : 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              transition: 'border-color 120ms, box-shadow 120ms',
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'text',
              ...(props.type === 'number' ? { textAlign: 'right' } : {})
            }}
            onFocus={(e) => {
              if (!disabled) {
                e.target.style.borderColor = error ? 'var(--color-error)' : 'var(--color-primary)'
                e.target.style.boxShadow = `0 0 0 2px ${error ? 'rgba(220,38,38,0.2)' : 'var(--color-focus-ring)'}`
              }
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? 'var(--color-error)' : 'var(--color-border-strong)'
              e.target.style.boxShadow = 'none'
            }}
            {...props}
          />
          {rightIcon && (
            <span style={{ position: 'absolute', right: '12px', color: 'var(--color-text-muted)' }}>
              {rightIcon}
            </span>
          )}
        </div>
        {(helperText || error) && (
          <span style={{ fontSize: 'var(--font-size-xs)', color: error ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
            {error || helperText}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
