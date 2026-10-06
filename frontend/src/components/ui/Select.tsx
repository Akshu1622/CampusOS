import React, { forwardRef, SelectHTMLAttributes } from 'react'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  helperText?: string
  error?: string
  options: { label: string; value: string | number }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, options, className = '', disabled, ...props }, ref) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }} className={className}>
        {label && (
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            ref={ref}
            disabled={disabled}
            style={{
              width: '100%',
              height: '40px',
              padding: '8px 36px 8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border-strong)'}`,
              backgroundColor: disabled ? 'var(--color-surface-muted)' : 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              appearance: 'none',
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'border-color 120ms, box-shadow 120ms',
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
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: 'var(--color-text-muted)' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
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
Select.displayName = 'Select'
