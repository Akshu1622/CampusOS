import { apiClient } from '@/api/client'

// --- Interfaces ---
export interface Course {
  id: number
  code: string
  title: string
  credits: number
  department_id: number
  status: 'ACTIVE' | 'RETIRED'
}

export interface PaginatedCourses {
  items: Course[]
  total: number
  page: number
  page_size: number
}

export interface CourseCreate {
  code: string
  title: string
  credits: number
  department_id: number
}

export interface CourseUpdate {
  title?: string
  credits?: number
  department_id?: number
  status?: 'ACTIVE' | 'RETIRED'
}

export interface Curriculum {
  id: number
  program_id: number
  semester: number
  course_id: number
  type: 'CORE' | 'ELECTIVE'
}

export interface PaginatedCurriculum {
  items: Curriculum[]
  total: number
  page: number
  page_size: number
}

export interface CurriculumCreate {
  program_id: number
  semester: number
  course_id: number
  type: 'CORE' | 'ELECTIVE'
}

export interface CourseOffering {
  id: number
  course_id: number
  term_id: number
  faculty_id: number
  section: string
  capacity: number
  enrolled_count: number
}

export interface PaginatedOfferings {
  items: CourseOffering[]
  total: number
  page: number
  page_size: number
}

export interface OfferingCreate {
  course_id: number
  term_id: number
  faculty_id: number
  section: string
  capacity: number
}

export interface OfferingUpdate {
  faculty_id?: number
  capacity?: number
}

export interface Enrollment {
  id: number
  student_id: number
  offering_id: number
  status: 'ENROLLED' | 'DROPPED' | 'WITHDRAWN'
  enrolled_date: string
}

export interface PaginatedEnrollments {
  items: Enrollment[]
  total: number
  page: number
  page_size: number
}

export interface EnrollmentCreate {
  student_id: number
  offering_id: number
}

export interface BulkEnrollmentItem {
  student_id: number
  offering_id: number
}

export interface BulkEnrollmentRequest {
  policy: 'ALL_OR_NOTHING' | 'SKIP_INVALID'
  dry_run: boolean
  payload: BulkEnrollmentItem[]
}

export interface BulkEnrollmentRowResult {
  student_id?: number
  offering_id?: number
  status: string
  message?: string
}

export interface BulkEnrollmentResponse {
  batch_id: string
  total_processed: number
  total_success: number
  total_failed: number
  total_skipped?: number
  message: string
  row_results?: BulkEnrollmentRowResult[]
}

export interface MyCourse {
  enrollment_id: number
  offering_id: number
  course_code: string
  course_title: string
  term_id: number
  faculty_id: number
  section: string
  credits: number
  status: string
}

export interface MyTeaching {
  offering_id: number
  course_code: string
  course_title: string
  term_id: number
  section: string
  capacity: number
  enrolled_count: number
}

export interface RosterStudent {
  student_id: number
  global_student_id: string
  first_name: string
  last_name: string
  enrollment_status: string
  enrolled_date: string
}

// Master data interfaces
export interface Department {
  id: number
  code: string
  name: string
}

export interface Program {
  id: number
  code: string
  name: string
  department_id: number
  duration_years: number
  credits_required: number
}

export interface AcademicTerm {
  id: number
  term_identifier: string
  term_year: number
  term_label: string
  is_current: number | boolean
}

export interface Student {
  id: number
  global_student_id: string
  first_name: string
  last_name: string
  email: string
  program_id: number
  status: string
}

export interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
}

// --- API Methods ---

// Courses
export const getCourses = (params?: { page?: number; page_size?: number; department_id?: number }) =>
  apiClient<PaginatedCourses>('/courses', { params })

export const getCourse = (id: number) =>
  apiClient<Course>(`/courses/${id}`)

export const createCourse = (data: CourseCreate) =>
  apiClient<Course>('/courses', { data })

export const updateCourse = (id: number, data: CourseUpdate) =>
  apiClient<Course>(`/courses/${id}`, { method: 'PUT', data })

export const deleteCourse = (id: number) =>
  apiClient<void>(`/courses/${id}`, { method: 'DELETE' })

// Curriculum
export const getCurriculum = (params?: { page?: number; page_size?: number; program_id?: number; semester?: number }) =>
  apiClient<PaginatedCurriculum>('/curriculum', { params })

export const getCurriculumById = (id: number) =>
  apiClient<Curriculum>(`/curriculum/${id}`)

export const createCurriculum = (data: CurriculumCreate) =>
  apiClient<Curriculum>('/curriculum', { data })

export const updateCurriculum = (id: number, type: 'CORE' | 'ELECTIVE') =>
  apiClient<Curriculum>(`/curriculum/${id}`, { method: 'PATCH', data: { type } })

export const deleteCurriculum = (id: number) =>
  apiClient<void>(`/curriculum/${id}`, { method: 'DELETE' })

// Offerings
export const getOfferings = (params?: { page?: number; page_size?: number; term_id?: number; course_id?: number }) =>
  apiClient<PaginatedOfferings>('/offerings', { params })

export const getOffering = (id: number) =>
  apiClient<CourseOffering>(`/offerings/${id}`)

export const createOffering = (data: OfferingCreate) =>
  apiClient<CourseOffering>('/offerings', { data })

export const updateOffering = (id: number, data: OfferingUpdate) =>
  apiClient<CourseOffering>(`/offerings/${id}`, { method: 'PUT', data })

export const deleteOffering = (id: number) =>
  apiClient<void>(`/offerings/${id}`, { method: 'DELETE' })

export const getOfferingRoster = (id: number) =>
  apiClient<RosterStudent[]>(`/offerings/${id}/roster`)

// Enrollments
export const getEnrollments = (params?: { page?: number; page_size?: number; student_id?: number; offering_id?: number }) =>
  apiClient<PaginatedEnrollments>('/enrollments', { params })

export const getEnrollment = (id: number) =>
  apiClient<Enrollment>(`/enrollments/${id}`)

export const createEnrollment = (data: EnrollmentCreate) =>
  apiClient<Enrollment>('/enrollments', { data })

export const withdrawEnrollment = (id: number) =>
  apiClient<Enrollment>(`/enrollments/${id}/withdraw`, { method: 'PATCH' })

export const bulkEnrollmentValidate = (data: BulkEnrollmentRequest) =>
  apiClient<BulkEnrollmentResponse>('/enrollments/bulk/validate', { data })

export const bulkEnrollmentRun = (data: BulkEnrollmentRequest) =>
  apiClient<BulkEnrollmentResponse>('/enrollments/bulk', { data })

// Self-Service
export const getMyCourses = () =>
  apiClient<MyCourse[]>('/me/courses')

export const getMyTeaching = () =>
  apiClient<MyTeaching[]>('/faculty/me/offerings')

// Master Lookups
export const getDepartments = () =>
  apiClient<any>('/departments').then((res: any) => (Array.isArray(res) ? res : res?.items || []))

export const getPrograms = () =>
  apiClient<any>('/programs').then((res: any) => (Array.isArray(res) ? res : res?.items || []))

export const getTerms = () =>
  apiClient<AcademicTerm[]>('/terms')

export const getStudents = (params?: { page?: number; page_size?: number }) =>
  apiClient<{ items: Student[]; total: number }>('/students', { params })

export const getEmployees = (params?: { page?: number; page_size?: number }) =>
  apiClient<{ items: Employee[]; total: number }>('/employees', { params })
