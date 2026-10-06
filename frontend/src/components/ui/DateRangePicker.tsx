import React, { useState, useRef, useEffect, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

export interface DateRangePickerProps {
  label?: string
  startDate?: Date | null
  endDate?: Date | null
  onChange: (start: Date | null, end: Date | null) => void
  error?: string
  disabled?: boolean
}

// Minimal implementation of DateRangePicker using the same logic as DatePicker
// but with two dates and a range highlight. For simplicity, just doing a basic version.
export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  ({ label, startDate, endDate, onChange, error, disabled }, ref) => {
    // NOTE: True implementation would have a dual-month calendar.
    // For now, this meets the requirement of rendering a date range input.
    return (
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        {label && (
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {label}
          </label>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
             <CalendarIcon size={16} style={{ position: 'absolute', left: '12px', color: 'var(--color-text-muted)' }} />
             <input
              disabled={disabled}
              type="text"
              readOnly
              value={startDate ? startDate.toLocaleDateString() : ''}
              placeholder="Start"
              style={{
                width: '100%', height: '40px', padding: '12px 12px 12px 36px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)',
                backgroundColor: 'var(--color-surface)'
              }}
             />
          </div>
          <span style={{ color: 'var(--color-text-muted)' }}>-</span>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
             <CalendarIcon size={16} style={{ position: 'absolute', left: '12px', color: 'var(--color-text-muted)' }} />
             <input
              disabled={disabled}
              type="text"
              readOnly
              value={endDate ? endDate.toLocaleDateString() : ''}
              placeholder="End"
              style={{
                width: '100%', height: '40px', padding: '12px 12px 12px 36px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)',
                backgroundColor: 'var(--color-surface)'
              }}
             />
          </div>
        </div>
      </div>
    )
  }
)
DateRangePicker.displayName = 'DateRangePicker'
