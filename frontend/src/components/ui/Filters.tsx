import React, { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from './Button'
import { Drawer } from './Drawer'

export interface FilterDefinition {
  id: string
  label: string
  type: 'select' | 'multi-select' | 'date'
  options?: { label: string; value: string }[]
}

interface FiltersProps {
  filters: FilterDefinition[]
  values: Record<string, any>
  onChange: (values: Record<string, any>) => void
}

export function Filters({ filters, values, onChange }: FiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const activeCount = Object.keys(values).filter(k => values[k] !== undefined && values[k] !== '' && (!Array.isArray(values[k]) || values[k].length > 0)).length

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Button 
          variant="secondary" 
          leftIcon={<Filter size={16} />} 
          onClick={() => setIsOpen(true)}
        >
          All filters {activeCount > 0 && `(${activeCount})`}
        </Button>
        {activeCount >= 3 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(values).filter(([_, v]) => v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0)).map(([key, val]) => {
              const def = filters.find(f => f.id === key)
              if (!def) return null
              const displayVal = Array.isArray(val) ? `${val.length} selected` : val
              return (
                <span key={key} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--color-surface-muted)',
                  border: '1px solid var(--color-border)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '12px'
                }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{def.label}:</span>
                  {displayVal}
                  <button 
                    onClick={() => onChange({ ...values, [key]: undefined })}
                    style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}
                  >
                    <X size={12} />
                  </button>
                </span>
              )
            })}
            <button 
              onClick={() => onChange({})}
              style={{ fontSize: '12px', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Filters"
        size="sm"
        footer={
          <>
            <Button variant="tertiary" onClick={() => { onChange({}); setIsOpen(false) }}>Clear all</Button>
            <Button onClick={() => setIsOpen(false)}>Apply filters</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filters.map(f => (
            <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{f.label}</label>
              {f.type === 'select' && (
                <select 
                  value={values[f.id] || ''} 
                  onChange={(e) => onChange({ ...values, [f.id]: e.target.value })}
                  style={{
                    height: '40px', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-surface)'
                  }}
                >
                  <option value="">Any</option>
                  {f.options?.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )}
              {/* Note: Multi-select and Date would be implemented here in a full version. */}
            </div>
          ))}
        </div>
      </Drawer>
    </>
  )
}
