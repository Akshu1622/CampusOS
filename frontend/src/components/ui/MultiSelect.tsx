import React, { forwardRef, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'

export interface MultiSelectProps {
  label?: string
  options: { label: string; value: string }[]
  value: string[]
  onChange: (value: string[]) => void
  error?: string
  disabled?: boolean
  placeholder?: string
}

export const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ label, options, value, onChange, error, disabled, placeholder = 'Select...' }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [rect, setRect] = useState<DOMRect | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (isOpen && containerRef.current) {
        setRect(containerRef.current.getBoundingClientRect())
      }
    }, [isOpen])

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          containerRef.current && !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false)
        }
      }
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen])

    const handleSelect = (val: string) => {
      if (value.includes(val)) {
        onChange(value.filter(v => v !== val))
      } else {
        onChange([...value, val])
      }
    }

    const handleRemove = (e: React.MouseEvent, val: string) => {
      e.stopPropagation()
      onChange(value.filter(v => v !== val))
    }

    return (
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        {label && (
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {label}
          </label>
        )}
        <div 
          ref={containerRef}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          style={{
            position: 'relative',
            minHeight: '40px',
            padding: '4px 36px 4px 8px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${error ? 'var(--color-error)' : isOpen ? 'var(--color-primary)' : 'var(--color-border-strong)'}`,
            backgroundColor: disabled ? 'var(--color-surface-muted)' : 'var(--color-surface)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            alignItems: 'center',
            boxShadow: isOpen ? '0 0 0 2px var(--color-focus-ring)' : 'none'
          }}
        >
          {value.length === 0 && (
            <span style={{ color: 'var(--color-text-muted)', paddingLeft: '4px' }}>{placeholder}</span>
          )}
          {value.map(v => {
            const opt = options.find(o => o.value === v)
            return (
              <span key={v} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px'
              }}>
                {opt?.label || v}
                <button 
                  onClick={(e) => handleRemove(e, v)}
                  style={{ color: 'var(--color-primary)', display: 'flex', padding: 0 }}
                >
                  ×
                </button>
              </span>
            )
          })}
          <svg
            style={{ position: 'absolute', right: '12px', top: '12px', pointerEvents: 'none', color: 'var(--color-text-muted)' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {error && (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-error)' }}>
            {error}
          </span>
        )}

        {isOpen && rect && createPortal(
          <div 
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: rect.bottom + 4,
              left: rect.left,
              width: rect.width,
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--color-border)',
              padding: '8px',
              maxHeight: '280px',
              overflowY: 'auto',
              zIndex: 1000,
            }}
          >
            {options.map(opt => {
              const isSelected = value.includes(opt.value)
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'transparent',
                    color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {opt.label}
                  {isSelected && <Check size={16} />}
                </div>
              )
            })}
          </div>,
          document.body
        )}
      </div>
    )
  }
)
MultiSelect.displayName = 'MultiSelect'
