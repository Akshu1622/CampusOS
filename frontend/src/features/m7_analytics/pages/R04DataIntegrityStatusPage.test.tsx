import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { R04DataIntegrityStatusPage } from './R04DataIntegrityStatusPage'
import { analyticsApi } from '../api'

vi.mock('../api', () => ({
  analyticsApi: {
    getIntegrityChecks: vi.fn().mockResolvedValue([
      {
        module: 'M2 Academics',
        check_name: 'Orphan Enrollments',
        status: 'PASS',
        affected_count: 0,
        sample_keys: null
      },
      {
        module: 'M1 Core',
        check_name: 'Student ID Format',
        status: 'PASS',
        affected_count: 0,
        sample_keys: null
      }
    ])
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

describe('R04DataIntegrityStatusPage', () => {
  it('renders data integrity invariants and module checks', async () => {
    renderWithClient(<R04DataIntegrityStatusPage />)

    expect(screen.getByText('Data Integrity & Referential Invariant Engine')).toBeInTheDocument()
    expect(await screen.findByText('Orphan Enrollments')).toBeInTheDocument()
    expect(await screen.findByText('Student ID Format')).toBeInTheDocument()
    expect(screen.getByText('Run Diagnostics')).toBeInTheDocument()
  })
})
