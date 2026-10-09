import React, { useState } from 'react'
import {
  Card, Button, Input, Select, Table, StatusPill, Drawer, EmptyState,
  LoadingSkeleton, ConfirmationDialog
} from '@/components/ui'
import {
  useExams, useCreateExam, useUpdateExam, useDeleteExam
} from '../hooks'
import { useOfferings, useCourses } from '../../m2_academics/hooks'
import type { Course, CourseOffering } from '../../m2_academics/api'
import type { Exam, ExamCreate } from '../api'
import {
  Plus, Calendar, Trash2, Edit2, AlertCircle, FileText
} from 'lucide-react'

export function E05ExamManagementPage() {
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [formData, setFormData] = useState<ExamCreate>({
    offering_id: 1,
    exam_type: 'FINAL',
    exam_date: new Date().toISOString().split('T')[0],
    max_marks: 100,
    reg_start_date: new Date().toISOString().split('T')[0],
    reg_end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  })
  const [formError, setFormError] = useState<string | null>(null)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null)

  // Lookups
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

  // Exams query
  const { data: examsData, isLoading, error } = useExams({
    offering_id: selectedOfferingId ? Number(selectedOfferingId) : undefined,
    page_size: 100,
  })
  const exams = examsData?.items || []

  const createMutation = useCreateExam()
  const updateMutation = useUpdateExam()
  const deleteMutation = useDeleteExam()

  const filteredExams = exams.filter(e => {
    const matchesType = selectedType ? e.exam_type === selectedType : true
    return matchesType
  })

  const handleOpenAdd = () => {
    setEditingExam(null)
    setFormData({
      offering_id: offerings[0]?.id || 1,
      exam_type: 'FINAL',
      exam_date: new Date().toISOString().split('T')[0],
      max_marks: 100,
      reg_start_date: new Date().toISOString().split('T')[0],
      reg_end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    })
    setFormError(null)
    setIsDrawerOpen(true)
  }

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam)
    setFormData({
      offering_id: exam.offering_id,
      exam_type: exam.exam_type,
      exam_date: exam.exam_date ? exam.exam_date.split('T')[0] : '',
      max_marks: exam.max_marks,
      reg_start_date: exam.reg_start_date ? exam.reg_start_date.split('T')[0] : '',
      reg_end_date: exam.reg_end_date ? exam.reg_end_date.split('T')[0] : '',
    })
    setFormError(null)
    setIsDrawerOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (formData.max_marks <= 0) {
      setFormError('Max marks must be greater than 0.')
      return
    }

    try {
      if (editingExam) {
        await updateMutation.mutateAsync({
          id: editingExam.id,
          data: {
            exam_type: formData.exam_type,
            exam_date: formData.exam_date,
            max_marks: Number(formData.max_marks),
            reg_start_date: formData.reg_start_date,
            reg_end_date: formData.reg_end_date,
          }
        })
      } else {
        await createMutation.mutateAsync({
          offering_id: Number(formData.offering_id),
          exam_type: formData.exam_type,
          exam_date: formData.exam_date,
          max_marks: Number(formData.max_marks),
          reg_start_date: formData.reg_start_date,
          reg_end_date: formData.reg_end_date,
        })
      }
      setIsDrawerOpen(false)
    } catch (err: any) {
      setFormError(err.message || 'Operation failed. Please verify dates and types.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      // toast shown in hook
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (row: Exam) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>#{row.id}</span>
      )
    },
    {
      key: 'course',
      header: 'Course & Section',
      render: (row: Exam) => {
        const off = offeringMap.get(row.offering_id)
        const crs = off ? courseMap.get(off.courseId) : `Offering #${row.offering_id}`
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
              {crs}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Section {off?.section || 'N/A'}
            </span>
          </div>
        )
      }
    },
    {
      key: 'type',
      header: 'Type',
      render: (row: Exam) => (
        <StatusPill
          label={row.exam_type}
          status={row.exam_type === 'FINAL' ? 'warning' : 'info'}
        />
      )
    },
    {
      key: 'date',
      header: 'Exam Date',
      render: (row: Exam) => (
        <span style={{ fontSize: '13px', fontWeight: 500 }}>
          {row.exam_date ? new Date(row.exam_date).toLocaleDateString() : 'N/A'}
        </span>
      )
    },
    {
      key: 'max_marks',
      header: 'Max Marks',
      render: (row: Exam) => (
        <span style={{ fontWeight: 600 }}>{row.max_marks} pts</span>
      )
    },
    {
      key: 'registration_window',
      header: 'Registration Window',
      render: (row: Exam) => (
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {row.reg_start_date ? new Date(row.reg_start_date).toLocaleDateString() : 'N/A'} –{' '}
          {row.reg_end_date ? new Date(row.reg_end_date).toLocaleDateString() : 'N/A'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Exam) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            title="Edit Exam"
          >
            <Edit2 size={14} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteTarget(row)}
            title="Delete Exam"
          >
            <Trash2 size={14} />
          </Button>
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
              E-05
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Exam Management & Scheduling
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Schedule examination events, define maximum marks, and configure registration windows.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenAdd}>
          Schedule Exam
        </Button>
      </div>

      {/* Filter Bar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '300px' }}>
            <Select
              value={selectedOfferingId}
              onChange={(e) => setSelectedOfferingId(e.target.value)}
              options={[
                { value: '', label: 'All Course Offerings' },
                ...offerings.map((o: CourseOffering) => ({
                  value: String(o.id),
                  label: `${courseMap.get(o.course_id) || `Offering #${o.id}`} (Sec ${o.section})`
                }))
              ]}
            />
          </div>
          <div style={{ width: '180px' }}>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              options={[
                { value: '', label: 'All Exam Types' },
                { value: 'QUIZ', label: 'Quiz' },
                { value: 'MIDTERM', label: 'Midterm' },
                { value: 'FINAL', label: 'Final Exam' },
                { value: 'ASSIGNMENT', label: 'Assignment' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card padding={0}>
        {isLoading ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <LoadingSkeleton height={44} />
            <LoadingSkeleton height={44} />
            <LoadingSkeleton height={44} />
          </div>
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-error)' }}>
            <AlertCircle size={32} style={{ marginBottom: '8px' }} />
            <div>Failed to load scheduled exams.</div>
          </div>
        ) : filteredExams.length === 0 ? (
          <EmptyState
            icon={<FileText size={36} />}
            title="No exams scheduled"
            description={selectedOfferingId || selectedType ? "No exams match the selected filters." : "Schedule an exam event for course offerings."}
            action={!selectedOfferingId && !selectedType ? (
              <Button variant="primary" onClick={handleOpenAdd}>Schedule Exam</Button>
            ) : undefined}
          />
        ) : (
          <Table
            columns={columns}
            data={filteredExams}
          />
        )}
      </Card>

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingExam ? `Edit Exam Event #${editingExam.id}` : 'Schedule New Exam'}
        size="md"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && (
            <div style={{ padding: '12px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', fontSize: '13px' }}>
              {formError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Course Offering Section *
            </label>
            <Select
              value={String(formData.offering_id)}
              disabled={!!editingExam}
              onChange={(e) => setFormData({ ...formData, offering_id: Number(e.target.value) })}
              options={offerings.map((o: CourseOffering) => ({
                value: String(o.id),
                label: `${courseMap.get(o.course_id) || `Offering #${o.id}`} (Sec ${o.section})`
              }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Exam Type *
            </label>
            <Select
              value={formData.exam_type}
              onChange={(e) => setFormData({ ...formData, exam_type: e.target.value as any })}
              options={[
                { value: 'FINAL', label: 'Final Exam' },
                { value: 'MIDTERM', label: 'Midterm Exam' },
                { value: 'QUIZ', label: 'Quiz' },
                { value: 'ASSIGNMENT', label: 'Assignment' },
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Exam Date *
            </label>
            <Input
              type="date"
              value={formData.exam_date}
              onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Maximum Marks *
            </label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={String(formData.max_marks)}
              onChange={(e) => setFormData({ ...formData, max_marks: Number(e.target.value) })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Registration Opens *
              </label>
              <Input
                type="date"
                value={formData.reg_start_date}
                onChange={(e) => setFormData({ ...formData, reg_start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Registration Closes *
              </label>
              <Input
                type="date"
                value={formData.reg_end_date}
                onChange={(e) => setFormData({ ...formData, reg_end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingExam ? 'Update Exam' : 'Schedule Exam'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title="Delete Exam Event"
        message="Are you sure you want to delete this scheduled exam? Exams with existing student registrations or submitted marks cannot be deleted."
        confirmLabel="Delete Exam"
        isDanger={true}
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
