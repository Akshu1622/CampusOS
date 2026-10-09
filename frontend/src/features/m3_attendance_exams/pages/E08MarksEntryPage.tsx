import React, { useState, useEffect } from 'react'
import {
  Card, Button, Select, StatusPill, Alert, LoadingSkeleton, EmptyState
} from '@/components/ui'
import {
  useExams, useExamMarks, useUpdateExamMarks
} from '../hooks'
import { useOfferings, useCourses } from '../../m2_academics/hooks'
import type { Course, CourseOffering } from '../../m2_academics/api'
import type { MarksResultItem } from '../api'
import {
  Award, Save, AlertCircle, CheckCircle2, Lock
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

export function E08MarksEntryPage() {
  const [searchParams] = useSearchParams()
  const initialExamId = searchParams.get('examId')

  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || '')
  const [marksMap, setMarksMap] = useState<{ [regId: number]: string }>({})
  const [backendError, setBackendError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Exams query
  const { data: examsData, isLoading: loadingExams } = useExams({ page_size: 100 })
  const exams = examsData?.items || []

  const { data: offeringsData } = useOfferings({ page_size: 100 })
  const offerings = offeringsData?.items || []

  const { data: coursesData } = useCourses({ page_size: 200 })
  const courses = coursesData?.items || []

  const courseMap = React.useMemo(() => {
    const m = new Map<number, string>()
    courses.forEach((c: Course) => m.set(c.id, `${c.code} - ${c.title}`))
    return m
  }, [courses])

  const offeringMap = React.useMemo(() => {
    const m = new Map<number, { courseId: number; section: string }>()
    offerings.forEach((o: CourseOffering) => m.set(o.id, { courseId: o.course_id, section: o.section }))
    return m
  }, [offerings])

  // Auto-select first exam if none selected
  useEffect(() => {
    if (!selectedExamId && exams.length > 0) {
      setSelectedExamId(String(exams[0].id))
    }
  }, [exams, selectedExamId])

  const currentExam = exams.find(e => e.id === Number(selectedExamId))
  const maxMarks = currentExam?.max_marks || 100

  // Marks query for selected exam
  const { data: marksData, isLoading: loadingMarks, error: marksError } = useExamMarks(
    selectedExamId ? Number(selectedExamId) : 0
  )
  const marksList = marksData || []

  const isPublished = marksList.length > 0 && marksList.some(m => m.is_published === true || m.is_published === 1)

  // Initialize marksMap when marksList loads
  useEffect(() => {
    if (marksList.length > 0) {
      const map: { [regId: number]: string } = {}
      marksList.forEach(item => {
        map[item.registration_id] = item.marks !== null ? String(item.marks) : ''
      })
      setMarksMap(map)
      setSaveSuccess(false)
      setBackendError(null)
    }
  }, [marksList, selectedExamId])

  const updateMarksMutation = useUpdateExamMarks()

  // Track counts
  const totalStudents = marksList.length
  const enteredCount = Object.values(marksMap).filter(v => v !== '').length

  const handleMarkChange = (regId: number, val: string) => {
    setMarksMap(prev => ({ ...prev, [regId]: val }))
    setSaveSuccess(false)
    setBackendError(null)
  }

  const handleSaveMarks = async () => {
    setBackendError(null)
    setSaveSuccess(false)
    if (!selectedExamId) return

    // Validate marks between 0 and maxMarks
    for (const item of marksList) {
      const valStr = marksMap[item.registration_id]
      if (valStr !== '') {
        const num = Number(valStr)
        if (isNaN(num) || num < 0 || num > maxMarks) {
          setBackendError(`Marks for student ${item.first_name} ${item.last_name} must be between 0 and ${maxMarks}.`)
          return
        }
      }
    }

    const payload = marksList
      .filter(item => marksMap[item.registration_id] !== '')
      .map(item => ({
        registration_id: item.registration_id,
        marks: Number(marksMap[item.registration_id])
      }))

    try {
      await updateMarksMutation.mutateAsync({
        examId: Number(selectedExamId),
        data: { marks: payload }
      })
      setSaveSuccess(true)
    } catch (err: any) {
      setBackendError(err.message || 'Failed to save marks.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            E-08
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Examination Marks Entry Workspace
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Enter student exam scores and validate against maximum possible marks.
        </p>
      </div>

      {backendError && (
        <Alert variant="error" title="Submission Error" message={backendError} />
      )}

      {isPublished && (
        <Alert
          variant="warning"
          title="Results Published - Read Only"
          message="The examination results for this event have been finalized and published. Submitted marks can no longer be modified."
        />
      )}

      {saveSuccess && (
        <Alert
          variant="success"
          title="Marks Saved"
          message={`Successfully saved marks for ${enteredCount} student registrations.`}
        />
      )}

      {/* Context Bar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Select Examination Event *
            </label>
            <Select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              options={exams.map(e => {
                const off = offeringMap.get(e.offering_id)
                const crs = off ? courseMap.get(off.courseId) : `Offering #${e.offering_id}`
                return {
                  value: String(e.id),
                  label: `Exam #${e.id}: ${crs} (${e.exam_type}) - Max ${e.max_marks} pts`
                }
              })}
            />
          </div>

          {currentExam && (
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Maximum Marks</div>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{maxMarks} pts</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Scores Entered</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {enteredCount} / {totalStudents}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Marks Entry Grid */}
      <Card padding={0}>
        {loadingExams || loadingMarks ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <LoadingSkeleton height={44} />
            <LoadingSkeleton height={44} />
            <LoadingSkeleton height={44} />
          </div>
        ) : marksList.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <AlertCircle size={36} style={{ marginBottom: '8px' }} />
            <div>No registered students found for this examination event.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex',
              padding: '12px 20px',
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-surface-subtle)',
              fontWeight: 600,
              fontSize: '13px',
              color: 'var(--color-text-muted)'
            }}>
              <div style={{ flex: '1 1 200px' }}>Student</div>
              <div style={{ width: '140px' }}>Marks (0 - {maxMarks})</div>
              <div style={{ width: '100px', textAlign: 'center' }}>Grade</div>
            </div>

            {marksList.map((item, idx) => {
              const val = marksMap[item.registration_id] ?? ''
              const num = val !== '' ? Number(val) : null
              const isInvalid = num !== null && (isNaN(num) || num < 0 || num > maxMarks)

              return (
                <div
                  key={item.registration_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 20px',
                    borderBottom: idx < marksList.length - 1 ? '1px solid var(--color-border)' : 'none',
                    background: isInvalid ? 'rgba(239, 68, 68, 0.05)' : 'var(--color-surface)'
                  }}
                >
                  <div style={{ flex: '1 1 200px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>
                      {item.first_name} {item.last_name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                      Reg #{item.registration_id} • Student #{item.student_id}
                    </div>
                  </div>

                  <div style={{ width: '140px' }}>
                    <input
                      type="number"
                      min={0}
                      max={maxMarks}
                      disabled={isPublished}
                      value={val}
                      onChange={(e) => handleMarkChange(item.registration_id, e.target.value)}
                      placeholder={`Max ${maxMarks}`}
                      style={{
                        width: '100px',
                        height: '36px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${isInvalid ? 'var(--color-error)' : 'var(--color-border)'}`,
                        fontSize: '14px',
                        fontWeight: 600,
                        outline: 'none',
                        background: isPublished ? 'var(--color-surface-subtle)' : '#fff'
                      }}
                    />
                    {isInvalid && (
                      <div style={{ fontSize: '11px', color: 'var(--color-error)', marginTop: '2px' }}>
                        Must be 0 – {maxMarks}
                      </div>
                    )}
                  </div>

                  <div style={{ width: '100px', textAlign: 'center' }}>
                    {item.grade ? (
                      <StatusPill label={item.grade} status="success" />
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Pending</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Sticky Save Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '16px 20px',
        background: 'var(--color-surface)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)'
      }}>
        <Button
          variant="primary"
          size="md"
          icon={isPublished ? <Lock size={16} /> : <Save size={16} />}
          disabled={isPublished || updateMarksMutation.isPending || marksList.length === 0}
          onClick={handleSaveMarks}
        >
          {isPublished
            ? 'Results Already Published'
            : updateMarksMutation.isPending
            ? 'Saving Marks...'
            : 'Save Examination Marks'}
        </Button>
      </div>
    </div>
  )
}
