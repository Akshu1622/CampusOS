import React, { useState } from 'react'
import {
  Card, Button, Select, Table, StatusPill, Alert, LoadingSkeleton,
  ConfirmationDialog
} from '@/components/ui'
import {
  useExams, useExamMarks, useProcessResults, usePublishResults
} from '../hooks'
import { useOfferings, useCourses } from '../../m2_academics/hooks'
import type { Course, CourseOffering } from '../../m2_academics/api'
import type { MarksResultItem } from '../api'
import {
  Award, Play, Send, CheckCircle2, AlertTriangle, AlertCircle, Lock
} from 'lucide-react'

export function E09ResultProcessingPage() {
  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [backendError, setBackendError] = useState<string | null>(null)
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)

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

  // Auto-select first exam
  React.useEffect(() => {
    if (!selectedExamId && exams.length > 0) {
      setSelectedExamId(String(exams[0].id))
    }
  }, [exams, selectedExamId])

  const { data: marksData, isLoading: loadingMarks } = useExamMarks(
    selectedExamId ? Number(selectedExamId) : 0
  )
  const marksList = marksData || []

  const isPublished = marksList.length > 0 && marksList.some(m => m.is_published === true || m.is_published === 1)
  const isProcessed = marksList.length > 0 && marksList.every(m => m.grade !== null)
  const allMarksEntered = marksList.length > 0 && marksList.every(m => m.marks !== null)

  const processMutation = useProcessResults()
  const publishMutation = usePublishResults()

  const handleProcess = async () => {
    setBackendError(null)
    if (!selectedExamId) return
    try {
      await processMutation.mutateAsync({ exam_id: Number(selectedExamId) })
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
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Reg #{row.registration_id}</span>
        </div>
      )
    },
    {
      key: 'marks',
      header: 'Score',
      render: (row: MarksResultItem) => (
        <span style={{ fontWeight: 600 }}>
          {row.marks !== null ? `${row.marks} pts` : 'Not entered'}
        </span>
      )
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (row: MarksResultItem) => (
        row.grade ? (
          <StatusPill label={row.grade} status="success" />
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Unprocessed</span>
        )
      )
    },
    {
      key: 'points',
      header: 'Grade Points',
      render: (row: MarksResultItem) => (
        <span style={{ fontWeight: 600 }}>
          {row.grade_points !== null ? row.grade_points : '—'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: MarksResultItem) => (
        <StatusPill
          label={row.is_published ? 'PUBLISHED' : 'DRAFT'}
          status={row.is_published ? 'success' : 'neutral'}
        />
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            E-09
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Result Processing & Publishing
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Process raw exam scores into grade letters and publish official semester results.
        </p>
      </div>

      {backendError && (
        <Alert variant="error" title="Operation Rejected" message={backendError} />
      )}

      {isPublished && (
        <Alert
          variant="success"
          title="Results Officially Published"
          message="Results for this examination event have been finalized and published. Students can now view their official grades on their grade card."
        />
      )}

      {/* Select Exam Bar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Select Examination Event *
            </label>
            <Select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value)
                setBackendError(null)
              }}
              options={exams.map(e => {
                const off = offeringMap.get(e.offering_id)
                const crs = off ? courseMap.get(off.courseId) : `Offering #${e.offering_id}`
                return {
                  value: String(e.id),
                  label: `Exam #${e.id}: ${crs} (${e.exam_type})`
                }
              })}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              variant="secondary"
              icon={<Play size={16} />}
              disabled={isPublished || processMutation.isPending || !allMarksEntered}
              onClick={handleProcess}
            >
              {processMutation.isPending ? 'Processing...' : 'Process Grades'}
            </Button>
            <Button
              variant="primary"
              icon={<Send size={16} />}
              disabled={isPublished || !isProcessed || publishMutation.isPending}
              onClick={() => setIsPublishDialogOpen(true)}
            >
              Publish Results
            </Button>
          </div>
        </div>
      </Card>

      {/* Pre-Processing Checklist Status */}
      <Card padding={16}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginTop: 0, marginBottom: '12px' }}>
          Validation Readiness Checklist
        </h3>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            {allMarksEntered ? (
              <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
            ) : (
              <AlertCircle size={16} style={{ color: 'var(--color-warning)' }} />
            )}
            <span>All student marks entered ({marksList.filter(m => m.marks !== null).length}/{marksList.length})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            {isProcessed ? (
              <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
            ) : (
              <AlertCircle size={16} style={{ color: 'var(--color-text-muted)' }} />
            )}
            <span>Grades computed against grade scale</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            {isPublished ? (
              <Lock size={16} style={{ color: 'var(--color-success)' }} />
            ) : (
              <AlertTriangle size={16} style={{ color: 'var(--color-text-muted)' }} />
            )}
            <span>Publication state: {isPublished ? 'Published' : 'Draft / Unfinalized'}</span>
          </div>
        </div>
      </Card>

      {/* Results Preview Table */}
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
            <div>No exam marks recorded for this event.</div>
          </div>
        ) : (
          <Table
            columns={columns}
            data={marksList}
          />
        )}
      </Card>

      {/* Confirmation Dialog for Publishing */}
      <ConfirmationDialog
        isOpen={isPublishDialogOpen}
        title="Publish Examination Results"
        message="Are you sure you want to officially publish these examination results? Once published, results cannot be modified or re-processed, and grades will become permanently visible to students."
        confirmLabel="Publish Results"
        isDanger={true}
        isLoading={publishMutation.isPending}
        onConfirm={handlePublishConfirm}
        onCancel={() => setIsPublishDialogOpen(false)}
      />
    </div>
  )
}
