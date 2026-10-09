import React, { useState } from 'react'
import {
  Card, Button, Input, Table, StatusPill, Drawer, EmptyState,
  LoadingSkeleton, ConfirmationDialog
} from '@/components/ui'
import {
  useGradeScales, useCreateGradeScale, useUpdateGradeScale, useDeleteGradeScale
} from '../hooks'
import type { GradeScale, GradeScaleCreate } from '../api'
import {
  Plus, Trash2, Edit2, AlertCircle, Settings
} from 'lucide-react'

export function E11GradeScaleConfigPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingScale, setEditingScale] = useState<GradeScale | null>(null)
  const [formData, setFormData] = useState<GradeScaleCreate>({
    grade: 'A',
    min_marks_pct: 80,
    max_marks_pct: 100,
    grade_points: 10,
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GradeScale | null>(null)

  const { data: scalesData, isLoading, error } = useGradeScales({ page_size: 50 })
  const scales = scalesData?.items || []

  const createMutation = useCreateGradeScale()
  const updateMutation = useUpdateGradeScale()
  const deleteMutation = useDeleteGradeScale()

  const handleOpenAdd = () => {
    setEditingScale(null)
    setFormData({
      grade: '',
      min_marks_pct: 0,
      max_marks_pct: 100,
      grade_points: 0,
    })
    setFormError(null)
    setIsDrawerOpen(true)
  }

  const handleOpenEdit = (scale: GradeScale) => {
    setEditingScale(scale)
    setFormData({
      grade: scale.grade,
      min_marks_pct: scale.min_marks_pct,
      max_marks_pct: scale.max_marks_pct,
      grade_points: scale.grade_points,
    })
    setFormError(null)
    setIsDrawerOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.grade.trim()) {
      setFormError('Grade letter is required.')
      return
    }

    if (formData.min_marks_pct >= formData.max_marks_pct) {
      setFormError('Minimum marks percentage must be strictly less than maximum percentage.')
      return
    }

    try {
      if (editingScale) {
        await updateMutation.mutateAsync({
          id: editingScale.id,
          data: {
            grade: formData.grade.trim().toUpperCase(),
            min_marks_pct: Number(formData.min_marks_pct),
            max_marks_pct: Number(formData.max_marks_pct),
            grade_points: Number(formData.grade_points),
          }
        })
      } else {
        await createMutation.mutateAsync({
          grade: formData.grade.trim().toUpperCase(),
          min_marks_pct: Number(formData.min_marks_pct),
          max_marks_pct: Number(formData.max_marks_pct),
          grade_points: Number(formData.grade_points),
        })
      }
      setIsDrawerOpen(false)
    } catch (err: any) {
      setFormError(err.message || 'Failed to save grade scale configuration.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      // toast shown in mutation
    }
  }

  const columns = [
    {
      key: 'grade',
      header: 'Grade Letter',
      render: (row: GradeScale) => (
        <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-primary)' }}>
          {row.grade}
        </span>
      )
    },
    {
      key: 'range',
      header: 'Score Percentage Range',
      render: (row: GradeScale) => (
        <span style={{ fontWeight: 500 }}>
          {row.min_marks_pct}% – {row.max_marks_pct}%
        </span>
      )
    },
    {
      key: 'points',
      header: 'Grade Points',
      render: (row: GradeScale) => (
        <span style={{ fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: 'var(--color-surface-subtle)' }}>
          {row.grade_points}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: GradeScale) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            title="Edit Grade Scale"
          >
            <Edit2 size={14} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteTarget(row)}
            title="Delete Grade Rule"
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
              E-11
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Grade Scale & Credit Configuration
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Configure percentage ranges, letter grades, and grade point conversion factors.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenAdd}>
          Add Grade Rule
        </Button>
      </div>

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
            <div>Failed to load grade scales.</div>
          </div>
        ) : scales.length === 0 ? (
          <EmptyState
            icon={<Settings size={36} />}
            title="No grade scale rules configured"
            description="Add grade scale rules to enable automatic grading."
            action={<Button variant="primary" onClick={handleOpenAdd}>Add Grade Rule</Button>}
          />
        ) : (
          <Table
            columns={columns}
            data={scales}
          />
        )}
      </Card>

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingScale ? `Edit Grade Rule: ${editingScale.grade}` : 'Add Grade Scale Rule'}
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
              Grade Letter *
            </label>
            <Input
              placeholder="e.g. A+, A, B, C, F"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Minimum Score % *
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={String(formData.min_marks_pct)}
                onChange={(e) => setFormData({ ...formData, min_marks_pct: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Maximum Score % *
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={String(formData.max_marks_pct)}
                onChange={(e) => setFormData({ ...formData, max_marks_pct: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Grade Points *
            </label>
            <Input
              type="number"
              min={0}
              max={10}
              step="0.1"
              value={String(formData.grade_points)}
              onChange={(e) => setFormData({ ...formData, grade_points: Number(e.target.value) })}
              required
            />
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
                : editingScale ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title="Delete Grade Scale Rule"
        message={`Are you sure you want to delete grade rule ${deleteTarget?.grade} (${deleteTarget?.min_marks_pct}% - ${deleteTarget?.max_marks_pct}%)?`}
        confirmLabel="Delete Rule"
        isDanger={true}
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
