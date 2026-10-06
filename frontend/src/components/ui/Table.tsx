import React from 'react'
import { Card } from './Card'
import { Pagination } from './Pagination'

export interface Column<T> {
  key: string
  header: string | React.ReactNode
  cell?: (item: T) => React.ReactNode
  render?: (item: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor?: (item: T) => string
  isLoading?: boolean
  selectedIds?: string[]
  onSelect?: (ids: string[]) => void
  emptyMessage?: string
  pagination?: {
    currentPage: number
    totalItems: number
    pageSize: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
  }
}

export function Table<T>({ data, columns, keyExtractor, isLoading, selectedIds, onSelect, pagination, emptyMessage = 'No records found.' }: TableProps<T>) {
  const keyFn = keyExtractor || ((item: any) => String(item.id ?? item.code ?? Math.random()))
  const allSelected = data.length > 0 && selectedIds?.length === data.length
  const someSelected = selectedIds && selectedIds.length > 0 && selectedIds.length < data.length

  const handleSelectAll = () => {
    if (!onSelect) return
    if (allSelected) onSelect([])
    else onSelect(data.map(keyFn))
  }

  const handleSelectOne = (id: string) => {
    if (!onSelect || !selectedIds) return
    if (selectedIds.includes(id)) onSelect(selectedIds.filter(i => i !== id))
    else onSelect([...selectedIds, id])
  }

  return (
    <Card variant="standard" className="w-full flex flex-col" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {onSelect && (
                <th style={{ padding: '12px 20px', width: '48px' }}>
                  <input 
                    type="checkbox" 
                    checked={allSelected} 
                    ref={input => {
                      if (input) input.indeterminate = someSelected || false
                    }}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}
              {columns.map((col, i) => (
                <th key={col.key || i} style={{ 
                  padding: '12px 20px', 
                  fontSize: '12px', 
                  fontWeight: 500, 
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.02em',
                  width: col.width,
                  textAlign: col.align || 'left'
                }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {onSelect && <td style={{ padding: '12px 20px' }}><div style={{ width: '16px', height: '16px', backgroundColor: 'var(--color-surface-muted)', borderRadius: '4px' }} /></td>}
                  {columns.map((col, j) => (
                    <td key={`skel-col-${j}`} style={{ padding: '12px 20px' }}>
                      <div style={{ height: '16px', backgroundColor: 'var(--color-surface-muted)', borderRadius: '4px', width: '80%', animation: 'shimmer 1.2s ease-in-out infinite alternate' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelect ? 1 : 0)} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const id = keyFn(item)
                const isSelected = selectedIds?.includes(id)
                return (
                  <tr key={id} style={{ 
                    borderBottom: '1px solid var(--color-border)',
                    backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'transparent',
                    transition: 'background-color 150ms'
                  }}>
                    {onSelect && (
                      <td style={{ padding: '12px 20px' }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected || false} 
                          onChange={() => handleSelectOne(id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    )}
                    {columns.map((col, i) => (
                      <td key={col.key || i} style={{ 
                        padding: '12px 20px', 
                        fontSize: '13px',
                        textAlign: col.align || 'left'
                      }}>
                        {col.cell ? col.cell(item) : col.render ? col.render(item) : null}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {pagination && (
        <Pagination {...pagination} />
      )}
    </Card>
  )
}
