import { apiClient } from '@/api/client'

export type GenderBlock = 'MALE' | 'FEMALE' | 'COED'
export type AllocationStatus = 'ACTIVE' | 'VACATED'
export type RequestType = 'ALLOCATION' | 'ROOM_CHANGE' | 'VACATE'
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ComplaintCategory =
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'MESS_FOOD'
  | 'CLEANING_SANITATION'
  | 'WATER_UTILITIES'
  | 'INTERNET_WIFI'
  | 'ROOM_FURNITURE'
  | 'CARPENTRY'
  | 'CLEANING'
  | 'INTERNET'
  | 'OTHER'
export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'
export type ComplaintStatus = 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export interface Hostel {
  id: number
  name: string
  gender_block: GenderBlock
  total_capacity: number
}

export interface Room {
  id: number
  hostel_id: number
  room_number: string
  bed_capacity: number
  available_beds: number
  hostel_name?: string
  gender_block?: GenderBlock
  readiness_status?: string
}

export interface HostelAllocation {
  id: number
  student_id: number
  room_id: number
  from_date: string
  to_date: string | null
  bed_number?: string | null
  status: AllocationStatus
  global_student_id?: string
  student_name?: string
  student_email?: string
  student_gender?: string
  room_number?: string
  hostel_id?: number
  hostel_name?: string
  gender_block?: GenderBlock
  allocated_by?: number | null
  created_at?: string
}

export interface HostelRequest {
  id: number
  student_id: number
  request_type: RequestType
  details: string | null
  preferred_hostel_id?: number | null
  preferred_room_id?: number | null
  status: RequestStatus
  decision_by: number | null
  remark: string | null
  global_student_id?: string
  student_name?: string
  student_email?: string
  student_gender?: string
  program_code?: string
  preferred_hostel_name?: string
  preferred_room_number?: string
  created_at?: string
  updated_at?: string
}

export interface HostelOccupancy {
  hostel_id: number
  hostel_name: string
  gender_block: GenderBlock
  total_capacity: number
  occupied_beds: number
  available_beds: number
  occupancy_pct: number | null
}

export interface StudentSearchItem {
  id: number
  student_id?: number
  global_student_id: string
  first_name: string
  last_name: string
  full_name?: string
  gender: string | null
  is_hostel_eligible: boolean
  status: string
  program_code?: string
  has_active_allocation: number
}

export interface HostelComplaint {
  id: number
  student_id: number
  hostel_id: number
  room_id?: number | null
  category: ComplaintCategory
  priority: ComplaintPriority
  title: string
  description: string
  status: ComplaintStatus
  assigned_to?: string | null
  resolution_notes?: string | null
  resolved_at?: string | null
  created_at: string
  updated_at: string
  student_name?: string
  global_student_id?: string
  hostel_name?: string
  room_number?: string
}

export interface HostelInspection {
  id: number
  room_id: number
  student_id?: number | null
  inspection_type: string
  cleanliness_rating: number
  fixtures_condition: string
  inventory_checked: boolean
  remarks?: string | null
  inspector_name: string
  created_at: string
  room_number?: string
  hostel_name?: string
  student_name?: string
  global_student_id?: string
}

export interface HostelNotice {
  id: number
  hostel_id?: number | null
  title: string
  content: string
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT' | 'EMERGENCY'
  published_by?: number | null
  created_at: string
  hostel_name?: string
  publisher_name?: string
}

export interface HostelOutpass {
  id: number
  student_id: number
  from_datetime: string
  to_datetime: string
  destination: string
  reason: string
  status: RequestStatus
  decision_by?: number | null
  decision_remark?: string | null
  created_at: string
  student_name?: string
  global_student_id?: string
}

// Signature Feature Interfaces
export interface IntegrityFinding {
  code: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO'
  entity: string
  record_id?: number | null
  reference_key?: string | null
  description: string
  recommended_action: string
}

export interface IntegrityGuardianReport {
  status: 'HEALTHY' | 'WARNINGS' | 'CRITICAL_ISSUES'
  total_checks_run: number
  critical_count: number
  high_count: number
  medium_count: number
  findings: IntegrityFinding[]
}

export interface RoomScoreDetail {
  room_id: number
  room_number: string
  hostel_id: number
  hostel_name: string
  gender_block: GenderBlock
  bed_capacity: number
  available_beds: number
  score: number
  eligible: boolean
  reasons: string[]
  suggested_bed: string
}

export interface SmartAllocationResponse {
  student_id: number
  global_student_id: string
  student_name: string
  gender: string | null
  is_eligible: boolean
  eligibility_note: string
  recommended_rooms: RoomScoreDetail[]
}

