import React, { useState } from 'react'
import { Card, Button, Input, Select, Alert, StatCard } from '@/components/ui'
import { Send, ArrowLeft, CheckCircle, Clock, HeartPulse, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const ApplyLeavePage: React.FC = () => {
  const navigate = useNavigate()
  const [leaveType, setLeaveType] = useState('casual')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const getBalance = (type: string) => {
    switch(type) {
      case 'casual': return 8
      case 'sick': return 8
      case 'earned': return 15
      default: return 0
    }
  }

  const calculateDays = () => {
    if (!fromDate || !toDate) return 0
    const start = new Date(fromDate)
    const end = new Date(toDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const days = calculateDays()
  const balance = getBalance(leaveType)
  const sufficientBalance = balance >= days

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sufficientBalance) return
    setIsSubmitted(true)
    setTimeout(() => {
      navigate('/faculty/my-leave')
    }, 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              HR-06
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Submit Leave Application
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            File a formal leave request for departmental review and peer substitution.
          </p>
        </div>
        <Button variant="subtle" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/faculty/my-leave')}>
          Back to My Leave
        </Button>
      </div>

      {isSubmitted && (
        <Alert variant="info" title="Application Dispatched">
          Your leave request has been submitted to your Department Head. Redirecting to your dashboard...
        </Alert>
      )}

      {/* Leave Balances Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <StatCard
          label="Casual Leave"
          value="8 Days"
          tone={leaveType === 'casual' ? 'accent' : 'neutral'}
          icon={<Clock size={16} />}
          description="Of 12 total"
        />
        <StatCard
          label="Sick Leave"
          value="8 Days"
          tone={leaveType === 'sick' ? 'accent' : 'neutral'}
          icon={<HeartPulse size={16} />}
          description="Of 10 total"
        />
        <StatCard
          label="Earned Leave"
          value="15 Days"
          tone={leaveType === 'earned' ? 'accent' : 'neutral'}
          icon={<Sparkles size={16} />}
          description="Full entitlement"
        />
      </div>

      <Card padding={24}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              Leave Type <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <Select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              options={[
                { value: 'casual', label: 'Casual Leave (Available Balance: 8 Days)' },
                { value: 'sick', label: 'Sick Leave (Available Balance: 8 Days)' },
                { value: 'earned', label: 'Earned Leave (Available Balance: 15 Days)' },
              ]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                Start Date <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                End Date <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                required
              />
            </div>
          </div>

          {days > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              borderRadius: '6px',
              background: sufficientBalance ? 'var(--color-surface-subtle)' : 'var(--color-error-bg)',
              border: `1px solid ${sufficientBalance ? 'var(--color-border)' : 'var(--color-error)'}`,
              fontSize: '13px'
            }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Calculated Duration:</span>
              <strong style={{ color: sufficientBalance ? 'var(--color-text-primary)' : 'var(--color-error)' }}>
                {days} {days === 1 ? 'Working Day' : 'Working Days'} {!sufficientBalance && `(Exceeds balance of ${balance})`}
              </strong>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              Reason for Leave <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State clear reasons for your absence..."
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
            <Button variant="secondary" onClick={() => navigate('/faculty/my-leave')}>Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!fromDate || !toDate || !reason || !sufficientBalance || isSubmitted}
              leftIcon={<Send size={14} />}
            >
              Dispatch Application
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
