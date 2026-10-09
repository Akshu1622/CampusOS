import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import { toast } from 'react-hot-toast'

// Query Keys
export const academicKeys = {
  all: ['academics'] as const,
  courses: () => [...academicKeys.all, 'courses'] as const,
  courseList: (params?: any) => [...academicKeys.courses(), params] as const,
  courseDetail: (id: number) => [...academicKeys.courses(), id] as const,
  curriculum: () => [...academicKeys.all, 'curriculum'] as const,
  curriculumList: (params?: any) => [...academicKeys.curriculum(), params] as const,
  offerings: () => [...academicKeys.all, 'offerings'] as const,
  offeringList: (params?: any) => [...academicKeys.offerings(), params] as const,
  offeringDetail: (id: number) => [...academicKeys.offerings(), id] as const,
  roster: (id: number) => [...academicKeys.offeringDetail(id), 'roster'] as const,
  enrollments: () => [...academicKeys.all, 'enrollments'] as const,
  enrollmentList: (params?: any) => [...academicKeys.enrollments(), params] as const,
  myCourses: () => [...academicKeys.all, 'my-courses'] as const,
  myTeaching: () => [...academicKeys.all, 'my-teaching'] as const,
  lookups: {
    departments: ['departments'] as const,
    programs: ['programs'] as const,
    terms: ['terms'] as const,
    students: ['students'] as const,
    employees: ['employees'] as const,
  }
}

// --- Courses ---
export const useCourses = (params?: { page?: number; page_size?: number; department_id?: number }) => {
  return useQuery({
    queryKey: academicKeys.courseList(params),
    queryFn: () => api.getCourses(params)
  })
}

export const useCourse = (id: number) => {
  return useQuery({
    queryKey: academicKeys.courseDetail(id),
    queryFn: () => api.getCourse(id),
    enabled: !!id
  })
}

export const useCreateCourse = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.courses() })
      toast.success('Course created successfully')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create course')
    }
  })
}

export const useUpdateCourse = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: api.CourseUpdate }) => api.updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.courses() })
      toast.success('Course updated successfully')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update course')
    }
  })
}

export const useDeleteCourse = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.courses() })
      toast.success('Course deleted successfully')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete course')
    }
  })
}

// --- Curriculum ---
export const useCurriculum = (params?: { page?: number; page_size?: number; program_id?: number; semester?: number }) => {
  return useQuery({
    queryKey: academicKeys.curriculumList(params),
    queryFn: () => api.getCurriculum(params)
  })
}

export const useCreateCurriculum = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createCurriculum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.curriculum() })
      toast.success('Curriculum mapping created')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create curriculum mapping')
    }
  })
}

export const useUpdateCurriculum = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, type }: { id: number; type: 'CORE' | 'ELECTIVE' }) => api.updateCurriculum(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.curriculum() })
      toast.success('Curriculum mapping updated')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update curriculum mapping')
    }
  })
}

export const useDeleteCurriculum = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteCurriculum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.curriculum() })
      toast.success('Curriculum mapping removed')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to remove curriculum mapping')
    }
  })
}

// --- Course Offerings ---
export const useOfferings = (params?: { page?: number; page_size?: number; term_id?: number; course_id?: number }) => {
  return useQuery({
    queryKey: academicKeys.offeringList(params),
    queryFn: () => api.getOfferings(params)
  })
}

export const useOffering = (id: number) => {
  return useQuery({
    queryKey: academicKeys.offeringDetail(id),
    queryFn: () => api.getOffering(id),
    enabled: !!id
  })
}

export const useCreateOffering = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createOffering,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.offerings() })
      toast.success('Offering created successfully')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create course offering')
    }
  })
}

export const useUpdateOffering = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: api.OfferingUpdate }) => api.updateOffering(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.offerings() })
      toast.success('Offering updated successfully')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update offering')
    }
  })
}

export const useDeleteOffering = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteOffering,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.offerings() })
      toast.success('Offering deleted')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete offering')
    }
  })
}

export const useOfferingRoster = (id: number) => {
  return useQuery({
    queryKey: academicKeys.roster(id),
    queryFn: () => api.getOfferingRoster(id),
    enabled: !!id
  })
}

// --- Enrollments ---
export const useEnrollments = (params?: { page?: number; page_size?: number; student_id?: number; offering_id?: number }) => {
  return useQuery({
    queryKey: academicKeys.enrollmentList(params),
    queryFn: () => api.getEnrollments(params)
  })
}

export const useCreateEnrollment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.enrollments() })
      queryClient.invalidateQueries({ queryKey: academicKeys.offerings() })
      toast.success('Student enrolled successfully')
    }
  })
}

export const useWithdrawEnrollment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.withdrawEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.enrollments() })
      queryClient.invalidateQueries({ queryKey: academicKeys.offerings() })
      toast.success('Enrollment withdrawn successfully')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to withdraw enrollment')
    }
  })
}

export const useBulkEnrollmentValidate = () => {
  return useMutation({
    mutationFn: api.bulkEnrollmentValidate
  })
}

export const useBulkEnrollmentRun = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.bulkEnrollmentRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.enrollments() })
      queryClient.invalidateQueries({ queryKey: academicKeys.offerings() })
      toast.success('Bulk enrollment completed')
    }
  })
}

// --- Role Views ---
export const useMyCourses = () => {
  return useQuery({
    queryKey: academicKeys.myCourses(),
    queryFn: api.getMyCourses
  })
}

export const useMyTeaching = () => {
  return useQuery({
    queryKey: academicKeys.myTeaching(),
    queryFn: api.getMyTeaching
  })
}

// --- Master Data Lookups ---
export const useDepartments = () => {
  return useQuery({
    queryKey: academicKeys.lookups.departments,
    queryFn: api.getDepartments
  })
}

export const usePrograms = () => {
  return useQuery({
    queryKey: academicKeys.lookups.programs,
    queryFn: api.getPrograms
  })
}

export const useTerms = () => {
  return useQuery({
    queryKey: academicKeys.lookups.terms,
    queryFn: api.getTerms
  })
}

export const useStudents = (params?: { page?: number; page_size?: number }) => {
  return useQuery({
    queryKey: [...academicKeys.lookups.students, params],
    queryFn: () => api.getStudents(params)
  })
}

export const useEmployees = (params?: { page?: number; page_size?: number }) => {
  return useQuery({
    queryKey: [...academicKeys.lookups.employees, params],
    queryFn: () => api.getEmployees(params)
  })
}
