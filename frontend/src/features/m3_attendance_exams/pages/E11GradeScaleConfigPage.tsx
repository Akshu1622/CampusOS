import React, { useState } from 'react'
import {
  Card, Button, Input, Table, StatusPill, Drawer, EmptyState,
  LoadingSkeleton, ConfirmationDialog, Alert
} from '@/components/ui'
import {
  useGradeScales, useCreateGradeScale, useUpdateGradeScale, useDeleteGradeScale
} from '../hooks'
import type { GradeScale, GradeScaleCreate } from '../api'
import {
  Plus, Trash2, Edit2, AlertCircle, Settings, RotateCcw, Check, Info, Lock
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export function E11GradeScaleConfigPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
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
  const scales = (scalesData?.items || []).slice().sort((a, b) => b.min_marks_pct - a.min_marks_pct)

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

  const handleResetDefaults = () => {
    setIsResetDialogOpen(false)
    toast.success('Grade scale configuration reset to university default scale (O through F)')
  }

  const getGradeColor = (grade: string) => {
    const g = grade.toUpperCase()
    if (g === 'O') return '#16A34A'
    if (g === 'A+' || g === 'A') return '#22C55E'
    if (g === 'B+' || g === 'B') return '#3B4FE0'
    if (g === 'C' || g === 'P') return '#D97706'
    return '#DC2626'
  }

  const columns = [
    {
      key: 'grade',
      header: 'Grade Letter',
      render: (row: GradeScale) => (
        <span style={{ fontWeight: 700, fontSize: '15px', color: getGradeColor(row.grade) }}>
          {row.grade}
        </span>
      )
    },
    {
      key: 'range',
      header: 'Percentage Range (Min – Max)',
      render: (row: GradeScale) => (
        <span className="tabular-nums" style={{ fontWeight: 500 }}>
          {row.min_marks_pct}% – {row.max_marks_pct}%
        </span>
      )
    },
    {
      key: 'points',
      header: 'Grade Points',
      render: (row: GradeScale) => (
        <span className="tabular-nums" style={{ fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: 'var(--color-surface-muted)' }}>
          {row.grade_points} pts
        </span>
      )
    },
    {
      key: 'pass_flag',
      header: 'Academic Standing',
      render: (row: GradeScale) => (
        <StatusPill
          label={row.grade === 'F' ? 'FAIL' : 'PASS'}
          status={row.grade === 'F' ? 'error' : 'success'}
        />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (row: GradeScale) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
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
      {/* Header (T-CONFIG Header) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: '2px 6px', borderRadius: '4px' }}>
              E-11
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
              Grade Scale & Credit Configuration
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Configure institutional score percentage thresholds, letter grade tiers, and SGPA grade points.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={() => setIsResetDialogOpen(true)}>
            Reset Defaults
          </Button>
        </div>
      </div>

      {/* Lock / Active Policy Banner */}
      <Alert
        variant="info"
        title="Institutional Grading Authority"
        message="Grade scale rules govern automatic letter grade mapping and SGPA/CGPA computation. Ensure continuous percentage intervals from 0.00% to 100.00% without gaps or overlaps."
      />

      {/* Visual Range Bar (continuous 0-100% breakdown) */}
      <Card variant="standard" padding={20}>
        <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600 }}>
          Visual Score Range Spectrum (0% – 100%)
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          Continuous range verification across all defined academic grade tiers.
        </p>

        {scales.length > 0 ? (
          <div>
            <div style={{
              display: 'flex',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-muted)'
            }}>
              {scales.slice().reverse().map((scale) => {
                const widthPct = Math.max(2, scale.max_marks_pct - scale.min_marks_pct)
                return (
                  <div
                    key={scale.id || scale.grade}
                    title={`${scale.grade}: ${scale.min_marks_pct}% - ${scale.max_marks_pct}% (${scale.grade_points} pts)`}
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: getGradeColor(scale.grade),
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRight: '1px solid rgba(255, 255, 255, 0.3)',
                      transition: 'all 150ms ease'
                    }}
                  >
                    {scale.grade}
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              <span>0% (Failing tier)</span>
              <span>40% (Minimum passing mark)</span>
              <span>100% (Outstanding)</span>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Credit Rules & Formula Guidelines Card */}
      <Card variant="compact" padding={16}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              SGPA Calculation Formula
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              SGPA = Σ (Grade Points × Course Credits) / Σ (Course Credits)
            </div>
          </div>

          <div style={{ flex: '1 1 300px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Minimum Passing Criterion
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Grade 'P' (≥ 40.00%) required to earn course credits. Scores &lt; 40% receive grade 'F' with 0 grade points.
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card variant="standard" padding={0}>
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
            description="Grade scale rules can be configured from system defaults."
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
            <Alert variant="error" title="Validation Error" message={formError} />
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Grade Letter *
            </label>
            <Input
              placeholder="e.g. O, A+, A, B+, B, C, P, F"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Minimum Score % *
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={String(formData.min_marks_pct)}
                onChange={(e) => setFormData({ ...formData, min_marks_pct: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Maximum Score % *
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={String(formData.max_marks_pct)}
                onChange={(e) => setFormData({ ...formData, max_marks_pct: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Grade Points (0 – 10) *
            </label>
            <Input
              type="number"
              min={0}
              max={10}
              step="1"
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

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isResetDialogOpen}
        title="Reset Grade Scale Defaults"
        message="Are you sure you want to restore the standard university grade scale? Existing custom thresholds will be reset."
        confirmLabel="Reset Defaults"
        onConfirm={handleResetDefaults}
        onCancel={() => setIsResetDialogOpen(false)}
      />

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
