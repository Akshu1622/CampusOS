import { apiClient } from '@/api/client'

// --- Interfaces ---

export interface AttendanceRecordItem {
  enrollment_id: number
  status: 'PRESENT' | 'ABSENT'
}

export interface AttendanceSessionCreate {
  offering_id: number
  session_date: string
  slot: number
  records: AttendanceRecordItem[]
}

export interface AttendanceSessionUpdate {
  records: AttendanceRecordItem[]
}

export interface AttendanceSessionRecordDetail {
  id: number
  session_id: number
  enrollment_id: number
  status: 'PRESENT' | 'ABSENT'
  student_id: number
  global_student_id: string
  first_name: string
  last_name: string
}

export interface AttendanceSession {
  id: number
  offering_id: number
  session_date: string
  slot: number
  marked_by: number
  created_at?: string
}

export interface AttendanceSessionDetail extends AttendanceSession {
  records: AttendanceSessionRecordDetail[]
}

export interface PaginatedAttendanceSessions {
  items: AttendanceSession[]
  total: number
  page: number
  page_size: number
}

export interface MyAttendanceItem {
  offering_id: number
  course_code: string
  course_title: string
  sessions_held: number
  sessions_attended: number
  attendance_pct: number
  eligible_for_exam: boolean
}

export interface AttendanceShortageItem {
  student_id: number
  global_student_id: string
  first_name: string
  last_name: string
  offering_id: number
  course_code: string
  course_title: string
  sessions_held: number
  sessions_attended: number
  attendance_pct: number
}

export interface PaginatedAttendanceShortage {
  items: AttendanceShortageItem[]
  total: number
  page: number
  page_size: number
}

export interface Exam {
  id: number
  offering_id: number
  exam_type: 'QUIZ' | 'MIDTERM' | 'FINAL' | 'ASSIGNMENT'
  exam_date: string
  max_marks: number
  reg_start_date: string
  reg_end_date: string
}

export interface PaginatedExams {
  items: Exam[]
  total: number
  page: number
  page_size: number
}

export interface ExamCreate {
  offering_id: number
  exam_type: 'QUIZ' | 'MIDTERM' | 'FINAL' | 'ASSIGNMENT'
  exam_date: string
  max_marks: number
  reg_start_date: string
  reg_end_date: string
}

export interface ExamUpdate {
  exam_type?: 'QUIZ' | 'MIDTERM' | 'FINAL' | 'ASSIGNMENT'
  exam_date?: string
  max_marks?: number
  reg_start_date?: string
  reg_end_date?: string
}

export interface ExamRegistration {
  id: number
  exam_id: number
  student_id: number
  attendance_pct_at_reg?: number
  registered_at: string
}

export interface PaginatedExamRegistrations {
  items: ExamRegistration[]
  total: number
  page: number
  page_size: number
}

export interface ExamRegistrationCreate {
  exam_id: number
}

export interface MarksResultItem {
  registration_id: number
  student_id: number
  first_name: string
  last_name: string
  marks: number | null
  grade: string | null
  grade_points: number | null
  is_published: boolean | number
}

export interface MarksBulkItem {
  registration_id: number
  marks: number
}

export interface MarksBulkEntry {
  marks: MarksBulkItem[]
}

export interface ProcessResultInput {
  exam_id: number
}

export interface MyResultCourseItem {
  course_code: string
  course_title: string
  credits: number
  exam_type: string
  marks: number
  grade: string
  grade_points: number
}

export interface MySemesterResult {
  term_id: number
  term_label?: string
  sgpa: number
  total_credits: number
  courses: MyResultCourseItem[]
}

export interface CgpaResponse {
  student_id: number
  cgpa: number
}

export interface CourseResultSummary {
  exam_id: number
  total_registered: number
  total_passed: number
  pass_percentage: number
  average_marks: number
  grade_distribution?: { [grade: string]: number }
}

export interface GradeScale {
  id: number
  grade: string
  min_marks_pct: number
  max_marks_pct: number
  grade_points: number
}

