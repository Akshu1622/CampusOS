import { apiClient } from '@/api/client'

export interface PaginatedResponse<T> {
  data: T[]
  items?: T[]
  total: number
  page: number
  size: number
}

// Dashboards
export interface AdminDashboardResponse {
  total_students: number
  total_faculty: number
  active_enrollments: number
  fees_collected_current: number
  fees_due_current: number
  beds_available: number
  pending_leaves: number
  pending_hostel_requests: number
  students_low_attendance: number
  blocked_exams_today?: number
  overdue_fees_today?: number
  fee_collection_donut?: {
    paid?: number
    partial?: number
    due?: number
    overdue?: number
    [key: string]: any
  }
  collection_trend?: Array<{
    month: string
    current_term?: number
    previous_term?: number
    [key: string]: any
  }>
  enrollment_by_department?: Array<{
    department: string
    count?: number
    [key: string]: any
  }>
}

export interface FacultyDashboardResponse {
  assigned_offerings: number
  pending_marks_entry: number
  total_leave_balance: number
  latest_payslip_net?: number
  sessions_to_mark?: number
  today_sessions?: any[]
  attendance_by_offering?: any[]
  result_snapshot?: any[]
  students_below_75?: any[]
}

export interface StudentDashboardResponse {
  total_enrolled_courses: number
  low_attendance_courses: number
  current_cgpa?: number
  total_outstanding_dues: number
  hostel_status?: string
  pending_exams: number
  exam_registrations?: any[]
  today_schedule?: any[]
  classes_today?: any[]
  cgpa_trend?: any[]
  upcoming_deadlines?: any[]
}

// Audit Logs
export interface AuditLogResponse {
  source: string
  log_id: number
  id?: number
  entity_name: string
  entity_id: string
  action: string
  before_state?: string
  after_state?: string
  actor?: string
  timestamp: string
  diff?: any
}

// Integrity Checks
export interface IntegrityCheckResponse {
  module: string
  check_name: string
  description?: string
  status: 'PASS' | 'WARN' | 'FAIL'
  affected_count: number
  sample_keys?: string
}

export const analyticsApi = {
  getAdminDashboard: () => apiClient<AdminDashboardResponse>('/analytics/dashboard/admin'),
  
  getFacultyDashboard: () => apiClient<FacultyDashboardResponse>('/analytics/dashboard/faculty'),
  
  getStudentDashboard: () => apiClient<StudentDashboardResponse>('/analytics/dashboard/student'),
  
  getAuditLogs: (params: Record<string, any>) => 
    apiClient<PaginatedResponse<AuditLogResponse>>('/analytics/audit-logs', { params }),
    
  getIntegrityChecks: () => 
    apiClient<IntegrityCheckResponse[]>('/analytics/integrity/checks'),
    
  getReportData: (reportKey: string, params: Record<string, any>) => 
    apiClient<PaginatedResponse<any>>(`/analytics/reports/${reportKey}`, { params }),
    
  downloadReportCsv: async (reportKey: string, params: Record<string, any>) => {
    const blob = await apiClient<Blob>(`/analytics/reports/${reportKey}`, {
      params: { ...params, export_csv: true }
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${reportKey}_export.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
}
