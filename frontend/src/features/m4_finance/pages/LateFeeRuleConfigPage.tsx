import React, { useState } from 'react'
import { Card, StatCard, Button, Input, Select, StatusPill, Drawer } from '@/components/ui'
import { Plus, Clock, ShieldCheck, AlertCircle, Edit2, Trash2 } from 'lucide-react'

interface LateFeeRule {
  id: string
  name: string
  type: 'Per-day' | 'Flat Slab' | 'Percentage'
  amount: number
  graceDays: number
  cap: number
  status: 'Active' | 'Inactive'
  appliesTo: string
}

const initialRules: LateFeeRule[] = [
  {
    id: 'LFR01',
    name: 'Standard Tuition Surcharge',
    type: 'Per-day',
    amount: 50,
    graceDays: 5,
    cap: 2000,
    status: 'Active',
    appliesTo: 'Undergraduate Tuition Fees',
  },
  {
    id: 'LFR02',
    name: 'Hostel Maintenance Penalty',
    type: 'Per-day',
    amount: 100,
    graceDays: 3,
    cap: 3000,
    status: 'Active',
    appliesTo: 'Hostel & Mess Dues',
  },
  {
    id: 'LFR03',
    name: 'Examination Late Registration',
    type: 'Flat Slab',
    amount: 500,
    graceDays: 0,
    cap: 1000,
    status: 'Active',
    appliesTo: 'End-Term Examination Entries',
  }
]

export const LateFeeRuleConfigPage: React.FC = () => {
  const [rules, setRules] = useState<LateFeeRule[]>(initialRules)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<LateFeeRule | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    type: 'Per-day' as LateFeeRule['type'],
    amount: 50,
    graceDays: 5,
    cap: 2000,
    appliesTo: 'Undergraduate Tuition Fees'
  })

  const handleOpenAdd = () => {
    setEditingRule(null)
    setFormData({
      name: '',
      type: 'Per-day',
      amount: 50,
      graceDays: 5,
      cap: 2000,
      appliesTo: 'Undergraduate Tuition Fees'
    })
    setIsDrawerOpen(true)
  }

  const handleOpenEdit = (rule: LateFeeRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      type: rule.type,
      amount: rule.amount,
      graceDays: rule.graceDays,
      cap: rule.cap,
      appliesTo: rule.appliesTo
    })
    setIsDrawerOpen(true)
  }

  const handleSave = () => {
    if (!formData.name) return
    if (editingRule) {
      setRules(prev => prev.map(r => r.id === editingRule.id ? { ...r, ...formData } : r))
    } else {
      const newRule: LateFeeRule = {
        id: `LFR0${rules.length + 1}`,
        ...formData,
        status: 'Active'
      }
      setRules(prev => [...prev, newRule])
    }
    setIsDrawerOpen(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              FIN-06
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Late Fee Rule Policies
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Configure penalty calculation algorithms, grace day thresholds, and maximum fee caps.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={handleOpenAdd}>
          Configure New Rule
        </Button>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Active Policies"
          value={rules.filter(r => r.status === 'Active').length}
          tone="positive"
          icon={<ShieldCheck size={18} />}
          description="Governing student invoices"
        />
        <StatCard
          label="Default Grace Period"
          value="5 Days"
          tone="neutral"
          icon={<Clock size={18} />}
          description="Excludes institutional holidays"
        />
        <StatCard
          label="Penalty Cap Range"
          value="₹1,000 – ₹3,000"
          tone="accent"
          description="Per-semester maximum"
        />
      </div>

      {/* Rule Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {rules.map(rule => (
          <Card key={rule.id} padding={20}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{rule.name}</h3>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{rule.appliesTo}</div>
                <div style={{ marginTop: '8px' }}>
                  <StatusPill label={rule.status} status={rule.status === 'Active' ? 'success' : 'neutral'} />
                </div>
              </div>
              <Button variant="subtle" size="sm" onClick={() => handleOpenEdit(rule)}>
                <Edit2 size={14} />
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Calculation Mechanism:</span>
                <span style={{ fontWeight: 600 }}>{rule.type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Rate / Penalty:</span>
                <span style={{ fontWeight: 600 }}>₹{rule.amount} {rule.type === 'Per-day' ? '/ day' : 'flat'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Grace Allowance:</span>
                <span style={{ fontWeight: 600 }}>{rule.graceDays} days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Maximum Ceiling:</span>
                <span style={{ fontWeight: 600 }}>₹{rule.cap.toLocaleString()}</span>
              </div>
            </div>

            <div style={{
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '12px',
              color: 'var(--color-text-secondary)'
            }}>
              <strong style={{ display: 'block', marginBottom: '2px', color: 'var(--color-text-primary)' }}>Formula Simulation:</strong>
              If delayed 12 days: (12 - {rule.graceDays}) × ₹{rule.amount} = <span style={{ color: 'var(--color-error)', fontWeight: 700 }}>₹{Math.min((12 - rule.graceDays) * rule.amount, rule.cap)} penalty</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingRule ? 'Edit Late Fee Rule' : 'Create New Late Fee Rule'}
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Rule Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Postgraduate Late Surcharge"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Applies To Fee Category</label>
            <Select
              value={formData.appliesTo}
              onChange={(e) => setFormData(prev => ({ ...prev, appliesTo: e.target.value }))}
              options={[
                { value: 'Undergraduate Tuition Fees', label: 'Undergraduate Tuition Fees' },
                { value: 'Postgraduate Tuition Fees', label: 'Postgraduate Tuition Fees' },
                { value: 'Hostel & Mess Dues', label: 'Hostel & Mess Dues' },
                { value: 'End-Term Examination Entries', label: 'End-Term Examination Entries' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Penalty Type</label>
            <Select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              options={[
                { value: 'Per-day', label: 'Per-day Daily Accrual' },
                { value: 'Flat Slab', label: 'Flat Slab Surcharge' },
                { value: 'Percentage', label: 'Percentage of Outstanding' }
              ]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Rate (₹)</label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Grace Days</label>
              <Input
                type="number"
                value={formData.graceDays}
                onChange={(e) => setFormData(prev => ({ ...prev, graceDays: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Maximum Cap (₹)</label>
            <Input
              type="number"
              value={formData.cap}
              onChange={(e) => setFormData(prev => ({ ...prev, cap: Number(e.target.value) }))}
            />
          </div>
        </div>
      </Drawer>
    </div>
  )
}
