import React, { useState, useEffect } from 'react'
import { Card, StatCard, Button, Table, type Column, Drawer, Input } from '@/components/ui'
import { Plus, Briefcase, Award, Edit2 } from 'lucide-react'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'

interface DesignationRow {
  id: number
  title: string
  job_level: number
}

export const DesignationManagementPage: React.FC = () => {
  const [designations, setDesignations] = useState<DesignationRow[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DesignationRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    jobLevel: 5
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await apiClient<DesignationRow[]>('/designations')
      setDesignations(Array.isArray(res) ? res : [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load designations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({ title: '', jobLevel: 5 })
    setIsDrawerOpen(true)
  }

  const handleOpenEdit = (item: DesignationRow) => {
    setEditingItem(item)
    setFormData({ title: item.title, jobLevel: item.job_level })
    setIsDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    try {
      if (editingItem) {
        await apiClient(`/designations/${editingItem.id}`, {
          method: 'PUT',
          data: {
            title: formData.title.trim(),
            job_level: Number(formData.jobLevel)
          }
        })
        toast.success('Designation updated successfully!')
      } else {
        await apiClient('/designations', {
          method: 'POST',
          data: {
            title: formData.title.trim(),
            job_level: Number(formData.jobLevel)
          }
        })
        toast.success('Designation created successfully!')
      }
      setIsDrawerOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save designation')
    }
  }

  const columns: Column<DesignationRow>[] = [
    {
      header: 'ID',
      key: 'id',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>
          #{r.id}
        </span>
      )
    },
    {
      header: 'Designation Title',
      key: 'title',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'var(--color-chip-people-bg)',
            color: 'var(--color-chip-people-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Briefcase size={14} />
          </div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.title}</div>
        </div>
      )
    },
    {
      header: 'Job Level / Band',
      key: 'job_level',
      render: (r) => (
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'var(--color-surface-subtle)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)'
        }}>
          Level {r.job_level}
        </span>
      )
    },
    {
      header: 'Action',
      key: 'action',
      render: (r) => (
        <Button variant="subtle" size="sm" onClick={() => handleOpenEdit(r)}>
          <Edit2 size={13} />
        </Button>
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
              HR-02
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Designation & Hierarchy Master
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Manage institutional faculty ranks, academic scales, and administrative job roles.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={handleOpenAdd}>
          Add Designation
        </Button>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Designations"
          value={designations.length}
          tone="neutral"
          icon={<Award size={18} />}
          description="Ranks in service hierarchy"
        />
        <StatCard
          label="Highest Band"
          value={designations.length > 0 ? `Level ${Math.max(...designations.map(d => d.job_level))}` : 'None'}
          tone="accent"
          description="Top seniority level"
        />
        <StatCard
          label="Operational Compliance"
          value="100%"
          tone="positive"
          description="UGC / AICTE scale compliant"
        />
      </div>

      {/* Table */}
      <Card padding={0}>
        <Table data={designations} columns={columns} keyExtractor={(r) => String(r.id)} />
      </Card>

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingItem ? 'Edit Designation' : 'Create New Designation'}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save Designation</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Professor, Associate Professor"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Job Level (Rank Number)</label>
            <Input
              type="number"
              value={String(formData.jobLevel)}
              onChange={(e) => setFormData(prev => ({ ...prev, jobLevel: Number(e.target.value) }))}
              placeholder="e.g. 10"
            />
          </div>
        </div>
      </Drawer>
    </div>
  )
}
