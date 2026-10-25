import React, { useState } from 'react'
import { Card, StatCard, Button, Table, type Column, StatusPill, Drawer, Input, Select } from '@/components/ui'
import { Plus, Briefcase, Award, Users, CheckCircle, Edit2 } from 'lucide-react'

interface Designation {
  id: string
  title: string
  code: string
  level: string
  cadre: 'Teaching' | 'Non-Teaching' | 'Administrative'
  employees: number
  status: 'Active' | 'Inactive'
}

const initialDesignations: Designation[] = [
  { id: '1', title: 'Professor & Chair', code: 'DES-PROF', level: 'Level 14A', cadre: 'Teaching', employees: 12, status: 'Active' },
  { id: '2', title: 'Associate Professor', code: 'DES-ASSC', level: 'Level 13A', cadre: 'Teaching', employees: 25, status: 'Active' },
  { id: '3', title: 'Assistant Professor', code: 'DES-ASST', level: 'Level 10', cadre: 'Teaching', employees: 40, status: 'Active' },
  { id: '4', title: 'Head of Laboratory Instruction', code: 'DES-HLAB', level: 'Level 9', cadre: 'Non-Teaching', employees: 8, status: 'Active' },
  { id: '5', title: 'Chief Human Resources Officer', code: 'DES-CHRO', level: 'Level 12', cadre: 'Administrative', employees: 2, status: 'Active' },
]

export const DesignationManagementPage: React.FC = () => {
  const [designations, setDesignations] = useState<Designation[]>(initialDesignations)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Designation | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    level: 'Level 10',
    cadre: 'Teaching' as Designation['cadre']
  })

  const totalEmployees = designations.reduce((sum, d) => sum + d.employees, 0)

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({ title: '', code: '', level: 'Level 10', cadre: 'Teaching' })
    setIsDrawerOpen(true)
  }

  const handleOpenEdit = (item: Designation) => {
    setEditingItem(item)
    setFormData({ title: item.title, code: item.code, level: item.level, cadre: item.cadre })
    setIsDrawerOpen(true)
  }

  const handleSave = () => {
    if (!formData.title || !formData.code) return
    if (editingItem) {
      setDesignations(prev => prev.map(d => d.id === editingItem.id ? { ...d, ...formData } : d))
    } else {
      const newItem: Designation = {
        id: String(designations.length + 1),
        ...formData,
        employees: 0,
        status: 'Active'
      }
      setDesignations(prev => [...prev, newItem])
    }
    setIsDrawerOpen(false)
  }

  const columns: Column<Designation>[] = [
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
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.title}</div>
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{r.code}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Pay Band / Level',
      key: 'level',
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
          {r.level}
        </span>
      )
    },
    { header: 'Cadre', key: 'cadre', render: (r) => <span style={{ fontWeight: 500 }}>{r.cadre}</span> },
    {
      header: 'Occupied Seats',
      key: 'employees',
      render: (r) => (
        <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
          {r.employees} Staff
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (r) => (
        <StatusPill label={r.status} status={r.status === 'Active' ? 'success' : 'neutral'} />
      )
    },
    {
      header: 'Action',
      key: 'id',
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
          label="Active Staff Count"
          value={totalEmployees}
          tone="positive"
          icon={<Users size={18} />}
          description="Mapped across departments"
        />
        <StatCard
          label="Academic Cadre"
          value={designations.filter(d => d.cadre === 'Teaching').length}
          tone="accent"
          description="Professors & Instructors"
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
        <Table data={designations} columns={columns} keyExtractor={(r) => r.id} />
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
              placeholder="e.g. Associate Dean of Research"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Code</label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="e.g. DES-ADEAN"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Cadre</label>
            <Select
              value={formData.cadre}
              onChange={(e) => setFormData(prev => ({ ...prev, cadre: e.target.value as any }))}
              options={[
                { value: 'Teaching', label: 'Teaching Cadre' },
                { value: 'Non-Teaching', label: 'Non-Teaching / Technical' },
                { value: 'Administrative', label: 'Administrative Officer' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Salary Scale Band</label>
            <Input
              value={formData.level}
              onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
              placeholder="e.g. Level 13A"
            />
          </div>
        </div>
      </Drawer>
    </div>
  )
}
