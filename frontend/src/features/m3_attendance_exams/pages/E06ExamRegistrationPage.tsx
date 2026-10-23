import React, { useState } from 'react'
import {
  Card, Button, StatusPill, Alert, LoadingSkeleton, EmptyState, ConfirmationDialog
} from '@/components/ui'
import {
  useExams, useCreateExamRegistration, useMyAttendance, useExamRegistrations
} from '../hooks'
import { useAuth } from '@/hooks/useAuth'
import type { Exam } from '../api'
import {
  Calendar, CheckCircle2, XCircle, AlertCircle, Award, Check, Layers, AlertTriangle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export function E06ExamRegistrationPage() {
  const { user } = useAuth()
  const [registeringExam, setRegisteringExam] = useState<Exam | null>(null)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [isBulkRegistering, setIsBulkRegistering] = useState(false)
  const [rejectionMessages, setRejectionMessages] = useState<{ [examId: number]: string }>({})
  const [successExams, setSuccessExams] = useState<{ [examId: number]: boolean }>({})

  // Queries
  const { data: attendanceData, isLoading: loadingAttendance } = useMyAttendance()
  const myAttendance = attendanceData || []

  const { data: examsData, isLoading: loadingExams } = useExams({ page_size: 100 })
  const exams = examsData?.items || []

  // Check student's existing registrations
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

  // Eligible exams for bulk registration
  const eligibleUnregisteredExams = relevantExams.filter(e => {
    const att = attendanceMap.get(e.offering_id)
    const isEligible = (att?.pct ?? 0) >= 75
    const isAlreadyRegistered = registeredExamIds.has(e.id) || !!successExams[e.id]
    const now = new Date()
    const regStart = e.reg_start_date ? new Date(e.reg_start_date) : null
    const regEnd = e.reg_end_date ? new Date(e.reg_end_date) : null
    const isWindowOpen = (!regStart || now >= regStart) && (!regEnd || now <= regEnd)
    return isEligible && !isAlreadyRegistered && isWindowOpen
  })

  // Eligibility summary
  const totalRelevantExams = relevantExams.length
  const eligibleExamsCount = relevantExams.filter(e => {
    const att = attendanceMap.get(e.offering_id)
    return (att?.pct ?? 0) >= 75
  }).length

  const handleRegisterConfirm = async () => {
    if (!registeringExam) return
    const exam = registeringExam
    setRejectionMessages(prev => ({ ...prev, [exam.id]: '' }))

    const att = attendanceMap.get(exam.offering_id)
    const attendancePct = att?.pct ?? 0

    if (attendancePct < 75) {
      setRejectionMessages(prev => ({
        ...prev,
        [exam.id]: `Not registered: attendance ${attendancePct}% < 75% required threshold.`
      }))
      setRegisteringExam(null)
      return
    }

    try {
      await createRegistrationMutation.mutateAsync({ exam_id: exam.id })
      setSuccessExams(prev => ({ ...prev, [exam.id]: true }))
      toast.success(`Successfully registered for ${att?.code || 'Exam'}`)
    } catch (err: any) {
      setRejectionMessages(prev => ({
        ...prev,
        [exam.id]: err.message || `Not registered: attendance ${attendancePct}% < 75%.`
      }))
    } finally {
      setRegisteringExam(null)
    }
  }

  const handleBulkRegisterConfirm = async () => {
    setIsBulkRegistering(true)
    let registeredCount = 0
    let failedCount = 0

    for (const exam of eligibleUnregisteredExams) {
      try {
        await createRegistrationMutation.mutateAsync({ exam_id: exam.id })
        setSuccessExams(prev => ({ ...prev, [exam.id]: true }))
        registeredCount++
      } catch (err: any) {
        failedCount++
        setRejectionMessages(prev => ({
          ...prev,
          [exam.id]: err.message || 'Registration rejected by system rule.'
        }))
      }
    }

    setIsBulkRegistering(false)
    setIsBulkDialogOpen(false)
    if (registeredCount > 0) {
      toast.success(`Registered for ${registeredCount} eligible examinations!`)
    }
    if (failedCount > 0) {
      toast.error(`${failedCount} examinations could not be registered.`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: '2px 6px', borderRadius: '4px' }}>
            E-06
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
            Exam Registration
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Review scheduled examination windows and submit your registrations without surprises.
        </p>
      </div>

      {/* Top 75% Rule & Window Alert */}
      <Alert
        variant="info"
        title="Examination Registration Policy"
        message="Examination registration requires minimum 75.00% attendance in the corresponding course offering. The database trigger automatically checks your attendance and blocks registration if below 75%."
      />

      {/* Eligibility Summary KPI & Bulk Register Action */}
      <Card variant="standard" padding={20}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Eligibility Overview
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
              <span className="tabular-nums" style={{
                fontSize: '28px',
                fontWeight: 700,
                color: eligibleExamsCount === totalRelevantExams ? 'var(--color-success)' : 'var(--color-warning)'
              }}>
                {eligibleExamsCount} of {totalRelevantExams}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                Exams Eligible for Registration
              </span>
            </div>
          </div>

          {eligibleUnregisteredExams.length > 0 && (
            <Button
              variant="primary"
              icon={<Layers size={16} />}
              onClick={() => setIsBulkDialogOpen(true)}
            >
              Register for All Eligible ({eligibleUnregisteredExams.length})
            </Button>
          )}
        </div>
      </Card>

      {/* Exam Cards Grid */}
      {loadingAttendance || loadingExams ? (
        <Card variant="standard" padding={24}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <LoadingSkeleton height={140} />
            <LoadingSkeleton height={140} />
          </div>
        </Card>
      ) : relevantExams.length === 0 ? (
        <Card variant="standard" padding={48}>
          <EmptyState
            icon={<Calendar size={40} />}
            title="No exams open for registration"
            description="There are currently no scheduled examination events for your enrolled courses."
          />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
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

            let statusLabel: string
            let statusFamily: 'success' | 'error' | 'info' | 'neutral'

            if (isAlreadyRegistered) {
              statusLabel = 'Registered'
              statusFamily = 'success'
            } else if (!isEligible) {
              statusLabel = 'Blocked'
              statusFamily = 'error'
            } else if (!isWindowOpen) {
              statusLabel = 'Closed'
              statusFamily = 'neutral'
            } else {
              statusLabel = 'Open'
              statusFamily = 'info'
            }

            return (
              <Card
                key={exam.id}
                variant="standard"
                padding={20}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  border: isAlreadyRegistered
                    ? '1px solid var(--color-success)'
                    : !isEligible
                    ? '1px solid var(--color-error)'
                    : '1px solid var(--color-border)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-primary)', fontSize: '14px' }}>
                      {att?.code || `Offering #${exam.offering_id}`}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <StatusPill
                        label={exam.exam_type}
                        status={exam.exam_type === 'FINAL' ? 'warning' : 'info'}
                      />
                      <StatusPill
                        label={statusLabel}
                        status={statusFamily}
                      />
                    </div>
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

                  {/* Attendance & Eligibility Chip Box */}
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isEligible ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                    border: `1px solid ${isEligible ? 'var(--color-success-bg)' : 'var(--color-error-bg)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Your Attendance:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="tabular-nums" style={{ fontWeight: 700, color: isEligible ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {attendancePct}%
                      </span>
                      <StatusPill
                        label={isEligible ? 'Eligible' : 'Blocked (< 75%)'}
                        status={isEligible ? 'success' : 'error'}
                      />
                    </div>
                  </div>

                  {/* Error Alert Display for Rejections */}
                  {rejectionError && (
                    <div style={{ marginTop: '12px' }}>
                      <Alert
                        variant="error"
                        title="Registration Rejected"
                        message={rejectionError}
                      />
                    </div>
                  )}
                </div>

                {/* Registration Action */}
                <div style={{ paddingTop: '14px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
                  {isAlreadyRegistered ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', fontWeight: 600, fontSize: '13px' }}>
                      <CheckCircle2 size={16} />
                      Registered
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      disabled={!isEligible || !isWindowOpen}
                      onClick={() => setRegisteringExam(exam)}
                      title={!isEligible ? 'Attendance below 75% requirement' : !isWindowOpen ? 'Registration window is closed' : 'Register for this examination'}
                    >
                      {!isEligible
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

      {/* Confirmation Dialog for Single Registration */}
      <ConfirmationDialog
        isOpen={!!registeringExam}
        title="Confirm Exam Registration"
        message={registeringExam ? `Are you sure you want to register for ${attendanceMap.get(registeringExam.offering_id)?.code || 'this course'} (${registeringExam.exam_type}) on ${new Date(registeringExam.exam_date).toLocaleDateString()}?` : ''}
        confirmLabel="Confirm Registration"
        isLoading={createRegistrationMutation.isPending}
        onConfirm={handleRegisterConfirm}
        onCancel={() => setRegisteringExam(null)}
      />

      {/* Confirmation Dialog for Bulk Registration */}
      <ConfirmationDialog
        isOpen={isBulkDialogOpen}
        title="Bulk Examination Registration"
        message={`Are you sure you want to register for all ${eligibleUnregisteredExams.length} eligible examinations at once?`}
        confirmLabel="Register All"
        isLoading={isBulkRegistering}
        onConfirm={handleBulkRegisterConfirm}
        onCancel={() => setIsBulkDialogOpen(false)}
      />
    </div>
  )
}
