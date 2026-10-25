import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { R02ReportPage } from './R02ReportPage'
import { analyticsApi } from '../api'

vi.mock('../api', () => ({
  analyticsApi: {
    getReportData: vi.fn().mockResolvedValue({
      data: [
        {
          student_id: 1,
          first_name: 'John',
          last_name: 'Doe',
          department_name: 'Computer Science',
          program_name: 'B.Tech CSE',
          cgpa: 9.5,
          dept_rank: 1
        }
      ],
      total: 1,
      page: 1,
      size: 20
    }),
    downloadReportCsv: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' }))
  }
}))

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/analytics/reports/RP-1']}>
        <Routes>
          <Route path="/admin/analytics/reports/:reportKey" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('R02ReportPage', () => {
  it('renders report title and data table for RP-1', async () => {
    renderWithClient(<R02ReportPage />)
    
    expect(await screen.findByText('Department-wise CGPA Ranking')).toBeInTheDocument()
    expect(await screen.findByText('John Doe')).toBeInTheDocument()
    expect(await screen.findByText('B.Tech CSE')).toBeInTheDocument()
    expect(screen.getByText('Export CSV')).toBeInTheDocument()
  })
})