export interface SimulatedHostelMetric {
  hostel_id: number
  hostel_name: string
  gender_block: GenderBlock
  current_capacity: number
  simulated_capacity: number
  current_available: number
  simulated_available: number
  projected_shortage: number
  utilization_rate: number
}

export interface CapacitySimulationResponse {
  is_simulation: boolean
  parameters_applied: any
  hostel_projections: SimulatedHostelMetric[]
  overall_campus_shortage: number
  recommendations: string[]
}

export interface ImpactAffectedResident {
  student_id: number
  global_student_id: string
  student_name: string
  room_id: number
  room_number: string
  hostel_name: string
  suggested_alternate_room_id?: number | null
  suggested_alternate_room_number?: string | null
}

export interface ImpactRadarResponse {
  action: string
  severity_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING'
  displaced_residents_count: number
  capacity_loss: number
  affected_residents: ImpactAffectedResident[]
  mitigation_options: string[]
}

export interface JourneyEvent {
  event_type: string
  timestamp: string
  title: string
  description: string
  status_badge?: string
  badge_variant?: 'success' | 'warning' | 'error' | 'neutral'
  metadata: Record<string, any>
}

export interface StudentJourneyResponse {
  student_id: number
  global_student_id: string
  student_name: string
  current_status: string
  current_hostel?: string | null
  current_room?: string | null
  events: JourneyEvent[]
  timeline?: JourneyEvent[]
}

// --- API Calls ---

export const getHostels = () => apiClient<Hostel[]>('/hostels')
export const createHostel = (data: Partial<Hostel>) => apiClient<Hostel>('/hostels', { data })
export const updateHostel = (id: number, data: Partial<Hostel>) => apiClient<Hostel>(`/hostels/${id}`, { method: 'PUT', data })
export const deleteHostel = (id: number) => apiClient<void>(`/hostels/${id}`, { method: 'DELETE' })

export const getRooms = (params?: { hostel_id?: number }) => apiClient<Room[]>('/rooms', { params })
export const createRoom = (data: Partial<Room>) => apiClient<Room>('/rooms', { data })
export const updateRoom = (id: number, data: Partial<Room>) => apiClient<Room>(`/rooms/${id}`, { method: 'PUT', data })
export const deleteRoom = (id: number) => apiClient<void>(`/rooms/${id}`, { method: 'DELETE' })

export const getOccupancy = () => apiClient<HostelOccupancy[]>('/hostels/occupancy')

export const getAllocations = (params?: { hostel_id?: number; room_id?: number; status?: string; search?: string }) =>
  apiClient<HostelAllocation[]>('/hostel-allocations', { params })

export const allocateRoom = (data: { student_id: number; room_id: number; from_date: string; to_date?: string; bed_number?: string }) =>
  apiClient<HostelAllocation>('/hostel-allocations', { data })

export const vacateRoom = (alloc_id: number) =>
  apiClient<HostelAllocation>(`/hostel-allocations/${alloc_id}/vacate`, { method: 'PATCH' })

export const transferRoom = (alloc_id: number, data: { new_room_id: number; new_bed_number?: string }) =>
  apiClient<HostelAllocation>(`/hostel-allocations/${alloc_id}/transfer`, { method: 'POST', data })

export const getMyHostel = () => apiClient<HostelAllocation | null>('/me/hostel')

export const searchHostelStudents = (q: string) =>
  apiClient<StudentSearchItem[]>(`/hostel-students/search?q=${encodeURIComponent(q)}`)

export const createMyRequest = (data: { request_type: RequestType; details?: string; preferred_hostel_id?: number; preferred_room_id?: number }) =>
  apiClient<HostelRequest>('/hostel-requests', { data })

export const getMyRequests = (params?: { status?: RequestStatus }) =>
  apiClient<HostelRequest[]>('/me/hostel-requests', { params })

export const getAllRequests = (params?: { status?: RequestStatus }) =>
  apiClient<HostelRequest[]>('/hostel-requests', { params })

export const decideRequest = (id: number, data: { status: RequestStatus; remark?: string }) =>
  apiClient<HostelRequest>(`/hostel-requests/${id}/decision`, { method: 'PATCH', data })

// Complaints
export const createComplaint = (data: { hostel_id: number; room_id?: number; category: ComplaintCategory; priority: ComplaintPriority; title: string; description: string }) =>
  apiClient<HostelComplaint>('/hostel-complaints', { data })

export const getMyComplaints = () => apiClient<HostelComplaint[]>('/me/hostel-complaints')
export const getAllComplaints = (params?: { hostel_id?: number; status?: string }) =>
  apiClient<HostelComplaint[]>('/hostel-complaints', { params })

