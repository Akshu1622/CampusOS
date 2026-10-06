import React from 'react'
import { Card } from './Card'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  moduleColor?: 'academic' | 'people' | 'exams' | 'finance' | 'alerts' | 'hostel'
  supportText?: string
  supportColor?: 'success' | 'neutral' | 'error'
  trend?: 'up' | 'down'
  trendValue?: string
  onClick?: () => void
}

export function StatCard({
  label,
  value,
  icon,
  moduleColor = 'academic',
  supportText,
  supportColor = 'neutral',
  trend,
  trendValue,
  onClick
}: StatCardProps) {
  
  const chipBg = `var(--color-chip-${moduleColor}-bg)`
  const chipText = `var(--color-chip-${moduleColor}-text)`

  return (
    <Card variant="compact" onClick={onClick} className="flex flex-col h-[112px]">
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', height: '100%' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          backgroundColor: chipBg,
          color: chipText,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span className="tabular-nums" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
              {value}
            </span>
            {trend && trendValue && (
              <span style={{ 
                fontSize: 'var(--font-size-xs)', 
                fontWeight: 600,
                color: trend === 'up' ? 'var(--color-success)' : 'var(--color-error)' 
              }}>
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </span>
            )}
          </div>
          {supportText && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: `var(--color-${supportColor})`, marginTop: 'auto' }}>
              {supportText}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
