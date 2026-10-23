import React, { useState } from 'react'
import {
  Card, Button, Input, Table, StatusPill, EmptyState,
  LoadingSkeleton, ConfirmationDialog, Select
} from '@/components/ui'
import {
  useEnrollments, useWithdrawEnrollment, useStudents,
  useOfferings, useCourses
} from '../hooks'
import type { Enrollment } from '../api'
import { Search, Download, UserMinus, AlertCircle, Users } from 'lucide-react'

export function A06EnrollmentRecordsPage() {
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('')
  const [page, setPage] = useState(1)

  // Withdraw confirmation state
  const [withdrawTarget, setWithdrawTarget] = useState<Enrollment | null>(null)

  const { data: studentsData } = useStudents({ page_size: 200 })
  const students = studentsData?.items || []

  const { data: offeringsData } = useOfferings({ page_size: 200 })
  const offerings = offeringsData?.items || []

  const { data: coursesData } = useCourses({ page_size: 200 })
  const courses = coursesData?.items || []

  const { data: enrollmentsData, isLoading, error } = useEnrollments({
    page,
    page_size: 100,
    offering_id: selectedOfferingId ? Number(selectedOfferingId) : undefined,
  })

  const enrollments = enrollmentsData?.items || []

  const withdrawMutation = useWithdrawEnrollment()

  const studentMap = React.useMemo(() => {
    const m = new Map<number, { globalId: string; name: string; email: string }>()
    students.forEach(s => m.set(s.id, {
      globalId: s.global_student_id,
      name: `${s.first_name} ${s.last_name}`,
      email: s.email
    }))
    return m
  }, [students])

  const courseMap = React.useMemo(() => {
    const m = new Map<number, { code: string; title: string }>()
    courses
      .filter(c => !c.code.startsWith('CS0') && !c.title.toLowerCase().startsWith('course '))
      .forEach(c => m.set(c.id, { code: c.code, title: c.title }))
    return m
  }, [courses])

  const offeringMap = React.useMemo(() => {
    const m = new Map<number, { courseId: number; section: string }>()
    offerings.forEach(o => m.set(o.id, { courseId: o.course_id, section: o.section }))
    return m
  }, [offerings])

  const filteredEnrollments = enrollments.filter(e => {
    const stu = studentMap.get(e.student_id)
    const off = offeringMap.get(e.offering_id)
    const crs = off ? courseMap.get(off.courseId) : null

    const matchSearch =
      (stu?.globalId.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (stu?.name.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (crs?.code.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (crs?.title.toLowerCase().includes(search.toLowerCase()) ?? false)

    const matchStatus = selectedStatus ? e.status === selectedStatus : true

    return matchSearch && matchStatus
  })

  const handleWithdrawConfirm = async () => {
    if (!withdrawTarget) return
    try {
      await withdrawMutation.mutateAsync(withdrawTarget.id)
      setWithdrawTarget(null)
    } catch (err) {
      // toast shown in mutation
    }
  }

  const handleExportCSV = () => {
    const headers = ['Enrollment_ID', 'Student_ID', 'Student_Name', 'Course_Code', 'Section', 'Status', 'Enrolled_Date']
    const rows = filteredEnrollments.map(e => {
      const stu = studentMap.get(e.student_id)
      const off = offeringMap.get(e.offering_id)
      const crs = off ? courseMap.get(off.courseId) : null
      return [
        e.id,
        stu?.globalId || e.student_id,
        stu?.name || 'Unknown',
        crs?.code || 'Unknown',
        off?.section || 'N/A',
        e.status,
        e.enrolled_date ? new Date(e.enrolled_date).toISOString().split('T')[0] : 'N/A'
      ].join(',')
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'enrollment_records.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (row: Enrollment) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>#{row.id}</span>
      )
    },
    {
      key: 'student',
      header: 'Student',
      render: (row: Enrollment) => {
        const stu = studentMap.get(row.student_id)
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600 }}>{stu?.name || `Student #${row.student_id}`}</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
              {stu?.globalId || ''}
            </span>
          </div>
        )
      }
    },
    {
      key: 'course',
      header: 'Course & Section',
      render: (row: Enrollment) => {
        const off = offeringMap.get(row.offering_id)
        const crs = off ? courseMap.get(off.courseId) : null
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
              {crs?.code} (Sec {off?.section})
            </span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {crs?.title}
            </span>
          </div>
        )
      }
    },
    {
      key: 'enrolled_date',
      header: 'Enrolled Date',
      render: (row: Enrollment) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {row.enrolled_date ? new Date(row.enrolled_date).toLocaleDateString() : 'N/A'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Enrollment) => {
        const variant =
          row.status === 'ENROLLED' ? 'success' :
          row.status === 'WITHDRAWN' ? 'warning' : 'neutral'
        return <StatusPill label={row.status} status={variant} />
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Enrollment) => (
        <div>
          {row.status === 'ENROLLED' && (
            <Button
              variant="subtle"
              size="sm"
              icon={<UserMinus size={14} />}
              onClick={() => setWithdrawTarget(row)}
              title="Withdraw Student"
            >
              Withdraw
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              A-06
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Enrollment Records
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Search student course enrollments, track withdrawal histories, and export roster records.
          </p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />} onClick={handleExportCSV}>
          Export CSV
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
            <Input
              placeholder="Search student ID, name, or course code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <div style={{ width: '220px' }}>
            <Select
              value={selectedOfferingId}
              onChange={(e) => setSelectedOfferingId(e.target.value)}
              options={[
                { value: '', label: 'All Course Offerings' },
                ...offerings.filter(o => courseMap.has(o.course_id)).map(o => {
                  const c = courseMap.get(o.course_id)
                  return {
                    value: String(o.id),
                    label: `${c?.code || `ID #${o.course_id}`} - Sec ${o.section}`
                  }
                })
              ]}
            />
          </div>
          <div style={{ width: '160px' }}>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'ENROLLED', label: 'Enrolled' },
                { value: 'WITHDRAWN', label: 'Withdrawn' },
                { value: 'DROPPED', label: 'Dropped' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card padding={0}>
        {isLoading ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <LoadingSkeleton height={40} />
            <LoadingSkeleton height={40} />
            <LoadingSkeleton height={40} />
          </div>
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-error)' }}>
            <AlertCircle size={32} style={{ marginBottom: '8px' }} />
            <div>Failed to load enrollment records.</div>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <EmptyState
            icon={<Users size={36} />}
            title="No enrollment records found"
            description={search || selectedOfferingId || selectedStatus ? "No records match the active search or filters." : "No student enrollments exist yet."}
          />
        ) : (
          <Table
            columns={columns}
            data={filteredEnrollments}
          />
        )}
      </Card>

      {/* Withdraw Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!withdrawTarget}
        title="Withdraw Enrollment"
        message="Are you sure you want to withdraw this student from the course offering? Their status will be marked as WITHDRAWN."
        confirmLabel="Withdraw Student"
        isDanger={true}
        isLoading={withdrawMutation.isPending}
        onConfirm={handleWithdrawConfirm}
        onCancel={() => setWithdrawTarget(null)}
      />
    </div>
  )
}
