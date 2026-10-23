import React, { useState } from 'react'
import {
  Card, Button, Select, Alert, LoadingSkeleton
} from '@/components/ui'
import {
  useCreateEnrollment, useStudents, useOfferings, useCourses, useTerms
} from '../hooks'
import { CheckCircle2, XCircle, AlertCircle, UserCheck, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function A04IndividualEnrollmentPage() {
  const navigate = useNavigate()
  const [studentId, setStudentId] = useState<number | ''>('')
  const [offeringId, setOfferingId] = useState<number | ''>('')
  const [backendError, setBackendError] = useState<string | null>(null)
  const [successResult, setSuccessResult] = useState<any | null>(null)

  const { data: studentsData, isLoading: loadingStudents } = useStudents({ page_size: 200 })
  const students = studentsData?.items || []

  const { data: offeringsData, isLoading: loadingOfferings } = useOfferings({ page_size: 200 })
  const offerings = offeringsData?.items || []

  const { data: coursesData } = useCourses({ page_size: 200 })
  const courses = coursesData?.items || []

  const { data: termsData } = useTerms()
  const terms = termsData || []

  const courseMap = React.useMemo(() => {
    const m = new Map<number, { code: string; title: string }>()
    courses
      .filter(c => !c.code.startsWith('CS0') && !c.title.toLowerCase().startsWith('course '))
      .forEach(c => m.set(c.id, { code: c.code, title: c.title }))
    return m
  }, [courses])

  const termMap = React.useMemo(() => {
    const m = new Map<number, { label: string; isCurrent: boolean }>()
    terms.forEach(t => m.set(t.id, {
      label: t.term_label || t.term_identifier,
      isCurrent: t.is_current === 1 || t.is_current === true
    }))
    return m
  }, [terms])

  const selectedStudent = students.find(s => s.id === Number(studentId))
  const selectedOffering = offerings.find(o => o.id === Number(offeringId))
  const selectedCourse = selectedOffering ? courseMap.get(selectedOffering.course_id) : null
  const selectedTerm = selectedOffering ? termMap.get(selectedOffering.term_id) : null

  // Live checks
  const isStudentSelected = !!selectedStudent
  const isOfferingSelected = !!selectedOffering
  const hasSeatsAvailable = selectedOffering ? selectedOffering.enrolled_count < selectedOffering.capacity : false
  const isTermActive = selectedTerm ? selectedTerm.isCurrent : true

  const createMutation = useCreateEnrollment()

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    setBackendError(null)
    setSuccessResult(null)

    if (!studentId || !offeringId) {
      setBackendError('Both student and course offering must be selected.')
      return
    }

    try {
      const res = await createMutation.mutateAsync({
        student_id: Number(studentId),
        offering_id: Number(offeringId),
      })
      setSuccessResult(res)
    } catch (err: any) {
      // Backend error code mapping (e.g. ENROLLMENT_CAPACITY_FULL, DUPLICATE_ENROLLMENT)
      setBackendError(err.message || 'Enrollment rejected by system.')
    }
  }

  const handleReset = () => {
    setStudentId('')
    setOfferingId('')
    setBackendError(null)
    setSuccessResult(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            A-04
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Individual Enrollment
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Enroll an individual student into a specific course offering section.
        </p>
      </div>

      {/* Backend Rejection Error Alert */}
      {backendError && (
        <Alert
          variant="error"
          title="Enrollment Rejected"
          message={backendError}
        />
      )}

      {/* Success Banner */}
      {successResult && (
        <div style={{
          padding: '16px',
          borderRadius: '8px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={24} style={{ color: 'var(--color-success)' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Student Successfully Enrolled!
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Enrollment ID #{successResult.id} registered for {selectedStudent?.first_name} {selectedStudent?.last_name}.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="subtle" size="sm" onClick={handleReset}>
              Enroll Another
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<ArrowRight size={14} />}
              onClick={() => navigate('/admin/enrollments/records')}
            >
              View Records
            </Button>
          </div>
        </div>
      )}

      {/* Form & Live Validation Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left: Enrollment Form */}
        <Card padding={24}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginTop: 0, marginBottom: '16px' }}>
            Select Student & Offering
          </h2>

          {loadingStudents || loadingOfferings ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <LoadingSkeleton height={48} />
              <LoadingSkeleton height={48} />
            </div>
          ) : (
            <form onSubmit={handleEnroll} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Student *
                </label>
                <Select
                  value={String(studentId)}
                  onChange={(e) => {
                    const val = e.target.value
                    setStudentId(val ? Number(val) : '')
                    setBackendError(null)
                  }}
                  options={[
                    { value: '', label: '-- Select Student --' },
                    ...students.map(s => ({
                      value: String(s.id),
                      label: `${s.global_student_id} - ${s.first_name} ${s.last_name} (${s.email})`
                    }))
                  ]}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Course Offering Section *
                </label>
                <Select
                  value={String(offeringId)}
                  onChange={(e) => {
                    const val = e.target.value
                    setOfferingId(val ? Number(val) : '')
                    setBackendError(null)
                  }}
                  options={[
                    { value: '', label: '-- Select Course Offering --' },
                    ...offerings.filter(o => courseMap.has(o.course_id)).map(o => {
                      const c = courseMap.get(o.course_id)
                      const t = termMap.get(o.term_id)
                      const seatsLeft = Math.max(0, o.capacity - o.enrolled_count)
                      return {
                        value: String(o.id),
                        label: `${c?.code || `ID #${o.course_id}`} (Sec ${o.section}) - ${c?.title || ''} [${seatsLeft}/${o.capacity} seats left] - ${t?.label || ''}`
                      }
                    })
                  ]}
                />
              </div>

              {selectedOffering && (
                <div style={{
                  padding: '12px',
                  borderRadius: '6px',
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Course:</span>
                    <span style={{ fontWeight: 600 }}>{selectedCourse?.code} - {selectedCourse?.title}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Section:</span>
                    <span style={{ fontWeight: 600 }}>Section {selectedOffering.section}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Capacity:</span>
                    <span>
                      {selectedOffering.enrolled_count} / {selectedOffering.capacity}
                      {' '}({Math.max(0, selectedOffering.capacity - selectedOffering.enrolled_count)} available)
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <Button variant="secondary" type="button" onClick={handleReset}>
                  Reset
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={createMutation.isPending || !studentId || !offeringId}
                  icon={<UserCheck size={16} />}
                >
                  {createMutation.isPending ? 'Enrolling...' : 'Enroll Student'}
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Right: Live Validation Panel */}
        <Card padding={24}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginTop: 0, marginBottom: '16px' }}>
            Pre-Enrollment Verification
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            The following business constraints are validated live and verified by database triggers upon submission:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Check 1: Student chosen */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isStudentSelected ? (
                <CheckCircle2 size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              ) : (
                <XCircle size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              )}
              <span style={{ fontSize: '13px', color: isStudentSelected ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                Active student selected {selectedStudent ? `(${selectedStudent.first_name} ${selectedStudent.last_name})` : ''}
              </span>
            </div>

            {/* Check 2: Offering chosen */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isOfferingSelected ? (
                <CheckCircle2 size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              ) : (
                <XCircle size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              )}
              <span style={{ fontSize: '13px', color: isOfferingSelected ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                Valid course offering selected {selectedOffering ? `(Sec ${selectedOffering.section})` : ''}
              </span>
            </div>

            {/* Check 3: Capacity available */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {!isOfferingSelected ? (
                <XCircle size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              ) : hasSeatsAvailable ? (
                <CheckCircle2 size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              ) : (
                <XCircle size={18} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
              )}
              <span style={{
                fontSize: '13px',
                color: !isOfferingSelected ? 'var(--color-text-muted)' : hasSeatsAvailable ? 'var(--color-text-primary)' : 'var(--color-error)'
              }}>
                Seats available ({selectedOffering ? `${selectedOffering.capacity - selectedOffering.enrolled_count} seats remain` : 'awaiting selection'})
              </span>
            </div>

            {/* Check 4: Term Active */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {!isOfferingSelected ? (
                <XCircle size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              ) : isTermActive ? (
                <CheckCircle2 size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              ) : (
                <AlertCircle size={18} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
              )}
              <span style={{ fontSize: '13px', color: !isOfferingSelected ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
                Term enrollment status active
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
