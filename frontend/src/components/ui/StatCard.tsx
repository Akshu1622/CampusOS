import React from 'react'
import { Card } from './Card'

export interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  moduleColor?: 'academic' | 'people' | 'exams' | 'finance' | 'alerts' | 'hostel' | 'accent' | 'positive' | 'critical' | 'warning' | 'neutral'
  tone?: 'academic' | 'people' | 'exams' | 'finance' | 'alerts' | 'hostel' | 'accent' | 'positive' | 'critical' | 'warning' | 'neutral' | string
  supportText?: string
  description?: string
  supportColor?: 'success' | 'neutral' | 'error'
  trend?: 'up' | 'down'
  trendValue?: string
  onClick?: () => void
}

export function StatCard({
  label,
  value,
  icon,
  moduleColor,
  tone,
  supportText,
  description,
  supportColor = 'neutral',
  trend,
  trendValue,
  onClick
}: StatCardProps) {
  const effectiveTone = tone || moduleColor || 'academic'
  const effectiveSupportText = supportText || description

  // Map semantic tones to module colors
  let colorKey = effectiveTone
  if (colorKey === 'accent') colorKey = 'academic'
  if (colorKey === 'positive') colorKey = 'people'
  if (colorKey === 'critical') colorKey = 'alerts'
  if (colorKey === 'warning') colorKey = 'finance'
  if (colorKey === 'neutral') colorKey = 'academic'

  const chipBg = `var(--color-chip-${colorKey}-bg, var(--color-surface-muted))`
  const chipText = `var(--color-chip-${colorKey}-text, var(--color-primary))`

  return (
    <Card variant="compact" onClick={onClick} className="flex flex-col h-[112px]">
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', height: '100%' }}>
        {icon && (
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
        )}
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
          {effectiveSupportText && (
            <span style={{ 
              fontSize: 'var(--font-size-xs)', 
              color: supportColor === 'success' ? 'var(--color-success)' : supportColor === 'error' ? 'var(--color-error)' : 'var(--color-text-muted)', 
              marginTop: 'auto',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {effectiveSupportText}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
