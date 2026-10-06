import React, { forwardRef, type InputHTMLAttributes } from 'react'

export interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
  showHint?: boolean
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ onClear, showHint, className = '', disabled, ...props }, ref) => {
    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }} className={className}>
        <svg
          style={{ position: 'absolute', left: '12px', color: 'var(--color-text-muted)' }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          ref={ref}
          disabled={disabled}
          placeholder="Search..."
          style={{
            width: '100%',
            height: '36px', // Slightly smaller for search per design
            padding: `8px ${showHint || props.value ? '40px' : '12px'} 8px 36px`,
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--color-border-strong)',
            backgroundColor: disabled ? 'var(--color-surface-muted)' : 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            transition: 'border-color 120ms, box-shadow 120ms',
            outline: 'none',
          }}
          onFocus={(e) => {
            if (!disabled) {
              e.target.style.borderColor = 'var(--color-primary)'
              e.target.style.boxShadow = '0 0 0 2px var(--color-focus-ring)'
            }
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--color-border-strong)'
            e.target.style.boxShadow = 'none'
          }}
          {...props}
        />
        {props.value && onClear && (
          <button
            onClick={onClear}
            style={{
              position: 'absolute',
              right: '12px',
              color: 'var(--color-text-muted)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
        {!props.value && showHint && (
          <span style={{
            position: 'absolute',
            right: '12px',
            fontSize: '10px',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
            padding: '2px 4px',
            borderRadius: '4px',
            pointerEvents: 'none',
          }}>
            ⌘K
          </span>
        )}
      </div>
    )
  }
)
SearchField.displayName = 'SearchField'
