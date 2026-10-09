import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import { toast } from 'react-hot-toast'

export const m3Keys = {
  all: ['m3'] as const,
  attendanceSessions: () => [...m3Keys.all, 'attendance-sessions'] as const,
  attendanceSessionList: (params?: any) => [...m3Keys.attendanceSessions(), params] as const,
  attendanceSessionDetail: (id: number) => [...m3Keys.attendanceSessions(), id] as const,
  myAttendance: () => [...m3Keys.all, 'my-attendance'] as const,
  attendanceShortage: (params?: any) => [...m3Keys.all, 'attendance-shortage', params] as const,
  exams: () => [...m3Keys.all, 'exams'] as const,
  examList: (params?: any) => [...m3Keys.exams(), params] as const,
  examDetail: (id: number) => [...m3Keys.exams(), id] as const,
  examRegistrations: (params?: any) => [...m3Keys.all, 'exam-registrations', params] as const,
  examMarks: (examId: number) => [...m3Keys.all, 'exam-marks', examId] as const,
  myResults: () => [...m3Keys.all, 'my-results'] as const,
  myCgpa: () => [...m3Keys.all, 'my-cgpa'] as const,
  examSummary: (examId: number) => [...m3Keys.all, 'exam-summary', examId] as const,
  gradeScales: () => [...m3Keys.all, 'grade-scales'] as const,
}

// Attendance Hooks
export const useAttendanceSessions = (params?: { page?: number; page_size?: number; offering_id?: number }) => {
  return useQuery({
    queryKey: m3Keys.attendanceSessionList(params),
    queryFn: () => api.getAttendanceSessions(params),
  })
}

export const useAttendanceSession = (id: number) => {
  return useQuery({
    queryKey: m3Keys.attendanceSessionDetail(id),
    queryFn: () => api.getAttendanceSession(id),
    enabled: !!id,
  })
}

export const useCreateAttendanceSession = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createAttendanceSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: m3Keys.attendanceSessions() })
      toast.success('Attendance session recorded successfully')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record attendance session')
    }
  })
}

export const useUpdateAttendanceSession = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: api.AttendanceSessionUpdate }) =>
      api.updateAttendanceSession(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: m3Keys.attendanceSessions() })
      toast.success('Attendance session updated')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update attendance session')
    }
  })
}

export const useMyAttendance = () => {
  return useQuery({
    queryKey: m3Keys.myAttendance(),
    queryFn: api.getMyAttendance,
  })
}

export const useAttendanceShortage = (params?: { page?: number; page_size?: number }) => {
  return useQuery({
    queryKey: m3Keys.attendanceShortage(params),
    queryFn: () => api.getAttendanceShortage(params),
  })
}

// Exam Hooks
export const useExams = (params?: { page?: number; page_size?: number; offering_id?: number }) => {
  return useQuery({
    queryKey: m3Keys.examList(params),
    queryFn: () => api.getExams(params),
  })
}

export const useExam = (id: number) => {
  return useQuery({
    queryKey: m3Keys.examDetail(id),
    queryFn: () => api.getExam(id),
    enabled: !!id,
  })
}

export const useCreateExam = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createExam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: m3Keys.exams() })
      toast.success('Exam event scheduled')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create exam')
    }
  })
}

export const useUpdateExam = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: api.ExamUpdate }) =>
      api.updateExam(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: m3Keys.exams() })
      toast.success('Exam updated')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update exam')
    }
  })
}

export const useDeleteExam = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteExam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: m3Keys.exams() })
      toast.success('Exam deleted')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete exam')
    }
  })
}

// Exam Registration Hooks
export const useExamRegistrations = (params?: { page?: number; page_size?: number; exam_id?: number; student_id?: number }) => {
  return useQuery({
    queryKey: m3Keys.examRegistrations(params),
    queryFn: () => api.getExamRegistrations(params),
  })
}

export const useCreateExamRegistration = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createExamRegistration,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: m3Keys.examRegistrations() })
      qc.invalidateQueries({ queryKey: m3Keys.exams() })
      toast.success('Successfully registered for exam')
    },
    onError: (err: any) => {
      // toast shown if wanted, or page handles inline
      toast.error(err.message || 'Exam registration rejected')
    }
  })
}

// Marks & Results Hooks
export const useExamMarks = (examId: number) => {
  return useQuery({
    queryKey: m3Keys.examMarks(examId),
    queryFn: () => api.getExamMarks(examId),
    enabled: !!examId,
  })
}

export const useUpdateExamMarks = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ examId, data }: { examId: number; data: api.MarksBulkEntry }) =>
      api.updateExamMarks(examId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: m3Keys.examMarks(vars.examId) })
      toast.success('Marks saved successfully')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save marks')
    }
  })
}

export const useProcessResults = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.processResults,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: m3Keys.examMarks(vars.exam_id) })
      toast.success('Results processed and grades computed')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to process results')
    }
  })
}

export const usePublishResults = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.publishResults,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: m3Keys.examMarks(vars.exam_id) })
      qc.invalidateQueries({ queryKey: m3Keys.exams() })
      toast.success('Results published successfully')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to publish results')
    }
  })
}

export const useMyResults = () => {
  return useQuery({
    queryKey: m3Keys.myResults(),
    queryFn: api.getMyResults,
  })
}

export const useMyCgpa = () => {
  return useQuery({
    queryKey: m3Keys.myCgpa(),
    queryFn: api.getMyCgpa,
  })
}

export const useCourseResultSummary = (examId: number) => {
  return useQuery({
    queryKey: m3Keys.examSummary(examId),
    queryFn: () => api.getCourseResultSummary(examId),
    enabled: !!examId,
  })
}

// Grade Scale Hooks
export const useGradeScales = (params?: { page?: number; page_size?: number }) => {
  return useQuery({
    queryKey: m3Keys.gradeScales(),
    queryFn: () => api.getGradeScales(params),
  })
}

export const useCreateGradeScale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createGradeScale,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: m3Keys.gradeScales() })
      toast.success('Grade scale rule created')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create grade scale rule')
    }
  })
}

export const useUpdateGradeScale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: api.GradeScaleUpdate }) =>
      api.updateGradeScale(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: m3Keys.gradeScales() })
      toast.success('Grade scale rule updated')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update grade scale rule')
    }
  })
}

export const useDeleteGradeScale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteGradeScale,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: m3Keys.gradeScales() })
      toast.success('Grade scale rule deleted')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete grade scale rule')
    }
  })
}
