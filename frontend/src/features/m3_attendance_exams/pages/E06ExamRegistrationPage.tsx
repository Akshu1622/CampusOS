import React, { useState } from 'react'
import {
  Card, Button, StatusPill, Alert, LoadingSkeleton, EmptyState
} from '@/components/ui'
import {
  useExams, useCreateExamRegistration, useMyAttendance, useExamRegistrations
} from '../hooks'
import { useAuth } from '@/hooks/useAuth'
import type { Exam } from '../api'
import {
  Calendar, CheckCircle2, XCircle, AlertCircle, Award, Check
} from 'lucide-react'

export function E06ExamRegistrationPage() {
  const { user } = useAuth()
  const [registeringExamId, setRegisteringExamId] = useState<number | null>(null)
  const [rejectionMessages, setRejectionMessages] = useState<{ [examId: number]: string }>({})
  const [successExams, setSuccessExams] = useState<{ [examId: number]: boolean }>({})

  // Queries
  const { data: attendanceData, isLoading: loadingAttendance } = useMyAttendance()
  const myAttendance = attendanceData || []

  const { data: examsData, isLoading: loadingExams } = useExams({ page_size: 100 })
  const exams = examsData?.items || []

  // Check student's existing registrations if user has linked student_id
  const studentId = (user as any)?.student_id ?? user?.person_id
  const { data: existingRegData } = useExamRegistrations({
    student_id: studentId || undefined,
    page_size: 100
  })
  const existingRegistrations = existingRegData?.items || []
  const registeredExamIds = new Set(existingRegistrations.map((r: any) => r.exam_id))

  const createRegistrationMutation = useCreateExamRegistration()

  // Attendance lookup by offering_id
  const attendanceMap = React.useMemo(() => {
    const m = new Map<number, { pct: number; eligible: boolean; code: string; title: string }>()
    myAttendance.forEach(a => m.set(a.offering_id, {
      pct: a.attendance_pct,
      eligible: a.eligible_for_exam,
      code: a.course_code,
      title: a.course_title,
    }))
    return m
  }, [myAttendance])

  // Filter exams that belong to the student's enrolled courses
  const enrolledOfferingIds = new Set(myAttendance.map(a => a.offering_id))
  const relevantExams = exams.filter(e => enrolledOfferingIds.has(e.offering_id))

  // Eligibility summary
  const totalRelevantExams = relevantExams.length
  const eligibleExamsCount = relevantExams.filter(e => {
    const att = attendanceMap.get(e.offering_id)
    return (att?.pct ?? 0) >= 75
  }).length

  const handleRegister = async (exam: Exam) => {
    setRegisteringExamId(exam.id)
    setRejectionMessages(prev => ({ ...prev, [exam.id]: '' }))

    try {
      await createRegistrationMutation.mutateAsync({ exam_id: exam.id })
      setSuccessExams(prev => ({ ...prev, [exam.id]: true }))
    } catch (err: any) {
      setRejectionMessages(prev => ({
        ...prev,
        [exam.id]: err.message || 'Registration rejected by system rule.'
      }))
    } finally {
      setRegisteringExamId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            E-06
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Examination Registration
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Register for scheduled semester examinations for your enrolled courses.
        </p>
      </div>

      {/* 75% Attendance Window & Rule Banner */}
      <Alert
        variant="info"
        title="Attendance & Eligibility Rules"
        message="A strict 75.00% attendance threshold is required for all courses to register for examinations. The database trigger automatically verifies your attendance percentage and will reject registrations below 75%."
      />

      {/* Eligibility KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <Card padding={16}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Eligible Courses</div>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: eligibleExamsCount === totalRelevantExams ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {eligibleExamsCount} of {totalRelevantExams} Exams Eligible
          </div>
        </Card>
      </div>

      {/* Exam Cards Grid */}
      {loadingAttendance || loadingExams ? (
        <Card padding={24}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <LoadingSkeleton height={120} />
            <LoadingSkeleton height={120} />
          </div>
        </Card>
      ) : relevantExams.length === 0 ? (
        <Card padding={32}>
          <EmptyState
            icon={<Calendar size={40} />}
            title="No exams open for registration"
            description="There are currently no scheduled examination events for your enrolled courses."
          />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {relevantExams.map(exam => {
            const att = attendanceMap.get(exam.offering_id)
            const attendancePct = att?.pct ?? 0
            const isEligible = attendancePct >= 75
            const isAlreadyRegistered = registeredExamIds.has(exam.id) || !!successExams[exam.id]
            const rejectionError = rejectionMessages[exam.id]

            const now = new Date()
            const regStart = exam.reg_start_date ? new Date(exam.reg_start_date) : null
            const regEnd = exam.reg_end_date ? new Date(exam.reg_end_date) : null
            const isWindowOpen = (!regStart || now >= regStart) && (!regEnd || now <= regEnd)

            return (
              <Card
                key={exam.id}
                padding={20}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  border: isAlreadyRegistered
                    ? '1px solid rgba(34, 197, 94, 0.4)'
                    : !isEligible
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : '1px solid var(--color-border)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)', fontSize: '15px' }}>
                      {att?.code || `Offering #${exam.offering_id}`}
                    </span>
                    <StatusPill
                      label={exam.exam_type}
                      status={exam.exam_type === 'FINAL' ? 'warning' : 'info'}
                    />
                  </div>

                  <h3 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: 600 }}>
                    {att?.title || 'Course Examination'}
                  </h3>

                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>Exam Date: <strong>{new Date(exam.exam_date).toLocaleDateString()}</strong></div>
                    <div>Maximum Marks: <strong>{exam.max_marks} pts</strong></div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Window: {new Date(exam.reg_start_date).toLocaleDateString()} – {new Date(exam.reg_end_date).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Attendance & Eligibility Status */}
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: isEligible ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '13px' }}>Your Attendance:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: isEligible ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {attendancePct}%
                      </span>
                      <StatusPill
                        label={isEligible ? 'Eligible' : 'Blocked (< 75%)'}
                        status={isEligible ? 'success' : 'error'}
                      />
                    </div>
                  </div>

                  {/* Database Trigger Rejection Error Display */}
                  {rejectionError && (
                    <div style={{ marginTop: '12px' }}>
                      <Alert
                        variant="error"
                        title="Registration Blocked"
                        message={rejectionError}
                      />
                    </div>
                  )}
                </div>

                {/* Registration Action */}
                <div style={{ paddingTop: '12px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
                  {isAlreadyRegistered ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', fontWeight: 600, fontSize: '14px' }}>
                      <CheckCircle2 size={18} />
                      Registered
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      disabled={!isEligible || !isWindowOpen || registeringExamId === exam.id}
                      onClick={() => handleRegister(exam)}
                    >
                      {registeringExamId === exam.id
                        ? 'Registering...'
                        : !isEligible
                        ? 'Blocked (Attendance < 75%)'
                        : !isWindowOpen
                        ? 'Window Closed'
                        : 'Register for Exam'}
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
