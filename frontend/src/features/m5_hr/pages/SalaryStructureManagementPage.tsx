import React, { useState } from 'react'
import { Card, StatCard, Button, Table, type Column, StatusPill, Drawer, Input, Select } from '@/components/ui'
import { Plus, DollarSign, Wallet, ShieldCheck, Edit2, CheckCircle } from 'lucide-react'

interface SalaryStructure {
  id: string
  name: string
  code: string
  basicPay: number
  hra: number
  da: number
  specialAllowance: number
  pf: number
  tdsEstimated: number
  gross: number
  net: number
  status: 'Active' | 'Inactive'
}

const initialStructures: SalaryStructure[] = [
  {
    id: '1',
    name: 'Senior Professor (Level 14A)',
    code: 'SS-PROF-14A',
    basicPay: 90000,
    hra: 36000,
    da: 30000,
    specialAllowance: 19000,
    pf: 18000,
    tdsEstimated: 15000,
    gross: 175000,
    net: 142000,
    status: 'Active'
  },
  {
    id: '2',
    name: 'Associate Professor (Level 13A)',
    code: 'SS-ASSC-13A',
    basicPay: 75000,
    hra: 30000,
    da: 25000,
    specialAllowance: 20000,
    pf: 15000,
    tdsEstimated: 12000,
    gross: 150000,
    net: 123000,
    status: 'Active'
  },
  {
    id: '3',
    name: 'Assistant Professor (Level 10)',
    code: 'SS-ASST-10',
    basicPay: 57700,
    hra: 23080,
    da: 19618,
    specialAllowance: 9602,
    pf: 11540,
    tdsEstimated: 8460,
    gross: 110000,
    net: 90000,
    status: 'Active'
  },
]

export const SalaryStructureManagementPage: React.FC = () => {
  const [structures, setStructures] = useState<SalaryStructure[]>(initialStructures)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SalaryStructure | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    basicPay: 60000,
    hra: 24000,
    da: 20000,
    specialAllowance: 16000,
    pf: 12000,
    tdsEstimated: 8000
  })

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      code: '',
      basicPay: 60000,
      hra: 24000,
      da: 20000,
      specialAllowance: 16000,
      pf: 12000,
      tdsEstimated: 8000
    })
    setIsDrawerOpen(true)
  }

  const handleOpenEdit = (item: SalaryStructure) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      code: item.code,
      basicPay: item.basicPay,
      hra: item.hra,
      da: item.da,
      specialAllowance: item.specialAllowance,
      pf: item.pf,
      tdsEstimated: item.tdsEstimated
    })
    setIsDrawerOpen(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.code) return
    const gross = formData.basicPay + formData.hra + formData.da + formData.specialAllowance
    const net = gross - (formData.pf + formData.tdsEstimated)

    if (editingItem) {
      setStructures(prev => prev.map(s => s.id === editingItem.id ? { ...s, ...formData, gross, net } : s))
    } else {
      const newItem: SalaryStructure = {
        id: String(structures.length + 1),
        ...formData,
        gross,
        net,
        status: 'Active'
      }
      setStructures(prev => [...prev, newItem])
    }
    setIsDrawerOpen(false)
  }

  const columns: Column<SalaryStructure>[] = [
    {
      header: 'Structure Title',
      key: 'name',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.name}</div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{r.code}</div>
        </div>
      )
    },
    {
      header: 'Basic Pay',
      key: 'basicPay',
      render: (r) => <span style={{ fontWeight: 600 }}>₹{r.basicPay.toLocaleString()}</span>
    },
    {
      header: 'Gross Compensation',
      key: 'gross',
      render: (r) => (
        <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
          ₹{r.gross.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Statutory Deductions',
      key: 'pf',
      render: (r) => (
        <span style={{ fontSize: '13px', color: 'var(--color-error)', fontWeight: 600 }}>
          ₹{(r.pf + r.tdsEstimated).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Est. Net Take-Home',
      key: 'net',
      render: (r) => (
        <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
          ₹{r.net.toLocaleString()}
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
              HR-01
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Salary Structure Configuration Master
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Configure basic pay slabs, HRA percentages, dearness allowance, and provident fund rules.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={handleOpenAdd}>
          Create Structure
        </Button>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Active Structures"
          value={structures.length}
          tone="positive"
          icon={<ShieldCheck size={18} />}
          description="Across university cadres"
        />
        <StatCard
          label="Average Faculty Gross"
          value="₹1.45L"
          tone="accent"
          icon={<DollarSign size={18} />}
          description="Monthly basic + allowances"
        />
        <StatCard
          label="Standard EPF Contribution"
          value="12%"
          tone="neutral"
          icon={<Wallet size={18} />}
          description="Of basic component"
        />
        <StatCard
          label="Tax Compliance"
          value="Section 192"
          tone="positive"
          icon={<CheckCircle size={18} />}
          description="Old/New regime support"
        />
      </div>

      {/* Table */}
      <Card padding={0}>
        <Table data={structures} columns={columns} keyExtractor={(r) => r.id} />
      </Card>

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingItem ? 'Edit Salary Structure' : 'Create Salary Structure'}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save Structure</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Structure Title</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Senior Research Scientist"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Scale Code</label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="e.g. SS-SRS-12"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Basic Pay (₹)</label>
              <Input
                type="number"
                value={formData.basicPay}
                onChange={(e) => setFormData(prev => ({ ...prev, basicPay: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>HRA (₹)</label>
              <Input
                type="number"
                value={formData.hra}
                onChange={(e) => setFormData(prev => ({ ...prev, hra: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Dearness Allowance (DA)</label>
              <Input
                type="number"
                value={formData.da}
                onChange={(e) => setFormData(prev => ({ ...prev, da: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Special Allowance</label>
              <Input
                type="number"
                value={formData.specialAllowance}
                onChange={(e) => setFormData(prev => ({ ...prev, specialAllowance: Number(e.target.value) }))}
              />
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
