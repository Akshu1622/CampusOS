import React from 'react'

interface SkeletonProps {
  type?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  className?: string
}

export function LoadingSkeleton({ type = 'text', width, height, className = '' }: SkeletonProps) {
  const baseStyles: React.CSSProperties = {
    backgroundColor: 'var(--color-surface-muted)',
    animation: 'shimmer 1.2s ease-in-out infinite alternate',
  }

  if (type === 'text') {
    baseStyles.width = width || '100%'
    baseStyles.height = height || '1em'
    baseStyles.borderRadius = 'var(--radius-sm)'
    baseStyles.marginTop = '0.25em'
    baseStyles.marginBottom = '0.25em'
  } else if (type === 'circular') {
    baseStyles.width = width || '40px'
    baseStyles.height = height || '40px'
    baseStyles.borderRadius = '50%'
  } else {
    baseStyles.width = width || '100%'
    baseStyles.height = height || '100px'
    baseStyles.borderRadius = 'var(--radius-md)'
  }

  return (
    <>
      <div className={className} style={baseStyles} />
      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.5; background-color: var(--color-surface-muted); }
          100% { opacity: 1; background-color: var(--color-border); }
        }
      `}</style>
    </>
  )
}