export interface PaginatedGradeScale {
  items: GradeScale[]
  total: number
  page: number
  page_size: number
}

export interface GradeScaleCreate {
  grade: string
  min_marks_pct: number
  max_marks_pct: number
  grade_points: number
}

export interface GradeScaleUpdate {
  grade?: string
  min_marks_pct?: number
  max_marks_pct?: number
  grade_points?: number
}

// --- API Methods ---

// Attendance
export const getAttendanceSessions = (params?: { page?: number; page_size?: number; offering_id?: number }) =>
  apiClient<PaginatedAttendanceSessions>('/attendance/sessions', { params })

export const getAttendanceSession = (id: number) =>
  apiClient<AttendanceSessionDetail>(`/attendance/sessions/${id}`)

export const createAttendanceSession = (data: AttendanceSessionCreate) =>
  apiClient<AttendanceSession>('/attendance/sessions', { data })

export const updateAttendanceSession = (id: number, data: AttendanceSessionUpdate) =>
  apiClient<AttendanceSession>(`/attendance/sessions/${id}`, { method: 'PUT', data })

export const getMyAttendance = () =>
  apiClient<MyAttendanceItem[]>('/me/attendance')

export const getAttendanceShortage = (params?: { page?: number; page_size?: number }) =>
  apiClient<PaginatedAttendanceShortage>('/attendance/shortage', { params })

// Exams
export const getExams = (params?: { page?: number; page_size?: number; offering_id?: number }) =>
  apiClient<PaginatedExams>('/exams', { params })

export const getExam = (id: number) =>
  apiClient<Exam>(`/exams/${id}`)

export const createExam = (data: ExamCreate) =>
  apiClient<Exam>('/exams', { data })

export const updateExam = (id: number, data: ExamUpdate) =>
  apiClient<Exam>(`/exams/${id}`, { method: 'PATCH', data })

export const deleteExam = (id: number) =>
  apiClient<void>(`/exams/${id}`, { method: 'DELETE' })

// Exam Registration
export const getExamRegistrations = (params?: { page?: number; page_size?: number; exam_id?: number; student_id?: number }) =>
  apiClient<PaginatedExamRegistrations>('/exam-registrations', { params })

export const createExamRegistration = (data: ExamRegistrationCreate) =>
  apiClient<ExamRegistration>('/exam-registrations', { data })

// Marks & Results
export const getExamMarks = (examId: number) =>
  apiClient<MarksResultItem[]>(`/exams/${examId}/marks`)

export const updateExamMarks = (examId: number, data: MarksBulkEntry) =>
  apiClient<{ status: string }>(`/exams/${examId}/marks`, { method: 'PUT', data })

export const processResults = (data: ProcessResultInput) =>
  apiClient<{ status: string }>('/results/process', { data })

export const publishResults = (data: ProcessResultInput) =>
  apiClient<{ status: string }>('/results/publish', { data })

export const getMyResults = () =>
  apiClient<MySemesterResult[]>('/me/results')

export const getMyCgpa = () =>
  apiClient<CgpaResponse>('/me/cgpa')

export const getCourseResultSummary = (examId: number) =>
  apiClient<CourseResultSummary>(`/exams/${examId}/summary`)

// Grade Scale
export const getGradeScales = (params?: { page?: number; page_size?: number }) =>
  apiClient<PaginatedGradeScale>('/grade-scale', { params })

export const getGradeScale = (id: number) =>
  apiClient<GradeScale>(`/grade-scale/${id}`)

export const createGradeScale = (data: GradeScaleCreate) =>
  apiClient<GradeScale>('/grade-scale', { data })

export const updateGradeScale = (id: number, data: GradeScaleUpdate) =>
  apiClient<GradeScale>(`/grade-scale/${id}`, { method: 'PATCH', data })

export const deleteGradeScale = (id: number) =>
  apiClient<void>(`/grade-scale/${id}`, { method: 'DELETE' })
