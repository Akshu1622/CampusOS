import React, { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div 
      className="tooltip-container" 
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            zIndex: 50,
            backgroundColor: 'var(--color-secondary)',
            color: 'white',
            fontSize: 'var(--font-size-xs)',
            padding: '8px',
            borderRadius: 'var(--radius-xs)',
            whiteSpace: 'nowrap',
            maxWidth: '240px',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            pointerEvents: 'none',
            ...getPositionStyles(position),
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}

function getPositionStyles(position: string): React.CSSProperties {
  switch (position) {
    case 'top':
      return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' }
    case 'bottom':
      return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' }
    case 'left':
      return { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' }
    case 'right':
      return { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' }
    default:
      return {}
  }
}
