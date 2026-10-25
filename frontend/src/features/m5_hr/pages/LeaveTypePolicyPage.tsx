import React, { useState } from 'react'
import { Card, StatCard, Button, Table, type Column, StatusPill, Drawer, Input, Select, Alert } from '@/components/ui'
import { Plus, ShieldCheck, HeartPulse, Clock, Sparkles, Edit2 } from 'lucide-react'

interface LeaveType {
  id: string
  name: string
  code: string
  entitlement: number
  carryForward: string
  applicability: string
  encashable: boolean
  status: 'Active' | 'Inactive'
}

const initialLeaveTypes: LeaveType[] = [
  { id: '1', name: 'Casual Leave (CL)', code: 'CL', entitlement: 12, carryForward: 'No (Lapses on 31 Dec)', applicability: 'All Full-Time Employees', encashable: false, status: 'Active' },
  { id: '2', name: 'Sick Leave (SL)', code: 'SL', entitlement: 10, carryForward: 'Up to 5 Days', applicability: 'All Full-Time Employees', encashable: false, status: 'Active' },
  { id: '3', name: 'Earned / Privilege Leave (EL)', code: 'EL', entitlement: 15, carryForward: 'Up to 60 Days', applicability: 'Confirmed Faculty & Staff', encashable: true, status: 'Active' },
  { id: '4', name: 'Maternity Leave', code: 'ML', entitlement: 180, carryForward: 'Statutory Allowance', applicability: 'Female Staff (Per Rules)', encashable: false, status: 'Active' },
  { id: '5', name: 'Academic Duty Leave', code: 'DL', entitlement: 14, carryForward: 'No (Per Academic Year)', applicability: 'Teaching Faculty', encashable: false, status: 'Active' },
]

export const LeaveTypePolicyPage: React.FC = () => {
  const [types, setTypes] = useState<LeaveType[]>(initialLeaveTypes)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LeaveType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    entitlement: 12,
    carryForward: 'No',
    applicability: 'All Full-Time Employees',
    encashable: false
  })

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({ name: '', code: '', entitlement: 12, carryForward: 'No', applicability: 'All Full-Time Employees', encashable: false })
    setIsDrawerOpen(true)
  }

  const handleOpenEdit = (item: LeaveType) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      code: item.code,
      entitlement: item.entitlement,
      carryForward: item.carryForward,
      applicability: item.applicability,
      encashable: item.encashable
    })
    setIsDrawerOpen(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.code) return
    if (editingItem) {
      setTypes(prev => prev.map(t => t.id === editingItem.id ? { ...t, ...formData } : t))
    } else {
      const newItem: LeaveType = {
        id: String(types.length + 1),
        ...formData,
        status: 'Active'
      }
      setTypes(prev => [...prev, newItem])
    }
    setIsDrawerOpen(false)
  }

  const columns: Column<LeaveType>[] = [
    {
      header: 'Leave Policy Name',
      key: 'name',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.name}</div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>Code: {r.code}</div>
        </div>
      )
    },
    {
      header: 'Annual Entitlement',
      key: 'entitlement',
      render: (r) => (
        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
          {r.entitlement} Days / Yr
        </span>
      )
    },
    {
      header: 'Carry Forward Rules',
      key: 'carryForward',
      render: (r) => <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{r.carryForward}</span>
    },
    {
      header: 'Applicable Cohort',
      key: 'applicability',
      render: (r) => (
        <span style={{
          fontSize: '12px',
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'var(--color-surface-subtle)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)'
        }}>
          {r.applicability}
        </span>
      )
    },
    {
      header: 'Encashment',
      key: 'encashable',
      render: (r) => (
        <StatusPill
          label={r.encashable ? 'Encashable' : 'Non-Encashable'}
          status={r.encashable ? 'success' : 'neutral'}
        />
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
              HR-03
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Leave Types & Statutory Policy Master
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Configure annual faculty quotas, maternity rights, encashment parameters, and carry-forward rules.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={handleOpenAdd}>
          Configure New Leave Type
        </Button>
      </div>

      <Alert variant="info" title="Automatic Annual Credit">
        Statutory leave quotas are automatically credited on 1st January of each calendar year. Balances are derived dynamically in real-time as applications are sanctioned.
      </Alert>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Active Policies"
          value={types.length}
          tone="positive"
          icon={<ShieldCheck size={18} />}
          description="Institutional categories"
        />
        <StatCard
          label="Casual Quota (CL)"
          value="12 Days"
          tone="accent"
          icon={<Clock size={18} />}
          description="Lapses every 12 months"
        />
        <StatCard
          label="Sick Quota (SL)"
          value="10 Days"
          tone="neutral"
          icon={<HeartPulse size={18} />}
          description="Requires medical slip >2d"
        />
        <StatCard
          label="Earned Quota (EL)"
          value="15 Days"
          tone="positive"
          icon={<Sparkles size={18} />}
          description="Cumulative & encashable"
        />
      </div>

      {/* Table */}
      <Card padding={0}>
        <Table data={types} columns={columns} keyExtractor={(r) => r.id} />
      </Card>

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingItem ? 'Edit Leave Policy' : 'Create Leave Policy'}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save Policy</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Policy Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Sabbatical Research Leave"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Short Code</label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="e.g. SRL"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Annual Days Allowance</label>
            <Input
              type="number"
              value={formData.entitlement}
              onChange={(e) => setFormData(prev => ({ ...prev, entitlement: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Carry-Forward Clause</label>
            <Input
              value={formData.carryForward}
              onChange={(e) => setFormData(prev => ({ ...prev, carryForward: e.target.value }))}
              placeholder="e.g. Up to 10 days"
            />
          </div>
        </div>
      </Drawer>
    </div>
  )
}