export const updateComplaintStatus = (id: number, data: { status?: ComplaintStatus; priority?: ComplaintPriority; assigned_to?: string; resolution_notes?: string }) =>
  apiClient<HostelComplaint>(`/hostel-complaints/${id}/status`, { method: 'PATCH', data })

// Waitlist
export type WaitlistStatus = 'WAITING' | 'OFFERED' | 'EXPIRED' | 'CANCELLED'

export interface HostelWaitlist {
  id: number
  student_id: number
  preferred_hostel_id: number
  preferred_room_id?: number | null
  priority_score: number
  status: WaitlistStatus
  notes?: string | null
  student_name?: string | null
  global_student_id?: string | null
  preferred_hostel_name?: string | null
  preferred_room_number?: string | null
  created_at: string
}

export const getWaitlist = (params?: { hostel_id?: number; status?: string }) =>
  apiClient<HostelWaitlist[]>('/hostel-waitlist', { params })

export const createWaitlistEntry = (data: {
  student_id: number
  preferred_hostel_id: number
  preferred_room_id?: number
  priority_score?: number
  notes?: string
}) => apiClient<HostelWaitlist>('/hostel-waitlist', { data })

export const updateWaitlistStatus = (id: number, data: { status: WaitlistStatus; notes?: string }) =>
  apiClient<HostelWaitlist>(`/hostel-waitlist/${id}/status`, { method: 'PATCH', data })

// Visitors
export interface HostelVisitor {
  id: number
  hostel_id: number
  student_id: number
  visitor_name: string
  relationship: string
  id_proof_type: string
  id_proof_number?: string | null
  entry_time: string
  exit_time?: string | null
  purpose: string
  gate_pass_number?: string | null
  student_name?: string | null
  global_student_id?: string | null
  hostel_name?: string | null
  created_at: string
}

export const getVisitors = (params?: { hostel_id?: number }) =>
  apiClient<HostelVisitor[]>('/hostel-visitors', { params })

export const registerVisitor = (data: {
  hostel_id: number
  student_id: number
  visitor_name: string
  relationship: string
  id_proof_type: string
  id_proof_number?: string
  entry_time?: string
  purpose: string
}) => apiClient<HostelVisitor>('/hostel-visitors', { data })

export const recordVisitorExit = (id: number, data: { exit_time?: string }) =>
  apiClient<HostelVisitor>(`/hostel-visitors/${id}/exit`, { method: 'PATCH', data })

// Allocation Letter & CSV Import
export interface AllocationLetterResponse {
  letter_id: string
  issued_date: string
  academic_term: string
  student: {
    student_id: number
    global_student_id: string
    full_name: string
    gender?: string | null
    email?: string | null
    phone?: string | null
    program?: string | null
  }
  accommodation: {
    hostel_name: string
    gender_block: string
    room_number: string
    bed_number?: string | null
    from_date: string
    to_date?: string | null
  }
  rules_and_terms: string[]
  warden_endorsement: {
    warden_title: string
    institution_name: string
    digital_signature: string
    verification_code: string
  }
}

export const getAllocationLetter = (allocation_id: number) =>
  apiClient<AllocationLetterResponse>(`/hostel-allocations/${allocation_id}/letter`)

export interface StudentDemographicsCSVImportResponse {
  total_processed: number
  updated_count: number
  skipped_count: number
  errors: string[]
  sample_records: any[]
}

export const importStudentDemographicsCSV = (csv_content: string) =>
  apiClient<StudentDemographicsCSVImportResponse>('/hostel/students/import-demographics-csv', {
    data: { csv_content }
  })

export interface RoomInventoryCSVImportResponse {
  total_processed: number
  created_count: number
  updated_count: number
  skipped_count: number
  errors: string[]
  sample_records: any[]
}

export const importRoomsCSV = (csv_content: string) =>
  apiClient<RoomInventoryCSVImportResponse>('/hostel/rooms/import-csv', {
    data: { csv_content }
  })

// Inspections
export const createInspection = (data: any) => apiClient<HostelInspection>('/hostel-inspections', { data })
export const getInspections = (params?: { room_id?: number }) => apiClient<HostelInspection[]>('/hostel-inspections', { params })

// Notices
export const getNotices = (params?: { hostel_id?: number }) => apiClient<HostelNotice[]>('/hostel-notices', { params })
export const createNotice = (data: { hostel_id?: number; title: string; content: string; priority: string }) =>
  apiClient<HostelNotice>('/hostel-notices', { data })

// Outpasses
export const createOutpass = (data: { from_datetime: string; to_datetime: string; destination: string; reason: string }) =>
  apiClient<HostelOutpass>('/hostel-outpasses', { data })

