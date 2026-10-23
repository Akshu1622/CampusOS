import React, { useState } from 'react'
import { Card, Table, type Column, Button, Alert, StatCard, StatusPill, Drawer, Input, Select } from '@/components/ui'
import { CreditCard, Plus, FileText, CheckCircle2, MoreHorizontal, Download, Layers } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface FeeStructure {
  id: string
  program: string
  term: string
  componentsCount: number
  total: number
  dueDate: string
  version: string
  status: 'Active' | 'Draft' | 'Archived'
}

export const FeeStructureManagementPage: React.FC = () => {
  const [structures, setStructures] = useState<FeeStructure[]>([
    {
      id: 'FS01',
      program: 'B.Tech Computer Science',
      term: 'Spring 2024',
      componentsCount: 4,
      total: 55000,
      dueDate: '2024-02-15',
      version: 'v1.0',
      status: 'Active',
    },
    {
      id: 'FS02',
      program: 'B.Tech Electrical Engineering',
      term: 'Spring 2024',
      componentsCount: 4,
      total: 52000,
      dueDate: '2024-02-15',
      version: 'v1.0',
      status: 'Active',
    },
    {
      id: 'FS03',
      program: 'B.Tech Mechanical Engineering',
      term: 'Spring 2024',
      componentsCount: 3,
      total: 48000,
      dueDate: '2024-02-15',
      version: 'v1.0',
      status: 'Active',
    },
    {
      id: 'FS04',
      program: 'Master in Computer Applications',
      term: 'Spring 2024',
      componentsCount: 3,
      total: 62000,
      dueDate: '2024-02-20',
      version: 'v1.0',
      status: 'Draft',
    }
  ])

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [formData, setFormData] = useState({
    program: 'B.Tech Computer Science',
    term: 'Spring 2024',
    tuition: '45000',
    lab: '6000',
    library: '2000',
    dueDate: '2024-02-15'
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const total = Number(formData.tuition || 0) + Number(formData.lab || 0) + Number(formData.library || 0)
    const newFs: FeeStructure = {
      id: `FS0${structures.length + 1}`,
      program: formData.program,
      term: formData.term,
      componentsCount: 3,
      total,
      dueDate: formData.dueDate,
      version: 'v1.0',
      status: 'Active'
    }
    setStructures(prev => [newFs, ...prev])
    setIsDrawerOpen(false)
    toast.success('Fee structure created successfully!')
  }

  const columns: Column<FeeStructure>[] = [
    {
      header: 'Structure ID',
      key: 'id',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)', fontSize: '13px' }}>
          {r.id}
        </span>
      )
    },
    {
      header: 'Academic Program',
      key: 'program',
      render: (r) => (
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13.5px' }}>
          {r.program}
        </span>
      )
    },
    {
      header: 'Term',
      key: 'term',
      render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.term}</span>
    },
    {
      header: 'Components',
      key: 'componentsCount',
      render: (r) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-muted)', fontSize: '13px' }}>
          {r.componentsCount} line items
        </span>
      )
    },
    {
      header: 'Total Assessed',
      key: 'total',
      render: (r) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          ₹{r.total.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Payment Deadline',
      key: 'dueDate',
      render: (r) => <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>{r.dueDate}</span>
    },
    {
      header: 'Version',
      key: 'version',
      render: (r) => (
        <span style={{ fontSize: '11.5px', background: 'var(--color-surface-muted)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
          {r.version}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (r) => (
        <StatusPill
          label={r.status}
          status={r.status === 'Active' ? 'success' : r.status === 'Draft' ? 'warning' : 'neutral'}
        />
      )
    },
    {
      header: '',
      key: 'id',
      render: () => (
        <Button variant="subtle" size="sm" onClick={() => toast.success('Viewing fee structure details')}>
          <MoreHorizontal size={16} />
        </Button>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: '2px 8px', borderRadius: '4px' }}>
              M4 · Finance
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>
              Fee Structure Configurations
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Define semester fee components, tuition amounts, and official collection deadlines per program.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" icon={<Download size={16} />} onClick={() => toast.success('Exporting fee structure CSV...')}>
            Export
          </Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>
            Create Fee Structure
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Active Structures"
          value={structures.filter(s => s.status === 'Active').length}
          icon={<CreditCard size={20} />}
          moduleColor="finance"
          supportText="Configured programs"
        />
        <StatCard
          label="Draft Structures"
          value={structures.filter(s => s.status === 'Draft').length}
          icon={<FileText size={20} />}
          moduleColor="exams"
          supportText="Under administrator review"
          supportColor="neutral"
        />
        <StatCard
          label="Active Academic Term"
          value="Spring 2024"
          icon={<CheckCircle2 size={20} />}
          moduleColor="people"
          supportText="Effective for all batches"
          supportColor="success"
        />
      </div>

      {/* Main Table */}
      <Card padding={0}>
        <Table columns={columns} data={structures} />
      </Card>

      {/* Add Structure Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Create Fee Structure"
        size="md"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Select
            label="Degree Program"
            value={formData.program}
            options={[
              { label: 'B.Tech Computer Science', value: 'B.Tech Computer Science' },
              { label: 'B.Tech Electrical Engineering', value: 'B.Tech Electrical Engineering' },
              { label: 'B.Tech Mechanical Engineering', value: 'B.Tech Mechanical Engineering' },
              { label: 'B.Tech Civil Engineering', value: 'B.Tech Civil Engineering' },
              { label: 'Master in Computer Applications', value: 'Master in Computer Applications' }
            ]}
            onChange={(e) => setFormData({ ...formData, program: e.target.value })}
            required
          />

          <Input
            label="Academic Term"
            value={formData.term}
            onChange={(e) => setFormData({ ...formData, term: e.target.value })}
            required
          />

          <div style={{ height: '1px', background: 'var(--color-border)', margin: '4px 0' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Fee Components</span>

          <Input
            label="Tuition Fee (₹)"
            type="number"
            value={formData.tuition}
            onChange={(e) => setFormData({ ...formData, tuition: e.target.value })}
            required
          />

          <Input
            label="Laboratory & Practical Fee (₹)"
            type="number"
            value={formData.lab}
            onChange={(e) => setFormData({ ...formData, lab: e.target.value })}
            required
          />

          <Input
            label="Library & Digital Subscription (₹)"
            type="number"
            value={formData.library}
            onChange={(e) => setFormData({ ...formData, library: e.target.value })}
            required
          />

          <Input
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="secondary" type="button" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Fee Structure
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
