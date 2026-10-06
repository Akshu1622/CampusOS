import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { IconButton } from './IconButton'

interface PaginationProps {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function Pagination({ currentPage, totalItems, pageSize, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px',
      borderTop: '1px solid var(--color-border)'
    }}>
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
        {totalItems > 0 ? `${startItem} to ${endItem} of ${totalItems}` : '0 results'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Rows per page:</span>
          <select 
            value={pageSize} 
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{
              padding: '4px 24px 4px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {[10, 25, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <IconButton 
            icon={<ChevronsLeft size={16} />} 
            label="First page" 
            size="sm" 
            variant="borderless" 
            disabled={currentPage === 1}
            onClick={() => onPageChange(1)}
          />
          <IconButton 
            icon={<ChevronLeft size={16} />} 
            label="Previous page" 
            size="sm" 
            variant="borderless" 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          />
          <span style={{ fontSize: 'var(--font-size-sm)', padding: '0 8px' }}>
            Page {currentPage} of {totalPages}
          </span>
          <IconButton 
            icon={<ChevronRight size={16} />} 
            label="Next page" 
            size="sm" 
            variant="borderless" 
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          />
          <IconButton 
            icon={<ChevronsRight size={16} />} 
            label="Last page" 
            size="sm" 
            variant="borderless" 
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
          />
        </div>
      </div>
    </div>
  )
}
