import React from 'react'

export function LinearProgress({ value, color = 'var(--color-primary)' }: { value: number; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', backgroundColor: color, borderRadius: 'var(--radius-pill)', transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{value}%</span>
    </div>
  )
}

export function CircularProgress({ value, size = 40, strokeWidth = 4, color = 'var(--color-primary)' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle 
          cx={size/2} cy={size/2} r={radius} 
          stroke="var(--color-border)" strokeWidth={strokeWidth} fill="none" 
        />
        <circle 
          cx={size/2} cy={size/2} r={radius} 
          stroke={color} strokeWidth={strokeWidth} fill="none" 
          strokeDasharray={circumference} strokeDashoffset={offset} 
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <span style={{ position: 'absolute', fontSize: `${size * 0.25}px`, fontWeight: 600 }}>{value}%</span>
    </div>
  )
}

export function Spinner({ size = 20, color = 'var(--color-primary)' }: { size?: number; color?: string }) {
  return (
    <div 
      className="animate-spin"
      style={{
        width: size,
        height: size,
        border: `2px solid var(--color-border)`,
        borderTopColor: color,
        borderRadius: '50%',
        display: 'inline-block'
      }}
    />
  )
}

export function Stepper({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {steps.map((step, index) => {
        const isActive = index <= currentStep
        const isLast = index === steps.length - 1
        return (
          <React.Fragment key={index}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                color: isActive ? 'white' : 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                border: `2px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`
              }}>
                {index + 1}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 500, color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                {step}
              </span>
            </div>
            {!isLast && (
              <div style={{
                flex: 1,
                height: '2px',
                backgroundColor: index < currentStep ? 'var(--color-primary)' : 'var(--color-border)',
                marginTop: '-18px'
              }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
