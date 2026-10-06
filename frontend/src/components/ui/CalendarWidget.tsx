import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from './Card'

interface CalendarWidgetProps {
  events?: { date: Date; module: string; color: string }[]
  onDateClick?: (date: Date) => void
}

export function CalendarWidget({ events = [], onDateClick }: CalendarWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay()

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

  return (
    <Card variant="compact">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button onClick={handlePrevMonth} style={{ color: 'var(--color-text-secondary)', padding: '4px' }}>
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontWeight: 600, fontSize: '13px' }}>
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={handleNextMonth} style={{ color: 'var(--color-text-secondary)', padding: '4px' }}>
          <ChevronRight size={20} />
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)' }}>{d}</div>
        ))}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year
          const isWeekend = (firstDay + i) % 7 === 0 || (firstDay + i) % 7 === 6
          const dayEvents = events.filter(e => e.date.getDate() === day && e.date.getMonth() === month && e.date.getFullYear() === year)

          return (
            <div
              key={day}
              onClick={() => onDateClick?.(new Date(year, month, day))}
              style={{
                width: '100%',
                aspectRatio: '1/1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingTop: '4px',
                fontSize: '12px',
                backgroundColor: isWeekend ? 'var(--color-surface-muted)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                cursor: onDateClick ? 'pointer' : 'default',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (onDateClick) e.currentTarget.style.backgroundColor = 'var(--color-primary-subtle)'
              }}
              onMouseLeave={(e) => {
                if (onDateClick) e.currentTarget.style.backgroundColor = isWeekend ? 'var(--color-surface-muted)' : 'transparent'
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: isToday ? 'var(--color-primary)' : 'transparent',
                color: isToday ? 'white' : (isWeekend ? 'var(--color-text-secondary)' : 'var(--color-text-primary)'),
                fontWeight: isToday ? 600 : 400
              }}>
                {day}
              </div>
              <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                {dayEvents.slice(0, 3).map((e, idx) => (
                  <div key={idx} style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: e.color }} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
