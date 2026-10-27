import React, { useState, useEffect } from 'react'
import { Card, StatCard, Button, Table, type Column, StatusPill, Drawer, Input, Select } from '@/components/ui'
import { Plus, HeartPulse, Clock, Sparkles } from 'lucide-react'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'

interface CombinedPolicyRow {
  id: number
  name: string
  is_paid: boolean
  faculty_quota: number
  staff_quota: number
  carry_forward: boolean
}

export const LeaveTypePolicyPage: React.FC = () => {
  const [policies, setPolicies] = useState<CombinedPolicyRow[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    isPaid: true,
    facultyQuota: 12,
    staffQuota: 15,
    carryForward: false
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [typesRes, entRes] = await Promise.all([
        apiClient<any[]>('/leave-types'),
        apiClient<any[]>('/leave-entitlements')
      ])

      const types = Array.isArray(typesRes) ? typesRes : []
      const entitlements = Array.isArray(entRes) ? entRes : []

      const combined: CombinedPolicyRow[] = types.map(t => {
        const facEnt = entitlements.find(e => e.leave_type_id === t.id && e.emp_type === 'FACULTY')
        const staffEnt = entitlements.find(e => e.leave_type_id === t.id && e.emp_type === 'STAFF')
        return {
          id: t.id,
          name: t.name,
          is_paid: t.is_paid,
          faculty_quota: facEnt ? facEnt.annual_quota : 0,
          staff_quota: staffEnt ? staffEnt.annual_quota : 0,
          carry_forward: (facEnt && facEnt.carry_forward) || (staffEnt && staffEnt.carry_forward) || false
        }
      })
      setPolicies(combined)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load leave types & policies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Leave type name is required')
      return
    }

    try {
      // 1. Create leave type
      const lt = await apiClient<any>('/leave-types', {
        method: 'POST',
        data: {
          name: formData.name.trim(),
          is_paid: formData.isPaid
        }
      })

      const ltId = lt?.id
      if (ltId) {
        // 2. Set Faculty quota
        await apiClient('/leave-entitlements', {
          method: 'POST',
          data: {
            leave_type_id: ltId,
            emp_type: 'FACULTY',
            annual_quota: Number(formData.facultyQuota),
            carry_forward: formData.carryForward
          }
        })
        // 3. Set Staff quota
        await apiClient('/leave-entitlements', {
          method: 'POST',
          data: {
            leave_type_id: ltId,
            emp_type: 'STAFF',
            annual_quota: Number(formData.staffQuota),
            carry_forward: formData.carryForward
          }
        })
      }

      toast.success('Leave policy configured successfully!')
      setIsDrawerOpen(false)
      setFormData({
        name: '',
        isPaid: true,
        facultyQuota: 12,
        staffQuota: 15,
        carryForward: false
      })
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save leave policy')
    }
  }

  const columns: Column<CombinedPolicyRow>[] = [
    {
      header: 'Leave Type Name',
      key: 'name',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.name}</div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>ID: #{r.id}</div>
        </div>
      )
    },
    {
      header: 'Compensation',
      key: 'is_paid',
      render: (r) => (
        <StatusPill
          label={r.is_paid ? 'Paid Leave' : 'Unpaid (LOP)'}
          status={r.is_paid ? 'success' : 'warning'}
        />
      )
    },
    {
      header: 'Faculty Annual Quota',
      key: 'faculty_quota',
      render: (r) => (
        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
          {r.faculty_quota} Days / Yr
        </span>
      )
    },
    {
      header: 'Staff Annual Quota',
      key: 'staff_quota',
      render: (r) => (
        <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {r.staff_quota} Days / Yr
        </span>
      )
    },
    {
      header: 'Carry Forward',
      key: 'carry_forward',
      render: (r) => (
        <span style={{ fontSize: '13px', color: r.carry_forward ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
          {r.carry_forward ? 'Allowed' : 'Lapses at Year-End'}
        </span>
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
              Leave Types & Annual Policy Rules
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Configure institutional leave categories, annual day allowances, carry-forward policies, and encashment terms.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>
          New Leave Policy
        </Button>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Defined Leave Types"
          value={policies.length}
          tone="neutral"
          icon={<HeartPulse size={18} />}
          description="Active institutional policies"
        />
        <StatCard
          label="Paid Policies"
          value={policies.filter(p => p.is_paid).length}
          tone="positive"
          icon={<Clock size={18} />}
          description="Standard paid leaves"
        />
        <StatCard
          label="Carry-Forward Enabled"
          value={policies.filter(p => p.carry_forward).length}
          tone="accent"
          icon={<Sparkles size={18} />}
          description="Accumulation allowed"
        />
      </div>

      {/* Table */}
      <Card padding={0}>
        <Table data={policies} columns={columns} keyExtractor={(r) => String(r.id)} />
      </Card>

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Define Leave Type & Quota Policy"
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Leave Policy Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Casual Leave (CL), Sabbatical Leave"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Leave Nature</label>
            <Select
              value={formData.isPaid ? 'PAID' : 'UNPAID'}
              onChange={(e) => setFormData(prev => ({ ...prev, isPaid: e.target.value === 'PAID' }))}
              options={[
                { value: 'PAID', label: 'Paid Leave (Regular compensation)' },
                { value: 'UNPAID', label: 'Unpaid Leave (Loss of Pay / LOP deduction)' }
              ]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Faculty Annual Quota</label>
              <Input
                type="number"
                value={String(formData.facultyQuota)}
                onChange={(e) => setFormData(prev => ({ ...prev, facultyQuota: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Staff Annual Quota</label>
              <Input
                type="number"
                value={String(formData.staffQuota)}
                onChange={(e) => setFormData(prev => ({ ...prev, staffQuota: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Carry Forward Rule</label>
            <Select
              value={formData.carryForward ? 'YES' : 'NO'}
              onChange={(e) => setFormData(prev => ({ ...prev, carryForward: e.target.value === 'YES' }))}
              options={[
                { value: 'NO', label: 'No Carry Forward (Lapses at Year-End)' },
                { value: 'YES', label: 'Carry Forward Allowed into Next Year' }
              ]}
            />
          </div>
        </div>
      </Drawer>
    </div>
  )
}
