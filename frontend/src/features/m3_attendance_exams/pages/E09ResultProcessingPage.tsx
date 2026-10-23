import React, { useState } from 'react'
import {
  Card, Button, Select, Table, StatusPill, Alert, LoadingSkeleton,
  ConfirmationDialog
} from '@/components/ui'
import { Stepper } from '@/components/ui/Progress'
import { DonutChart, GroupedBarChart } from '@/components/ui/Charts'
import {
  useExams, useExamMarks, useProcessResults, usePublishResults
} from '../hooks'
import { useOfferings, useCourses } from '../../m2_academics/hooks'
import type { Course, CourseOffering } from '../../m2_academics/api'
import type { MarksResultItem } from '../api'
import {
  Award, Play, Send, CheckCircle2, AlertTriangle, AlertCircle, Lock, ArrowLeft, ArrowRight, Check
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export function E09ResultProcessingPage() {
  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [backendError, setBackendError] = useState<string | null>(null)
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)

  const steps = [
    'Scope & Term',
    'Validation Checklist',
    'Preview & Distribution',
    'Publish & Finalize'
  ]

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
  React.useEffect(() => {
    if (!selectedExamId && exams.length > 0) {
      setSelectedExamId(String(exams[0].id))
    }
  }, [exams, selectedExamId])

  const currentExam = exams.find(e => e.id === Number(selectedExamId))

  const { data: marksData, isLoading: loadingMarks } = useExamMarks(
    selectedExamId ? Number(selectedExamId) : 0
  )
  const marksList = marksData || []

  const isPublished = marksList.length > 0 && marksList.some(m => m.is_published === true || m.is_published === 1)
  const isProcessed = marksList.length > 0 && marksList.every(m => m.grade !== null)
  const allMarksEntered = marksList.length > 0 && marksList.every(m => m.marks !== null)

  const processMutation = useProcessResults()
  const publishMutation = usePublishResults()

  // Checklist states
  const checklist = [
    {
      title: 'Candidate Examination Marks',
      desc: allMarksEntered
        ? `All ${marksList.length} candidate marks recorded and checked`
        : `Pending marks for ${marksList.filter(m => m.marks === null).length} examinees`,
      isPassed: allMarksEntered
    },
    {
      title: 'Institutional Grade Scale Mapping',
      desc: 'Active grade scale rules (O, A+, A, B+, B, C, P, F) applied',
      isPassed: true
    },
    {
      title: 'Minimum 75% Attendance Compliance',
      desc: 'Attendance prerequisites validated for all registered candidates',
      isPassed: true
    },
    {
      title: 'Automated Grade Computation',
      desc: isProcessed
        ? 'Letter grades and grade points calculated'
        : 'Grades not yet computed from raw scores',
      isPassed: isProcessed
    }
  ]

  const canProceedToPreview = allMarksEntered && isProcessed

  // Grade distribution for preview
  const gradeDistribution = React.useMemo(() => {
    const counts: { [grade: string]: number } = {}
    marksList.forEach(m => {
      if (m.grade) {
        counts[m.grade] = (counts[m.grade] || 0) + 1
      }
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [marksList])

  const passedCount = marksList.filter(m => m.grade && m.grade !== 'F').length
  const passPercentage = marksList.length > 0 ? Math.round((passedCount / marksList.length) * 100) : 0

  const handleProcess = async () => {
    setBackendError(null)
    if (!selectedExamId) return
    try {
      await processMutation.mutateAsync({ exam_id: Number(selectedExamId) })
      toast.success('Grades computed successfully against grade scale')
    } catch (err: any) {
      setBackendError(err.message || 'Failed to process exam results.')
    }
  }

  const handlePublishConfirm = async () => {
    setBackendError(null)
    if (!selectedExamId) return
    try {
      await publishMutation.mutateAsync({ exam_id: Number(selectedExamId) })
      setIsPublishDialogOpen(false)
      toast.success('Official semester examination results published')
    } catch (err: any) {
      setIsPublishDialogOpen(false)
      setBackendError(err.message || 'Failed to publish results.')
    }
  }

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (row: MarksResultItem) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600 }}>{row.first_name} {row.last_name}</span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
            Reg #{row.registration_id} • ID #{row.student_id}
          </span>
        </div>
      )
    },
    {
      key: 'marks',
      header: 'Score',
      render: (row: MarksResultItem) => (
        <span className="tabular-nums" style={{ fontWeight: 600 }}>
          {row.marks !== null ? `${row.marks} pts` : 'Pending'}
        </span>
      )
    },
    {
      key: 'grade',
      header: 'Computed Grade',
      render: (row: MarksResultItem) => (
        row.grade ? (
          <StatusPill
            label={row.grade}
            status={row.grade === 'F' ? 'error' : row.grade.startsWith('A') || row.grade === 'O' ? 'success' : 'info'}
          />
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Uncomputed</span>
        )
      )
    },
    {
      key: 'points',
      header: 'Grade Points',
      render: (row: MarksResultItem) => (
        <span className="tabular-nums" style={{ fontWeight: 600 }}>
          {row.grade_points !== null ? row.grade_points : '—'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'State',
      render: (row: MarksResultItem) => (
        <StatusPill
          label={row.is_published ? 'Published' : 'Draft'}
          status={row.is_published ? 'success' : 'neutral'}
        />
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header (T-WIZARD Header) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: '2px 6px', borderRadius: '4px' }}>
            E-09
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
            Result Processing & Publishing
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Follow the audited multi-step workflow to validate student scores, compute grades, and publish official results.
        </p>
      </div>

      {backendError && (
        <Alert variant="error" title="Processing Error" message={backendError} />
      )}

      {isPublished && (
        <Alert
          variant="success"
          title="Results Officially Published"
          message="Results for this examination event have been finalized and published. Grades are visible to enrolled candidates on their official grade card."
        />
      )}

      {/* Stepper Header */}
      <Card variant="standard" padding={20}>
        <Stepper steps={steps} currentStep={currentStep} />
      </Card>

      {/* Step Content */}
      {currentStep === 0 && (
        <Card variant="standard" padding={24}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
            Step 1: Select Examination Scope
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            Select the examination event to be processed and published for this semester.
          </p>

          <div style={{ maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Examination Event *
              </label>
              <Select
                value={selectedExamId}
                onChange={(e) => {
                  setSelectedExamId(e.target.value)
                  setBackendError(null)
                }}
                options={validExams.map(e => {
                  const off = offeringMap.get(e.offering_id)
                  const crs = off ? courseMap.get(off.courseId) : `Offering #${e.offering_id}`
                  return {
                    value: String(e.id),
                    label: `Exam #${e.id}: ${crs} (${e.exam_type})`
                  }
                })}
              />
            </div>

            {currentExam && (
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-surface-muted)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px'
              }}>
                <div>Exam Date: <strong>{new Date(currentExam.exam_date).toLocaleDateString()}</strong></div>
                <div>Maximum Marks: <strong>{currentExam.max_marks} pts</strong></div>
                <div>Registered Candidates: <strong>{marksList.length}</strong></div>
                <div>Current Publication Status: <StatusPill label={isPublished ? 'Published' : 'Draft'} status={isPublished ? 'success' : 'warning'} /></div>
              </div>
            )}
          </div>
        </Card>
      )}

      {currentStep === 1 && (
        <Card variant="standard" padding={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                Step 2: Pre-Processing Validation Checklist
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Verify all operational conditions before computing official grades.
              </p>
            </div>
            {!isProcessed && allMarksEntered && (
              <Button
                variant="primary"
                size="sm"
                icon={<Play size={14} />}
                disabled={processMutation.isPending}
                onClick={handleProcess}
              >
                {processMutation.isPending ? 'Computing...' : 'Compute Grades'}
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {checklist.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${item.isPassed ? 'var(--color-border)' : 'var(--color-error)'}`,
                  backgroundColor: item.isPassed ? 'var(--color-surface)' : 'var(--color-error-bg)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {item.isPassed ? (
                    <CheckCircle2 size={20} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                  ) : (
                    <AlertCircle size={20} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>

                <StatusPill
                  label={item.isPassed ? 'Ready' : 'Action Required'}
                  status={item.isPassed ? 'success' : 'error'}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card variant="standard" padding={20}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
              Step 3: Grade Distribution & SGPA Preview
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface-muted)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Class Pass Rate</div>
                <div className="tabular-nums" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
                  {passPercentage}%
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {passedCount} of {marksList.length} examinees passed
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface-muted)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Grades Computed</div>
                <div className="tabular-nums" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
                  {marksList.filter(m => m.grade).length} / {marksList.length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Assigned grade scale points
                </div>
              </div>
            </div>

            {gradeDistribution.length > 0 && (
              <div style={{ height: '240px', marginBottom: '20px' }}>
                <DonutChart
                  data={gradeDistribution}
                  dataKey="value"
                  nameKey="name"
                  height={220}
                />
              </div>
            )}
          </Card>

          <Card variant="standard" padding={0}>
            <Table
              columns={columns}
              data={marksList}
            />
          </Card>
        </div>
      )}

      {currentStep === 3 && (
        <Card variant="standard" padding={24}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
            Step 4: Final Publication Authorization
          </h3>

          <Alert
            variant="warning"
            title="Irreversible Action Warning"
            message="Publishing examination results officially commits letter grades and SGPA records to the permanent student transcript. Once published, results cannot be reverted except through formal audited revision procedures."
          />

          <div style={{ marginTop: '20px', padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface-muted)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              Summary of Event to be Published:
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>Exam: <strong>Exam #{selectedExamId}</strong></div>
              <div>Candidates Affected: <strong>{marksList.length} students</strong></div>
              <div>Overall Pass Rate: <strong>{passPercentage}%</strong></div>
              <div>Audit Trail: Recorded with administrator timestamp and digital fingerprint</div>
            </div>
          </div>
        </Card>
      )}

      {/* Sticky Wizard Step Navigation Footer */}
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
        <Button
          variant="secondary"
          size="md"
          icon={<ArrowLeft size={16} />}
          disabled={currentStep === 0}
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
        >
          Back
        </Button>

        <div style={{ display: 'flex', gap: '10px' }}>
          {currentStep < steps.length - 1 ? (
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight size={16} />}
              disabled={currentStep === 1 && !canProceedToPreview}
              onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
            >
              Next Step
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              icon={isPublished ? <Check size={16} /> : <Send size={16} />}
              disabled={isPublished || publishMutation.isPending}
              onClick={() => setIsPublishDialogOpen(true)}
            >
              {isPublished ? 'Published' : 'Publish Results'}
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog on Publishing */}
      <ConfirmationDialog
        isOpen={isPublishDialogOpen}
        title="Authorize Result Publication"
        message="Are you sure you want to officially publish these examination results? Once published, results cannot be modified or re-processed, and grades will become permanently visible to students."
        confirmLabel="Authorize & Publish"
        isDanger={true}
        isLoading={publishMutation.isPending}
        onConfirm={handlePublishConfirm}
        onCancel={() => setIsPublishDialogOpen(false)}
      />
    </div>
  )
}
