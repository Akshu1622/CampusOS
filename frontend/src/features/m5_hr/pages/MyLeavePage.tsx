import React, { useState } from 'react'
import { Card, StatCard, Button, Table, type Column, StatusPill, Drawer, Input, Select, Alert } from '@/components/ui'
import { Plus, Calendar, Clock, CheckCircle, ShieldCheck, HeartPulse, Sparkles, Send } from 'lucide-react'

interface LeaveRequest {
  id: string
  type: string
  dates: string
  days: number
  status: 'Pending' | 'Approved' | 'Rejected'
  appliedOn: string
  remark: string
}

const initialLeaveRequests: LeaveRequest[] = [
  { id: 'LR-2026-091', type: 'Casual Leave', dates: '10 Oct 2026 - 11 Oct 2026', days: 2, status: 'Pending', appliedOn: '2026-10-04', remark: 'Under HOD review' },
  { id: 'LR-2026-074', type: 'Sick Leave', dates: '01 Sep 2026 - 02 Sep 2026', days: 2, status: 'Approved', appliedOn: '2026-08-30', remark: 'Medical certificate approved by HR' },
  { id: 'LR-2026-042', type: 'Earned Leave', dates: '14 Jul 2026 - 18 Jul 2026', days: 5, status: 'Approved', appliedOn: '2026-07-02', remark: 'Sanctioned for summer vacation' },
]

export const MyLeavePage: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>(initialLeaveRequests)
  const [isApplyDrawerOpen, setIsApplyDrawerOpen] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    type: 'Casual Leave',
    fromDate: '',
    toDate: '',
    reason: ''
  })

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fromDate || !formData.toDate || !formData.reason) return

    const start = new Date(formData.fromDate)
    const end = new Date(formData.toDate)
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

    const newReq: LeaveRequest = {
      id: `LR-2026-0${requests.length + 100}`,
      type: formData.type,
      dates: `${formData.fromDate} - ${formData.toDate}`,
      days,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0],
      remark: 'Application queued for HOD endorsement'
    }

    setRequests(prev => [newReq, ...prev])
    setIsApplyDrawerOpen(false)
    setFormData({ type: 'Casual Leave', fromDate: '', toDate: '', reason: '' })
    setNotification('Leave application submitted successfully.')
    setTimeout(() => setNotification(null), 3500)
  }

  const handleCancel = (id: string) => {
    if (confirm('Cancel this pending leave request?')) {
      setRequests(prev => prev.filter(r => r.id !== id))
      setNotification(`Leave request ${id} cancelled.`)
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const columns: Column<LeaveRequest>[] = [
    {
      header: 'Leave Type',
      key: 'type',
      render: (r) => <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.type}</span>
    },
    {
      header: 'Dates Covered',
      key: 'dates',
      render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.dates}</span>
    },
    {
      header: 'Working Days',
      key: 'days',
      render: (r) => (
        <span style={{ fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: 'var(--color-surface-subtle)' }}>
          {r.days} {r.days === 1 ? 'day' : 'days'}
        </span>
      )
    },
    {
      header: 'Submission Date',
      key: 'appliedOn',
      render: (r) => <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{r.appliedOn}</span>
    },
    {
      header: 'Approval Status',
      key: 'status',
      render: (r) => (
        <StatusPill
          label={r.status}
          status={r.status === 'Approved' ? 'success' : r.status === 'Pending' ? 'warning' : 'error'}
        />
      )
    },
    {
      header: 'Remarks / Workflow',
      key: 'remark',
      render: (r) => <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{r.remark}</span>
    },
    {
      header: 'Action',
      key: 'id',
      render: (r) => (
        r.status === 'Pending' ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleCancel(r.id)}
          >
            Cancel
          </Button>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>
        )
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
              HR-05
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              My Leave & Entitlement Balances
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Track your annual statutory leave balances, submit vacation / sick requests, and review decisions.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setIsApplyDrawerOpen(true)}>
          Apply for Leave
        </Button>
      </div>

      {notification && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '6px',
          background: 'var(--color-success-bg)',
          color: 'var(--color-success)',
          border: '1px solid var(--color-success)',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          {notification}
        </div>
      )}

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Casual Leave (CL)"
          value="8 / 12"
          tone="positive"
          icon={<Clock size={18} />}
          description="4 days availed this year"
        />
        <StatCard
          label="Sick Leave (SL)"
          value="8 / 10"
          tone="positive"
          icon={<HeartPulse size={18} />}
          description="2 days availed with medical slips"
        />
        <StatCard
          label="Earned Leave (EL)"
          value="15 / 15"
          tone="accent"
          icon={<Sparkles size={18} />}
          description="Full entitlement available"
        />
        <StatCard
          label="Pending Applications"
          value={requests.filter(r => r.status === 'Pending').length}
          tone="neutral"
          icon={<Calendar size={18} />}
          description="Awaiting department signoff"
        />
      </div>

      {/* History Table */}
      <Card padding={0}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Leave Application History
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Academic Year 2026–2027</span>
        </div>
        <Table data={requests} columns={columns} keyExtractor={(r) => r.id} />
      </Card>

      {/* Apply Leave Drawer */}
      <Drawer
        isOpen={isApplyDrawerOpen}
        onClose={() => setIsApplyDrawerOpen(false)}
        title="Submit Leave Application"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setIsApplyDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" leftIcon={<Send size={14} />} onClick={handleApply}>Submit Application</Button>
          </div>
        }
      >
        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Leave Classification</label>
            <Select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              options={[
                { value: 'Casual Leave', label: 'Casual Leave (CL) — Balance: 8 Days' },
                { value: 'Sick Leave', label: 'Sick Leave (SL) — Balance: 8 Days' },
                { value: 'Earned Leave', label: 'Earned Leave (EL) — Balance: 15 Days' },
                { value: 'Duty Leave', label: 'Duty Leave (Conference / Official University Duty)' }
              ]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>From Date</label>
              <Input
                type="date"
                value={formData.fromDate}
                onChange={(e) => setFormData(prev => ({ ...prev, fromDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>To Date</label>
              <Input
                type="date"
                value={formData.toDate}
                onChange={(e) => setFormData(prev => ({ ...prev, toDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Statement of Purpose / Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="State the academic, medical, or personal reason for this leave request..."
              rows={4}
              required
              style={{
                width: '100%',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                padding: '10px 12px',
                fontSize: '14px',
                fontFamily: 'inherit',
                color: 'var(--color-text-primary)',
                background: 'var(--color-surface)',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{
            background: 'var(--color-surface-subtle)',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)'
          }}>
            <strong>Substitute Arrangement:</strong> By submitting, you confirm that your lecture and lab cohorts have been notified and peer coverage has been arranged in coordination with the HOD.
          </div>
        </form>
      </Drawer>
    </div>
  )
}