export const getMyOutpasses = () => apiClient<HostelOutpass[]>('/me/hostel-outpasses')
export const getAllOutpasses = (params?: { status?: string }) => apiClient<HostelOutpass[]>('/hostel-outpasses', { params })
export const decideOutpass = (id: number, data: { status: RequestStatus; decision_remark?: string }) =>
  apiClient<HostelOutpass>(`/hostel-outpasses/${id}/decision`, { method: 'PATCH', data })

// Signature Features
export const getIntegrityGuardianReport = () => apiClient<IntegrityGuardianReport>('/hostel-integrity/guardian')

export const getSmartAllocation = (student_id: number, preferred_hostel_id?: number) =>
  apiClient<SmartAllocationResponse>('/hostel-lab/smart-allocation', { data: { student_id, preferred_hostel_id } })

export const simulateCapacityWhatIf = (params: any) =>
  apiClient<CapacitySimulationResponse>('/hostel-simulator/capacity-what-if', { data: params })

export const analyzeChangeImpact = (data: any) =>
  apiClient<ImpactRadarResponse>('/hostel-radar/change-impact', { data })
export const getChangeImpactRadar = analyzeChangeImpact

export const getMyHostelJourney = () => apiClient<StudentJourneyResponse>('/me/hostel-journey')
export const getStudentHostelJourney = (studentId: number) => apiClient<StudentJourneyResponse>(`/hostel-journey/${studentId}`)

// --- Minimal Hostel Fee Management Types & APIs ---
export interface HostelFeeConfig {
  id: number
  hostel_id?: number
  hostel_name?: string
  fee_name: string
  amount: number
  academic_term: string
  due_days: number
  created_at: string
}

export interface HostelInvoice {
  id: number
  invoice_number: string
  student_id: number
  student_name?: string
  global_student_id?: string
  hostel_id: number
  hostel_name?: string
  fee_config_id?: number
  title: string
  amount: number
  amount_paid: number
  balance: number
  due_date: string
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PENDING_VERIFICATION' | 'PAID'
  created_at: string
}

export interface HostelPayment {
  id: number
  payment_number: string
  invoice_id: number
  invoice_number?: string
  student_id: number
  student_name?: string
  global_student_id?: string
  amount_paid: number
  payment_method: 'UPI' | 'DEMO' | 'BANK_TRANSFER'
  payment_reference: string
  upi_id: string
  proof_notes?: string
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED'
  verified_by?: number
  verification_notes?: string
  verified_at?: string
  created_at: string
}

export interface HostelFeeSummary {
  total_invoiced: number
  total_collected: number
  total_pending: number
  invoices_count: number
  pending_verification_count: number
}

export const getHostelFeeSummary = () => apiClient<HostelFeeSummary>('/hostel-fees/summary')
export const getHostelFeeConfigs = (hostel_id?: number) => apiClient<HostelFeeConfig[]>('/hostel-fees/configs', { params: hostel_id ? { hostel_id } : undefined })
export const createHostelFeeConfig = (data: Partial<HostelFeeConfig>) => apiClient<HostelFeeConfig>('/hostel-fees/configs', { data })

export const getHostelInvoices = (params?: { student_id?: number; hostel_id?: number; status_val?: string }) =>
  apiClient<HostelInvoice[]>('/hostel-fees/invoices', { params })
export const createHostelInvoice = (data: any) => apiClient<HostelInvoice>('/hostel-fees/invoices', { data })
export const generateBatchHostelInvoices = (fee_config_id?: number) =>
  apiClient<{ status: string; invoices_generated: number; skipped_existing: number; total_active_allocations: number }>('/hostel-fees/invoices/generate-batch', {
    method: 'POST',
    params: fee_config_id ? { fee_config_id } : undefined
  })

export const getAllHostelPayments = (params?: { invoice_id?: number; student_id?: number; status_val?: string }) =>
  apiClient<HostelPayment[]>('/hostel-fees/payments', { params })
export const verifyHostelPayment = (paymentId: number, data: { status: 'VERIFIED' | 'REJECTED'; verification_notes?: string }) =>
  apiClient<{ status: string; payment_id: number; verification_status: string }>(`/hostel-fees/payments/${paymentId}/verify`, { method: 'POST', data })

export const getMyHostelInvoices = () => apiClient<HostelInvoice[]>('/me/hostel-fees/invoices')
export const payMyHostelFee = (data: { invoice_id: number; amount_paid: number; payment_method: string; payment_reference: string; proof_notes?: string }) =>
  apiClient<HostelPayment>('/me/hostel-fees/pay', { data })
export const getMyHostelPayments = () => apiClient<HostelPayment[]>('/me/hostel-fees/payments')
