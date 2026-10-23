import React, { useState, useEffect, useRef } from 'react'
import {
  Card, Button, Select, StatusPill, Alert, LoadingSkeleton, EmptyState,
  ConfirmationDialog
} from '@/components/ui'
import { LinearProgress } from '@/components/ui/Progress'
import {
  useExams, useExamMarks, useUpdateExamMarks
} from '../hooks'
import { useOfferings, useCourses } from '../../m2_academics/hooks'
import { validateMarksEntry } from '../utils'
import type { Course, CourseOffering } from '../../m2_academics/api'
import type { MarksResultItem } from '../api'
import {
  Award, Save, AlertCircle, CheckCircle2, Lock, Upload, Check, Send, UserX
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export function E08MarksEntryPage() {
  const [searchParams] = useSearchParams()
  const initialExamId = searchParams.get('examId')

  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || '')
  const [marksMap, setMarksMap] = useState<{ [regId: number]: string }>({})
  const [absentMap, setAbsentMap] = useState<{ [regId: number]: boolean }>({})
  const [remarksMap, setRemarksMap] = useState<{ [regId: number]: string }>({})
  const [backendError, setBackendError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Exams query
  const { data: examsData, isLoading: loadingExams } = useExams({ page_size: 100 })
  const exams = examsData?.items || []

  const { data: offeringsData } = useOfferings({ page_size: 100 })
  const offerings = offeringsData?.items || []

  const { data: coursesData } = useCourses({ page_size: 200 })
  const courses = coursesData?.items || []

  const courseMap = React.useMemo(() => {
    const m = new Map<number, string>()
    courses
      .filter((c: Course) => !c.code.startsWith('CS0') && !c.title.toLowerCase().startsWith('course '))
      .forEach((c: Course) => m.set(c.id, `${c.code} - ${c.title}`))
    return m
  }, [courses])

  const offeringMap = React.useMemo(() => {
    const m = new Map<number, { courseId: number; section: string }>()
    offerings.forEach((o: CourseOffering) => m.set(o.id, { courseId: o.course_id, section: o.section }))
    return m
  }, [offerings])

  const validExams = React.useMemo(() => {
    return exams.filter(e => {
      const off = offeringMap.get(e.offering_id)
      return off && courseMap.has(off.courseId)
    })
  }, [exams, offeringMap, courseMap])

  // Auto-select first exam if none selected
  useEffect(() => {
    if (!selectedExamId && exams.length > 0) {
      setSelectedExamId(String(exams[0].id))
    }
  }, [exams, selectedExamId])

  const currentExam = exams.find(e => e.id === Number(selectedExamId))
  const maxMarks = currentExam?.max_marks || 100

  // Marks query for selected exam
  const { data: marksData, isLoading: loadingMarks } = useExamMarks(
    selectedExamId ? Number(selectedExamId) : 0
  )
  const marksList = marksData || []

  const isPublished = marksList.length > 0 && marksList.some(m => m.is_published === true || m.is_published === 1)

  // Initialize marksMap when marksList loads
  useEffect(() => {
    if (marksList.length > 0) {
      const mMap: { [regId: number]: string } = {}
      const aMap: { [regId: number]: boolean } = {}
      const rMap: { [regId: number]: string } = {}

      marksList.forEach(item => {
        mMap[item.registration_id] = item.marks !== null ? String(item.marks) : ''
        aMap[item.registration_id] = item.marks === null && item.grade === 'F'
        rMap[item.registration_id] = ''
      })

      setMarksMap(mMap)
      setAbsentMap(aMap)
      setRemarksMap(rMap)
      setSaveSuccess(false)
      setBackendError(null)
    }
  }, [marksList, selectedExamId])

  const updateMarksMutation = useUpdateExamMarks()

  // Track counts & progress
  const totalStudents = marksList.length
  const enteredCount = Object.entries(marksMap).filter(([regId, v]) => {
    return v !== '' || !!absentMap[Number(regId)]
  }).length
  const progressPct = totalStudents > 0 ? Math.round((enteredCount / totalStudents) * 100) : 0

  const handleMarkChange = (regId: number, val: string) => {
    setMarksMap(prev => ({ ...prev, [regId]: val }))
    if (val !== '') {
      setAbsentMap(prev => ({ ...prev, [regId]: false }))
    }
    setSaveSuccess(false)
    setBackendError(null)
  }

  const handleToggleAbsent = (regId: number) => {
    setAbsentMap(prev => {
      const nextAbsent = !prev[regId]
      if (nextAbsent) {
        setMarksMap(m => ({ ...m, [regId]: '' }))
      }
      return { ...prev, [regId]: nextAbsent }
    })
    setSaveSuccess(false)
    setBackendError(null)
  }

  const handleSaveMarks = async (isSubmitting = false) => {
    setBackendError(null)
    setSaveSuccess(false)
    if (!selectedExamId) return

    // Validate marks between 0 and maxMarks
    for (const item of marksList) {
      const isAbsent = !!absentMap[item.registration_id]
      const valStr = marksMap[item.registration_id] || ''

      if (!isAbsent && valStr !== '') {
        const valRes = validateMarksEntry(valStr, maxMarks)
        if (!valRes.isValid) {
          setBackendError(`Student ${item.first_name} ${item.last_name}: ${valRes.error}`)
          return
        }
      }
    }

    const payload = marksList
      .filter(item => marksMap[item.registration_id] !== '' || absentMap[item.registration_id])
      .map(item => ({
        registration_id: item.registration_id,
        marks: absentMap[item.registration_id] ? 0 : Number(marksMap[item.registration_id] || 0)
      }))

    try {
      await updateMarksMutation.mutateAsync({
        examId: Number(selectedExamId),
        data: { marks: payload }
      })
      setSaveSuccess(true)
      if (isSubmitting) {
        setIsSubmitDialogOpen(false)
        toast.success('Marks submitted successfully for evaluation')
      }
    } catch (err: any) {
      setBackendError(err.message || 'Failed to save marks.')
    }
  }

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      const nextMap = { ...marksMap }
      let updatedCount = 0

      // Expect format: reg_id,marks or student_id,marks
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/"/g, ''))
        if (parts.length >= 2) {
          const id = Number(parts[0])
          const markVal = parts[1]
          if (!isNaN(id) && markVal !== '') {
            // Find registration matching either reg_id or student_id
            const match = marksList.find(m => m.registration_id === id || m.student_id === id)
            if (match) {
              const num = Number(markVal)
              if (!isNaN(num) && num >= 0 && num <= maxMarks) {
                nextMap[match.registration_id] = String(num)
                updatedCount++
              }
            }
          }
        }
      }

      setMarksMap(nextMap)
      toast.success(`Imported marks for ${updatedCount} students from CSV`)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Hidden file input for CSV import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,.txt"
        style={{ display: 'none' }}
        onChange={handleCSVImport}
      />

      {/* Header (T-WORKSPACE Header) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: '2px 6px', borderRadius: '4px' }}>
              E-08
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
              Marks Entry
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Record examination scores with inline validation. Press Tab or Enter to advance between students.
          </p>
        </div>

        <Button
          variant="secondary"
          icon={<Upload size={16} />}
          disabled={isPublished}
          onClick={() => fileInputRef.current?.click()}
        >
          Import marks (CSV)
        </Button>
      </div>

      {backendError && (
        <Alert variant="error" title="Submission Error" message={backendError} />
      )}

      {isPublished && (
        <Alert
          variant="warning"
          title="Results Published - Read Only"
          message="Official semester results for this examination event have been finalized and published. Submitted marks can no longer be edited."
        />
      )}

      {saveSuccess && (
        <Alert
          variant="success"
          title="Marks Saved Successfully"
          message={`Successfully saved scores for ${enteredCount} student registrations.`}
        />
      )}

      {/* Context Bar */}
      <Card variant="standard" padding={20}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 340px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Select Examination Event *
            </label>
            <Select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              options={validExams.map(e => {
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
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Maximum Score</div>
                <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700 }}>{maxMarks} pts</div>
              </div>

              <div style={{ minWidth: '160px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  <span>Progress</span>
                  <span className="tabular-nums" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                    Entered {enteredCount}/{totalStudents}
                  </span>
                </div>
                <LinearProgress value={progressPct} />
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Status</div>
                <StatusPill
                  label={isPublished ? 'Published' : enteredCount === totalStudents && totalStudents > 0 ? 'Submitted' : 'Draft'}
                  status={isPublished ? 'success' : enteredCount === totalStudents && totalStudents > 0 ? 'info' : 'warning'}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Marks Entry Grid */}
      <Card variant="standard" padding={0} style={{ overflow: 'hidden' }}>
        {loadingExams || loadingMarks ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <LoadingSkeleton height={48} />
            <LoadingSkeleton height={48} />
            <LoadingSkeleton height={48} />
          </div>
        ) : marksList.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <AlertCircle size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <div>No registered examinees found for this examination event.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Table Header Band */}
            <div style={{
              display: 'flex',
              padding: '12px 20px',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-muted)',
              fontWeight: 500,
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.02em'
            }}>
              <div style={{ flex: '1 1 220px' }}>Student</div>
              <div style={{ width: '140px' }}>Score (Max {maxMarks})</div>
              <div style={{ width: '100px', textAlign: 'center' }}>Absent?</div>
              <div style={{ flex: '1 1 180px' }}>Remark / Note</div>
              <div style={{ width: '80px', textAlign: 'center' }}>Grade</div>
            </div>

            {marksList.map((item, idx) => {
              const val = marksMap[item.registration_id] ?? ''
              const isAbsent = !!absentMap[item.registration_id]
              const valRes = isAbsent ? { isValid: true } : validateMarksEntry(val, maxMarks)
              const isInvalid = !valRes.isValid
              const remark = remarksMap[item.registration_id] ?? ''

              return (
                <div
                  key={item.registration_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 20px',
                    borderBottom: idx < marksList.length - 1 ? '1px solid var(--color-border)' : 'none',
                    backgroundColor: isInvalid
                      ? 'var(--color-error-bg)'
                      : isAbsent ? 'var(--color-surface-muted)' : 'var(--color-surface)',
                    transition: 'background-color 120ms ease'
                  }}
                >
                  <div style={{ flex: '1 1 220px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
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
                      step="0.5"
                      disabled={isPublished || isAbsent}
                      value={isAbsent ? '' : val}
                      onChange={(e) => handleMarkChange(item.registration_id, e.target.value)}
                      placeholder={isAbsent ? 'Absent' : `0 – ${maxMarks}`}
                      style={{
                        width: '110px',
                        height: '36px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isInvalid ? 'var(--color-error)' : 'var(--color-border-strong)'}`,
                        fontSize: '14px',
                        fontWeight: 600,
                        outline: 'none',
                        backgroundColor: isPublished || isAbsent ? 'var(--color-surface-muted)' : '#ffffff',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                    {isInvalid && (
                      <div style={{ fontSize: '11px', color: 'var(--color-error)', marginTop: '2px' }}>
                        {valRes.error}
                      </div>
                    )}
                  </div>

                  <div style={{ width: '100px', display: 'flex', justifyContent: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: isPublished ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        disabled={isPublished}
                        checked={isAbsent}
                        onChange={() => handleToggleAbsent(item.registration_id)}
                        style={{ cursor: isPublished ? 'not-allowed' : 'pointer' }}
                      />
                      <span style={{ color: isAbsent ? 'var(--color-error)' : 'var(--color-text-secondary)', fontWeight: isAbsent ? 600 : 400 }}>
                        Absent
                      </span>
                    </label>
                  </div>

                  <div style={{ flex: '1 1 180px' }}>
                    <input
                      type="text"
                      disabled={isPublished}
                      placeholder="Optional remarks..."
                      value={remark}
                      onChange={(e) => setRemarksMap(prev => ({ ...prev, [item.registration_id]: e.target.value }))}
                      style={{
                        width: '90%',
                        height: '32px',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        fontSize: '12px',
                        outline: 'none',
                        backgroundColor: isPublished ? 'var(--color-surface-muted)' : '#ffffff'
                      }}
                    />
                  </div>

                  <div style={{ width: '80px', textAlign: 'center' }}>
                    {item.grade ? (
                      <StatusPill
                        label={item.grade}
                        status={item.grade === 'F' ? 'error' : item.grade.startsWith('A') || item.grade === 'O' ? 'success' : 'info'}
                      />
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Sticky Action Footer */}
      <div style={{
        position: 'sticky',
        bottom: '16px',
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {enteredCount < totalStudents ? (
            <span style={{ color: 'var(--color-warning)', fontWeight: 500 }}>
              Draft in progress: {enteredCount} of {totalStudents} scores recorded
            </span>
          ) : (
            <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>
              All {totalStudents} scores completed and validated
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            size="md"
            icon={<Save size={16} />}
            disabled={isPublished || updateMarksMutation.isPending || marksList.length === 0}
            onClick={() => handleSaveMarks(false)}
          >
            Save draft
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={isPublished ? <Lock size={16} /> : <Send size={16} />}
            disabled={isPublished || updateMarksMutation.isPending || marksList.length === 0}
            onClick={() => setIsSubmitDialogOpen(true)}
          >
            {isPublished ? 'Published' : 'Submit marks'}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog on Final Submit */}
      <ConfirmationDialog
        isOpen={isSubmitDialogOpen}
        title="Submit Examination Marks"
        message={`Are you sure you want to submit marks for ${enteredCount} student registrations? Once submitted, marks are locked for result processing and grade calculation.`}
        confirmLabel="Submit Marks"
        isLoading={updateMarksMutation.isPending}
        onConfirm={() => handleSaveMarks(true)}
        onCancel={() => setIsSubmitDialogOpen(false)}
      />
    </div>
  )
}
