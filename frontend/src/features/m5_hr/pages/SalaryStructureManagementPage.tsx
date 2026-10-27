import React, { useState, useEffect } from 'react'
import { Card, StatCard, Button, Table, type Column, Drawer, Input, Select, StatusPill } from '@/components/ui'
import { Plus, DollarSign, Wallet, ShieldCheck, Edit2, CheckCircle, TrendingUp } from 'lucide-react'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'

interface SalaryStructure {
  id: number
  designation_id: number
  basic_pay: number
  allowances: number
  standard_deductions: number
}

interface Designation {
  id: number
  title: string
  job_level: number
}

export const SalaryStructureManagementPage: React.FC = () => {
  const [structures, setStructures] = useState<SalaryStructure[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [loading, setLoading] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SalaryStructure | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    designation_id: '',
    basic_pay: 50000,
    allowances: 15000,
    standard_deductions: 8000
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [structRes, desigRes] = await Promise.all([
        apiClient<SalaryStructure[]>('/salary-structures'),
        apiClient<Designation[]>('/designations')
      ])
      setStructures(Array.isArray(structRes) ? structRes : [])
      setDesignations(Array.isArray(desigRes) ? desigRes : [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load salary structures')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getDesignation = (id: number) => {
    return designations.find(d => d.id === id)
  }

  const handleOpenAdd = () => {
    setEditingItem(null)
    // Find first designation that doesn't have a structure yet
    const usedIds = new Set(structures.map(s => s.designation_id))
    const availableDesig = designations.find(d => !usedIds.has(d.id))
    setFormData({
      designation_id: availableDesig ? String(availableDesig.id) : (designations[0] ? String(designations[0].id) : ''),
      basic_pay: 60000,
      allowances: 20000,
      standard_deductions: 8000
    })
    setIsDrawerOpen(true)
  }

  const handleOpenEdit = (item: SalaryStructure) => {
    setEditingItem(item)
    setFormData({
      designation_id: String(item.designation_id),
      basic_pay: item.basic_pay,
      allowances: item.allowances,
      standard_deductions: item.standard_deductions
    })
    setIsDrawerOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.designation_id && !editingItem) {
      toast.error('Please select a designation')
      return
    }
    if (formData.basic_pay < 0 || formData.allowances < 0 || formData.standard_deductions < 0) {
      toast.error('Amounts cannot be negative')
      return
    }

    setSaving(true)
    try {
      if (editingItem) {
        await apiClient(`/salary-structures/${editingItem.id}`, {
          method: 'PUT',
          data: {
            basic_pay: Number(formData.basic_pay),
            allowances: Number(formData.allowances),
            standard_deductions: Number(formData.standard_deductions)
          }
        })
        toast.success('Salary structure updated successfully')
      } else {
        await apiClient('/salary-structures', {
          method: 'POST',
          data: {
            designation_id: Number(formData.designation_id),
            basic_pay: Number(formData.basic_pay),
            allowances: Number(formData.allowances),
            standard_deductions: Number(formData.standard_deductions)
          }
        })
        toast.success('Salary structure created successfully')
      }
      setIsDrawerOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save salary structure')
    } finally {
      setSaving(false)
    }
  }

  const grossCalc = Number(formData.basic_pay || 0) + Number(formData.allowances || 0)
  const netCalc = Math.max(0, grossCalc - Number(formData.standard_deductions || 0))

  const totalStructures = structures.length
  const avgGross = totalStructures > 0
    ? Math.round(structures.reduce((acc, s) => acc + (s.basic_pay + s.allowances), 0) / totalStructures)
    : 0
  const avgDeductions = totalStructures > 0
    ? Math.round(structures.reduce((acc, s) => acc + s.standard_deductions, 0) / totalStructures)
    : 0
  const totalCommitment = structures.reduce((acc, s) => acc + (s.basic_pay + s.allowances), 0)

  const columns: Column<SalaryStructure>[] = [
    {
      header: 'Designation / Cadre',
      key: 'designation_id',
      render: (r) => {
        const desig = getDesignation(r.designation_id)
        return (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {desig ? desig.title : `Designation #${r.designation_id}`}
            </div>
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
              Job Level {desig ? desig.job_level : '—'}
            </div>
          </div>
        )
      }
    },
    {
      header: 'Basic Pay',
      key: 'basic_pay',
      render: (r) => <span style={{ fontWeight: 600 }}>₹{Number(r.basic_pay).toLocaleString()}</span>
    },
    {
      header: 'Allowances (HRA/DA/Special)',
      key: 'allowances',
      render: (r) => (
        <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          ₹{Number(r.allowances).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Gross Compensation',
      key: 'id',
      render: (r) => (
        <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
          ₹{(Number(r.basic_pay) + Number(r.allowances)).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Standard Deductions',
      key: 'standard_deductions',
      render: (r) => (
        <span style={{ fontSize: '13px', color: 'var(--color-error)', fontWeight: 600 }}>
          -₹{Number(r.standard_deductions).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Net Take-Home',
      key: 'id',
      render: (r) => {
        const gross = Number(r.basic_pay) + Number(r.allowances)
        const net = Math.max(0, gross - Number(r.standard_deductions))
        return (
          <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
            ₹{net.toLocaleString()}
          </span>
        )
      }
    },
    {
      header: 'Action',
      key: 'id',
      render: (r) => (
        <Button variant="subtle" size="sm" onClick={() => handleOpenEdit(r)}>
          <Edit2 size={13} style={{ marginRight: '4px' }} /> Edit
        </Button>
      )
    }
  ]

  const usedDesignationIds = new Set(structures.map(s => s.designation_id))

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
            Configure basic pay slabs, dearness allowance, HRA, and standard statutory deduction profiles per cadre.
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
          value={totalStructures}
          tone="positive"
          icon={<ShieldCheck size={18} />}
          description="Across designated cadres"
        />
        <StatCard
          label="Average Cadre Gross"
          value={`₹${avgGross.toLocaleString()}`}
          tone="accent"
          icon={<DollarSign size={18} />}
          description="Monthly basic + allowances"
        />
        <StatCard
          label="Average Deductions"
          value={`₹${avgDeductions.toLocaleString()}`}
          tone="neutral"
          icon={<Wallet size={18} />}
          description="Statutory EPF & TDS profile"
        />
        <StatCard
          label="Monthly Scale Outlay"
          value={`₹${totalCommitment.toLocaleString()}`}
          tone="positive"
          icon={<TrendingUp size={18} />}
          description="Aggregate across scales"
        />
      </div>

      {/* Table */}
      <Card padding={0}>
        <Table data={structures} columns={columns} keyExtractor={(r) => String(r.id)} isLoading={loading} />
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
            <Button variant="primary" onClick={handleSave} isLoading={saving}>
              {editingItem ? 'Update Structure' : 'Save Structure'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              Designation / Cadre <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            {editingItem ? (
              <Input
                value={getDesignation(editingItem.designation_id)?.title || `Cadre #${editingItem.designation_id}`}
                disabled
              />
            ) : (
              <Select
                value={formData.designation_id}
                onChange={(e) => setFormData(prev => ({ ...prev, designation_id: e.target.value }))}
                options={designations.map(d => ({
                  value: String(d.id),
                  label: `${d.title} (Level ${d.job_level})${usedDesignationIds.has(d.id) ? ' [Already Configured]' : ''}`
                }))}
              />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                Basic Pay (₹) <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <Input
                type="number"
                min="0"
                value={formData.basic_pay}
                onChange={(e) => setFormData(prev => ({ ...prev, basic_pay: Number(e.target.value) }))}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                Allowances (₹) <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <Input
                type="number"
                min="0"
                value={formData.allowances}
                onChange={(e) => setFormData(prev => ({ ...prev, allowances: Number(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              Standard Deductions (₹) <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <Input
              type="number"
              min="0"
              value={formData.standard_deductions}
              onChange={(e) => setFormData(prev => ({ ...prev, standard_deductions: Number(e.target.value) }))}
              required
            />
          </div>

          {/* Live Preview Box */}
          <div style={{
            padding: '14px',
            borderRadius: '8px',
            background: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '13px'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Calculated Projections:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Gross Monthly:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>₹{grossCalc.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Total Deductions:</span>
              <strong style={{ color: 'var(--color-error)' }}>-₹{Number(formData.standard_deductions || 0).toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '6px' }}>
              <span style={{ fontWeight: 600 }}>Est. Net Take-Home:</span>
              <strong style={{ color: 'var(--color-success)', fontSize: '15px' }}>₹{netCalc.toLocaleString()}</strong>
            </div>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
