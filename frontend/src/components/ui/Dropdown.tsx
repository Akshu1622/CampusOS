import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export interface DropdownItem {
  id: string
  label: string
  icon?: React.ReactNode
  danger?: boolean
  onClick: () => void
  dividerBefore?: boolean
}

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
}

export function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect())
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    const handleScroll = () => {
      if (isOpen) setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('scroll', handleScroll, true)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1000,
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--color-border)',
    padding: '8px',
    minWidth: '200px',
    display: 'flex',
    flexDirection: 'column',
    animation: 'dropdownFadeIn 0.15s ease-out'
  }

  if (rect) {
    menuStyle.top = rect.bottom + 8
    if (align === 'right') {
      menuStyle.right = window.innerWidth - rect.right
    } else {
      menuStyle.left = rect.left
    }
  }

  return (
    <>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)} style={{ display: 'inline-block' }}>
        {trigger}
      </div>
      {isOpen && rect && createPortal(
        <div ref={menuRef} style={menuStyle}>
          {items.map((item) => (
            <React.Fragment key={item.id}>
              {item.dividerBefore && (
                <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }} />
              )}
              <button
                onClick={() => {
                  item.onClick()
                  setIsOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: item.danger ? 'var(--color-error)' : 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  textAlign: 'left',
                  transition: 'background-color 120ms'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = item.danger ? 'var(--color-error-bg)' : 'var(--color-surface-muted)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {item.icon && <span style={{ display: 'flex', color: item.danger ? 'var(--color-error)' : 'var(--color-text-muted)' }}>{item.icon}</span>}
                {item.label}
              </button>
            </React.Fragment>
          ))}
          <style>{`
            @keyframes dropdownFadeIn {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>,
        document.body
      )}
    </>
  )
}
