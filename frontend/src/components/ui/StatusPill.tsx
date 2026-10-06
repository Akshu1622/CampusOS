import React from 'react'

export type StatusFamily = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface StatusPillProps {
  label: string
  status: StatusFamily
  showDot?: boolean
}

export function StatusPill({ label, status, showDot = true }: StatusPillProps) {
  const bg = `var(--color-${status}-bg)`
  const color = `var(--color-${status})`

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '24px',
        padding: '0 8px',
        borderRadius: 'var(--radius-pill)',
        backgroundColor: bg,
        color: color,
        fontSize: 'var(--font-size-xs)',
        fontWeight: 500,
        whiteSpace: 'nowrap'
      }}
    >
      {showDot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: color,
            marginRight: '6px'
          }}
        />
      )}
      {label}
    </span>
  )
}

interface BadgeProps {
  count: number | string
  variant?: 'danger' | 'primary' | 'warning'
}

export function Badge({ count, variant = 'danger' }: BadgeProps) {
  const bg = {
    danger: 'var(--color-error)',
    primary: 'var(--color-primary)',
    warning: 'var(--color-warning)'
  }[variant]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '18px',
        height: '18px',
        padding: '0 4px',
        borderRadius: 'var(--radius-pill)',
        backgroundColor: bg,
        color: 'white',
        fontSize: '10px',
        fontWeight: 600,
        lineHeight: 1
      }}
    >
      {count}
    </span>
  )
}
