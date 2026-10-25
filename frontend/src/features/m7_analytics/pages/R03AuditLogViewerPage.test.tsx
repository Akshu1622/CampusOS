import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { R03AuditLogViewerPage } from './R03AuditLogViewerPage'
import { analyticsApi } from '../api'

vi.mock('../api', () => ({
  analyticsApi: {
    getAuditLogs: vi.fn().mockResolvedValue({
      data: [
        {
          source: 'GENERAL',
          log_id: 101,
          entity_name: 'course_offering',
          entity_id: '5',
          action: 'CREATE',
          before_state: null,
          after_state: '{"section": "A"}',
          actor: 'admin_core',
          timestamp: '2026-10-25T12:00:00Z'
        }
      ],
      total: 1,
      page: 1,
      size: 25
    }),
    downloadAuditLogsCsv: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' }))
  }
}))

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('R03AuditLogViewerPage', () => {
  it('renders audit ledger title, stats, and log entries', async () => {
    renderWithClient(<R03AuditLogViewerPage />)

    expect(screen.getByText('System Audit & Governance Ledger')).toBeInTheDocument()
    expect(await screen.findByText('admin_core')).toBeInTheDocument()
    expect(await screen.findByText('course_offering')).toBeInTheDocument()
    expect(screen.getByText('Export CSV')).toBeInTheDocument()
  })
})
