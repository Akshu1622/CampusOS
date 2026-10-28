import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { S03HostelOccupancyDashboardPage } from './pages/S03HostelOccupancyDashboardPage'
import { S08HostelIntegrityGuardianPage } from './pages/S08HostelIntegrityGuardianPage'
import { S10CapacitySimulatorPage } from './pages/S10CapacitySimulatorPage'
import { S11HostelChangeRadarPage } from './pages/S11HostelChangeRadarPage'
import { S17HostelFeeManagementPage } from './pages/S17HostelFeeManagementPage'
import { HostelFeeStudentView } from './components/HostelFeeStudentView'
import { DemographicsImportModal } from './components/DemographicsImportModal'

// Mock API methods
vi.mock('./api', () => ({
  getHostels: vi.fn().mockResolvedValue([
    { id: 1, name: 'Bhabha Hall', gender_block: 'MALE', total_capacity: 100 },
    { id: 2, name: 'Curie Hall', gender_block: 'FEMALE', total_capacity: 80 }
  ]),
  getRooms: vi.fn().mockResolvedValue([
    { id: 1, hostel_id: 1, room_number: '101', bed_capacity: 2, available_beds: 1, gender_block: 'MALE', hostel_name: 'Bhabha Hall' },
    { id: 2, hostel_id: 2, room_number: '201', bed_capacity: 2, available_beds: 2, gender_block: 'FEMALE', hostel_name: 'Curie Hall' }
  ]),
  getOccupancy: vi.fn().mockResolvedValue([
    { hostel_id: 1, hostel_name: 'Bhabha Hall', gender_block: 'MALE', total_capacity: 100, occupied_beds: 60, available_beds: 40, occupancy_pct: 60 },
    { hostel_id: 2, hostel_name: 'Curie Hall', gender_block: 'FEMALE', total_capacity: 80, occupied_beds: 40, available_beds: 40, occupancy_pct: 50 }
  ]),
  getAllocations: vi.fn().mockResolvedValue([]),
  getIntegrityGuardianReport: vi.fn().mockResolvedValue({
    status: 'HEALTHY',
    total_checks_run: 5,
    critical_count: 0,
    high_count: 0,
    medium_count: 0,
    findings: [
      {
        code: 'BED_COUNT_VERIFIED',
        severity: 'INFO',
        entity: 'room',
        record_id: 1,
        reference_key: 'R-101',
        description: 'Room bed counts and occupant records are in exact balance.',
        recommended_action: 'No action required.'
      }
    ]
  }),
  simulateCapacityWhatIf: vi.fn().mockResolvedValue({
    is_simulation: true,
    parameters_applied: { extra_male_applicants: 10, extra_female_applicants: 10, closed_room_ids: [] },
    overall_campus_shortage: 0,
    recommendations: ['Campus capacity is sufficient to absorb modeled intake surge.'],
    hostel_projections: [
      {
        hostel_id: 1,
        hostel_name: 'Bhabha Hall',
        gender_block: 'MALE',
        current_capacity: 100,
        simulated_capacity: 100,
        current_available: 40,
        simulated_available: 30,
        projected_shortage: 0,
        utilization_rate: 70
      }
    ]
  }),
  getChangeImpactRadar: vi.fn().mockResolvedValue({
    action: 'CLOSE_ROOM',
    severity_level: 'LOW',
    displaced_residents_count: 0,
    capacity_loss: 2,
    affected_residents: [],
    mitigation_options: ['Selected rooms currently hold zero active residents. Planned maintenance can proceed safely.']
  }),
  getHostelFeeSummary: vi.fn().mockResolvedValue({
    total_invoiced: 50000,
    total_collected: 25000,
    total_pending: 25000,
    invoices_count: 2,
    pending_verification_count: 1
  }),
  getHostelFeeConfigs: vi.fn().mockResolvedValue([
    { id: 1, fee_name: 'Hostel Rent 2026', amount: 25000, academic_term: 'AY-2026-27-SEM1', due_days: 30, created_at: '2026-10-28T00:00:00' }
  ]),
  createHostelFeeConfig: vi.fn().mockResolvedValue({ id: 2 }),
  generateBatchHostelInvoices: vi.fn().mockResolvedValue({ status: 'COMPLETED', invoices_generated: 2, skipped_existing: 0 }),
  getHostelInvoices: vi.fn().mockResolvedValue([
    {
      id: 1,
      invoice_number: 'HOS-INV-001',
      student_id: 1,
      student_name: 'Demo Student',
      global_student_id: 'STU-001',
      hostel_id: 1,
      hostel_name: 'Bhabha Hall',
      title: 'Hostel Rent Fall 2026',
      amount: 25000,
      amount_paid: 0,
      balance: 25000,
      due_date: '2026-11-30',
      status: 'UNPAID',
      created_at: '2026-10-28T00:00:00'
    }
  ]),
  getAllHostelPayments: vi.fn().mockResolvedValue([]),
  verifyHostelPayment: vi.fn().mockResolvedValue({ status: 'SUCCESS' }),
  getMyHostelInvoices: vi.fn().mockResolvedValue([
    {
      id: 1,
      invoice_number: 'HOS-INV-001',
      student_id: 1,
      student_name: 'Demo Student',
      global_student_id: 'STU-001',
      hostel_id: 1,
      hostel_name: 'Bhabha Hall',
      title: 'Hostel Rent Fall 2026',
      amount: 25000,
      amount_paid: 0,
      balance: 25000,
      due_date: '2026-11-30',
      status: 'UNPAID',
      created_at: '2026-10-28T00:00:00'
    }
  ]),
  payMyHostelFee: vi.fn().mockResolvedValue({ id: 1, status: 'VERIFIED' }),
  getMyHostelPayments: vi.fn().mockResolvedValue([]),
  searchHostelStudents: vi.fn().mockResolvedValue([])
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

describe('Module 6 - Hostel Management Frontend Tests', () => {
  it('S03HostelOccupancyDashboardPage renders metrics, feature navigation banner, and occupancy cards', async () => {
    renderWithClient(<S03HostelOccupancyDashboardPage />)

    expect(screen.getByText('Hostel Occupancy & Bed Utilization Analytics')).toBeInTheDocument()
    expect(screen.getByText('Intelligent Hostel Operations & Decision Lab')).toBeInTheDocument()
    expect(screen.getByText('Integrity Guardian')).toBeInTheDocument()
    expect(screen.getByText('Smart Allocation Lab')).toBeInTheDocument()
    expect(screen.getByText('What-If Simulator')).toBeInTheDocument()
    expect(screen.getByText('Change Impact Radar')).toBeInTheDocument()

    const bhabhaElements = await screen.findAllByText('Bhabha Hall')
    expect(bhabhaElements.length).toBeGreaterThan(0)
    const curieElements = await screen.findAllByText('Curie Hall')
    expect(curieElements.length).toBeGreaterThan(0)
  })

  it('S08HostelIntegrityGuardianPage renders health banner and diagnostic findings', async () => {
    renderWithClient(<S08HostelIntegrityGuardianPage />)

    expect(screen.getByText('Hostel Data Integrity Guardian')).toBeInTheDocument()
    expect(await screen.findByText(/System Health: HEALTHY/)).toBeInTheDocument()
    expect(await screen.findByText('BED_COUNT_VERIFIED')).toBeInTheDocument()
    expect(await screen.findByText('Room bed counts and occupant records are in exact balance.')).toBeInTheDocument()
  })

  it('S10CapacitySimulatorPage renders scenario controls and modeled utilization', async () => {
    renderWithClient(<S10CapacitySimulatorPage />)

    expect(screen.getByText('Capacity What-If Scenario Simulator')).toBeInTheDocument()
    expect(screen.getByText('Scenario Modeling Parameters')).toBeInTheDocument()
    expect(screen.getByText('Execute What-If Model')).toBeInTheDocument()
    expect(await screen.findByText('Campus capacity is sufficient to absorb modeled intake surge.')).toBeInTheDocument()
  })

  it('DemographicsImportModal renders dual import modes and template downloads', () => {
    renderWithClient(<DemographicsImportModal isOpen={true} onClose={() => {}} />)

    expect(screen.getByText('Hostel Operations CSV Import Center')).toBeInTheDocument()
    expect(screen.getByText('Student Demographics & Eligibility')).toBeInTheDocument()
    expect(screen.getByText('Room Inventory & Capacities')).toBeInTheDocument()
    expect(screen.getByText('Download Sample CSV')).toBeInTheDocument()
    expect(screen.getByText('Run Demographics Import')).toBeInTheDocument()
  })

  it('S11HostelChangeRadarPage renders planned closures and analysis toolbar', async () => {
    renderWithClient(<S11HostelChangeRadarPage />)

    expect(screen.getByText('Hostel Change Impact Radar')).toBeInTheDocument()
    expect(screen.getByText('1. Select Planned Room Closures')).toBeInTheDocument()
    expect(screen.getByText('Analyze Impact')).toBeInTheDocument()
    expect(await screen.findByText('Room 101')).toBeInTheDocument()
  })

  it('S17HostelFeeManagementPage renders fee summary metrics and invoice ledger', async () => {
    renderWithClient(<S17HostelFeeManagementPage />)

    expect(screen.getByText('Hostel Fee Management & Verification')).toBeInTheDocument()
    expect(screen.getByText('Total Invoiced')).toBeInTheDocument()
    expect(screen.getByText('Collections Verified')).toBeInTheDocument()
    expect(screen.getByText('Generate Term Invoices')).toBeInTheDocument()
    expect(await screen.findByText('HOS-INV-001')).toBeInTheDocument()
  })

  it('HostelFeeStudentView renders student billing dues and payment actions', async () => {
    renderWithClient(<HostelFeeStudentView studentName="Demo Student" globalStudentId="STU-001" hostelName="Bhabha Hall" roomNumber="101" />)

    expect(screen.getByText('Total Hostel Dues')).toBeInTheDocument()
    expect(screen.getByText('Outstanding Balance')).toBeInTheDocument()
    expect(screen.getByText('Assigned Invoices')).toBeInTheDocument()
    expect(await screen.findByText('Pay Fee via UPI / QR')).toBeInTheDocument()
  })
})
