import React, { useState } from 'react'
import { Badge } from './StatusPill'

export interface Tab {
  id: string
  label: string
  count?: number
  content: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  variant?: 'underline' | 'pill'
  defaultActive?: string
  onChange?: (id: string) => void
}

export function Tabs({ tabs, variant = 'underline', defaultActive, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultActive || tabs[0]?.id)

  const handleTabClick = (id: string) => {
    setActiveTab(id)
    if (onChange) onChange(id)
  }

  if (variant === 'pill') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        <div style={{
          display: 'inline-flex',
          backgroundColor: 'var(--color-surface-muted)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          gap: '4px'
        }}>
          {tabs.map(tab => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  backgroundColor: isActive ? 'var(--color-surface)' : 'transparent',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  boxShadow: isActive ? 'var(--shadow-xs)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms'
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
        <div>
          {tabs.find(t => t.id === activeTab)?.content}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--color-border)',
        gap: '24px'
      }}>
        {tabs.map(tab => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 0',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 150ms',
                marginBottom: '-1px'
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <Badge count={tab.count} variant={isActive ? 'primary' : 'warning'} />
              )}
            </button>
          )
        })}
      </div>
      <div style={{ paddingTop: '24px' }}>
        {tabs.find(t => t.id === activeTab)?.content}
      </div>
    </div>
  )
}
