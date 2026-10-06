import React, { useState, useRef, useEffect, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

export interface DatePickerProps {
  label?: string
  value?: Date | null
  onChange: (date: Date | null) => void
  error?: string
  disabled?: boolean
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, value, onChange, error, disabled }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(value || new Date())
    const [rect, setRect] = useState<DOMRect | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (isOpen && containerRef.current) {
        setRect(containerRef.current.getBoundingClientRect())
      }
    }, [isOpen])

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
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

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
    const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

    const handleDateClick = (day: number) => {
      onChange(new Date(year, month, day))
      setIsOpen(false)
    }

    const formatDate = (d: Date | null | undefined) => {
      if (!d) return ''
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }} ref={containerRef}>
        {label && (
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {label}
          </label>
        )}
        <div 
          onClick={() => !disabled && setIsOpen(!isOpen)}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          <span style={{ position: 'absolute', left: '12px', color: 'var(--color-text-muted)', display: 'flex' }}>
            <CalendarIcon size={16} />
          </span>
          <input
            ref={ref}
            type="text"
            readOnly
            value={formatDate(value)}
            placeholder="Select date"
            disabled={disabled}
            style={{
              width: '100%',
              height: '40px',
              padding: '12px 12px 12px 36px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border-strong)'}`,
              backgroundColor: disabled ? 'var(--color-surface-muted)' : 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              outline: 'none',
              pointerEvents: 'none'
            }}
          />
        </div>
        {error && (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-error)' }}>
            {error}
          </span>
        )}

        {isOpen && rect && createPortal(
          <div 
            ref={popoverRef}
            style={{
              position: 'absolute',
              top: rect.bottom + 8,
              left: rect.left,
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--color-border)',
              padding: '16px',
              width: '280px',
              zIndex: 1000,
              animation: 'dropdownFadeIn 0.15s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button onClick={handlePrevMonth} style={{ color: 'var(--color-text-secondary)', padding: '4px' }}>
                <ChevronLeft size={20} />
              </button>
              <span style={{ fontWeight: 600 }}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={handleNextMonth} style={{ color: 'var(--color-text-secondary)', padding: '4px' }}>
                <ChevronRight size={20} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)' }}>{d}</div>
              ))}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const isSelected = value && value.getDate() === day && value.getMonth() === month && value.getFullYear() === year
                const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year
                
                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                      color: isSelected ? 'white' : 'var(--color-text-primary)',
                      border: isToday && !isSelected ? '1px solid var(--color-primary)' : 'none',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>,
          document.body
        )}
      </div>
    )
  }
)
DatePicker.displayName = 'DatePicker'
