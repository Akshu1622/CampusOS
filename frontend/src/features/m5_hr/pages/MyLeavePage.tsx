import React, { useState, useEffect } from 'react'
import { Card, StatCard, Button, Table, type Column, StatusPill, Drawer, Input, Select, Alert } from '@/components/ui'
import { Plus, Calendar, Clock, CheckCircle, ShieldCheck, HeartPulse, Sparkles, Send } from 'lucide-react'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface LeaveApplication {
  id: number
  employee_id: number
  leave_type_id: number
  start_date: string
  end_date: string
  days: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  decision_by?: number | null
  decision_date?: string | null
}

interface LeaveBalance {
  leave_type_id: number
  leave_type_name: string
  entitled: number
  balance: number
}

interface LeaveType {
  id: number
  name: string
}

export const MyLeavePage: React.FC = () => {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<LeaveApplication[]>([])
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(false)
  const [isApplyDrawerOpen, setIsApplyDrawerOpen] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    leave_type_id: '',
    fromDate: '',
    toDate: '',
    reason: ''
  })
  const [formLoading, setFormLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [leavesRes, balRes, typesRes] = await Promise.all([
        apiClient<LeaveApplication[]>('/leaves/me'),
        apiClient<LeaveBalance[]>(`/leaves/me/balance?year=${new Date().getFullYear()}`),
        apiClient<LeaveType[]>('/leave-types')
      ])
      setRequests(Array.isArray(leavesRes) ? leavesRes : [])
      setBalances(Array.isArray(balRes) ? balRes : [])
      setLeaveTypes(Array.isArray(typesRes) ? typesRes : [])
      if (Array.isArray(typesRes) && typesRes.length > 0 && !formData.leave_type_id) {
        setFormData(prev => ({ ...prev, leave_type_id: String(typesRes[0].id) }))
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch leave records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.leave_type_id || !formData.fromDate || !formData.toDate || !formData.reason.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }

    const start = new Date(formData.fromDate)
    const end = new Date(formData.toDate)
    if (end < start) {
      toast.error('End date must be after start date.')
      return
    }
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

    setFormLoading(true)
    try {
      await apiClient('/leaves', {
        method: 'POST',
        data: {
          leave_type_id: Number(formData.leave_type_id),
          start_date: formData.fromDate,
          end_date: formData.toDate,
          days,
          reason: formData.reason.trim()
        }
      })
      toast.success('Leave application submitted successfully')
      setIsApplyDrawerOpen(false)
      setFormData(prev => ({ ...prev, fromDate: '', toDate: '', reason: '' }))
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit leave application')
    } finally {
      setFormLoading(false)
    }
  }

  const columns: Column<LeaveApplication>[] = [
    {
      header: 'Leave Type',
      key: 'leave_type_id',
      render: (r) => {
        const lt = leaveTypes.find(t => t.id === r.leave_type_id)
        return <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{lt ? lt.name : `Type #${r.leave_type_id}`}</span>
      }
    },
    {
      header: 'Dates Covered',
      key: 'start_date',
      render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.start_date} → {r.end_date}</span>
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
      header: 'Reason / Purpose',
      key: 'reason',
      render: (r) => <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{r.reason || '—'}</span>
    },
    {
      header: 'Approval Status',
      key: 'status',
      render: (r) => (
        <StatusPill
          label={r.status}
          status={r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'warning' : 'error'}
        />
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
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => navigate('/faculty/hr/apply-leave')}>
            Full Screen Form
          </Button>
          <Button variant="primary" onClick={() => setIsApplyDrawerOpen(true)}>
            <Plus size={16} style={{ marginRight: '6px' }} /> Quick Apply
          </Button>
        </div>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {balances.map(b => (
          <StatCard
            key={b.leave_type_id}
            label={b.leave_type_name}
            value={`${b.balance} / ${b.entitled}`}
            tone={b.balance > 0 ? 'positive' : 'neutral'}
            icon={b.leave_type_name.includes('Sick') ? <HeartPulse size={18} /> : b.leave_type_name.includes('Earned') ? <Sparkles size={18} /> : <Clock size={18} />}
            description="Available / Annual quota"
          />
        ))}
        <StatCard
          label="Pending Applications"
          value={requests.filter(r => r.status === 'PENDING').length}
          tone="neutral"
          icon={<Calendar size={18} />}
          description="Awaiting department signoff"
        />
      </div>

      {/* History Table */}
      <Card padding={0}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Leave Application History ({requests.length})
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Academic Year 2026–2027</span>
        </div>
        <Table 
          data={requests} 
          columns={columns} 
          keyExtractor={(r) => String(r.id)} 
          isLoading={loading}
          emptyMessage="No leave requests filed yet."
        />
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
            <Button variant="primary" isLoading={formLoading} onClick={handleApply}>
              <Send size={14} style={{ marginRight: '6px' }} /> Submit Application
            </Button>
          </div>
        }
      >
        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              Leave Classification <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <Select
              value={formData.leave_type_id}
              onChange={(e) => setFormData(prev => ({ ...prev, leave_type_id: e.target.value }))}
              options={leaveTypes.map(lt => {
                const bal = balances.find(b => b.leave_type_id === lt.id)
                return {
                  value: String(lt.id),
                  label: `${lt.name} — Balance: ${bal ? bal.balance : 0} Days`
                }
              })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                From Date <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <Input
                type="date"
                value={formData.fromDate}
                onChange={(e) => setFormData(prev => ({ ...prev, fromDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                To Date <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <Input
                type="date"
                value={formData.toDate}
                onChange={(e) => setFormData(prev => ({ ...prev, toDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              Statement of Purpose / Reason <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
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
