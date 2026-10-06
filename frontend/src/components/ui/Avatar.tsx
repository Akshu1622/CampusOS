import React from 'react'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  src?: string
  showStatus?: boolean
  status?: 'online' | 'offline' | 'busy'
}

export function Avatar({ name, size = 'md', src, showStatus, status = 'online' }: AvatarProps) {
  const sizes = {
    sm: '24px',
    md: '32px',
    lg: '40px',
    xl: '64px'
  }
  
  const fontSizes = {
    sm: '10px',
    md: '12px',
    lg: '14px',
    xl: '20px'
  }

  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // Deterministic color based on name
  const colors = [
    { bg: '#E8EEFF', color: '#3B4FE0' }, // academic tint
    { bg: '#E5F6EC', color: '#16A34A' }, // people tint
    { bg: '#F0EAFE', color: '#7C3AED' }, // exams tint
    { bg: '#FEF0DC', color: '#D97706' }, // finance tint
    { bg: '#FDE8EC', color: '#E11D48' }, // alert tint
    { bg: '#E0F5F3', color: '#0D9488' }  // hostel tint
  ]
  const colorIndex = name.length % colors.length
  const theme = colors[colorIndex]

  const statusColors = {
    online: 'var(--color-success)',
    offline: 'var(--color-text-muted)',
    busy: 'var(--color-error)'
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{
        width: sizes[size],
        height: sizes[size],
        borderRadius: '50%',
        backgroundColor: theme.bg,
        color: theme.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fontSizes[size],
        fontWeight: 600,
        overflow: 'hidden'
      }}>
        {src ? (
          <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          initials
        )}
      </div>
      {showStatus && (
        <span style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: size === 'sm' ? '6px' : size === 'xl' ? '12px' : '8px',
          height: size === 'sm' ? '6px' : size === 'xl' ? '12px' : '8px',
          borderRadius: '50%',
          backgroundColor: statusColors[status],
          border: '2px solid var(--color-surface)'
        }} />
      )}
    </div>
  )
}
