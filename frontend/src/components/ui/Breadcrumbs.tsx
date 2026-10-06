import React from 'react'
import { Link } from 'react-router-dom'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <React.Fragment key={index}>
            {isLast ? (
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {item.label}
              </span>
            ) : item.href ? (
              <Link to={item.href} style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
                {item.label}
              </Link>
            ) : (
              <span style={{ color: 'var(--color-text-muted)' }}>{item.label}</span>
            )}
            {!isLast && <span style={{ color: 'var(--color-text-muted)' }}>/</span>}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
