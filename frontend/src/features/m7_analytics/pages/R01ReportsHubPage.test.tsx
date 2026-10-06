import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { R01ReportsHubPage } from './R01ReportsHubPage'

describe('R01ReportsHubPage', () => {
  it('renders all reports by default', () => {
    render(
      <MemoryRouter>
        <R01ReportsHubPage />
      </MemoryRouter>
    )
    expect(screen.getByText('Reports Hub')).toBeInTheDocument()
    expect(screen.getAllByText('Open Report').length).toBe(10)
  })

  it('filters reports by search query', () => {
    render(
      <MemoryRouter>
        <R01ReportsHubPage />
      </MemoryRouter>
    )
    const searchInput = screen.getByPlaceholderText('Search reports...')
    fireEvent.change(searchInput, { target: { value: 'Hostel Occupancy' } })
    
    // Only one report should match
    expect(screen.getAllByText('Open Report').length).toBe(1)
    expect(screen.getByText('Hostel Occupancy')).toBeInTheDocument()
  })

  it('filters reports by category', () => {
    render(
      <MemoryRouter>
        <R01ReportsHubPage />
      </MemoryRouter>
    )
    
    const hrTab = screen.getByRole('button', { name: 'HR' })
    fireEvent.click(hrTab)
    
    // HR category has RP-7 and RP-8
    expect(screen.getAllByText('Open Report').length).toBe(2)
    expect(screen.getByText('Payroll Summary')).toBeInTheDocument()
    expect(screen.getByText('Faculty Leave Utilisation')).toBeInTheDocument()
  })
})
