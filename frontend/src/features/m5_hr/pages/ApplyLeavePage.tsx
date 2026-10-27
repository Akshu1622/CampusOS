import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Select, Alert, StatCard } from '@/components/ui'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'
import { Send, ArrowLeft, Clock, HeartPulse, Sparkles, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface LeaveType {
  id: number
  name: string
  is_paid: boolean
}

interface LeaveBalance {
  leave_type_id: number
  leave_type_name: string
  entitled: number
  balance: number
}

export const ApplyLeavePage: React.FC = () => {
  const navigate = useNavigate()
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<number | ''>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [typesRes, balancesRes] = await Promise.all([
          apiClient<LeaveType[]>('/leave-types'),
          apiClient<LeaveBalance[]>(`/leaves/me/balance?year=${new Date().getFullYear()}`)
        ])
        setLeaveTypes(Array.isArray(typesRes) ? typesRes : [])
        setBalances(Array.isArray(balancesRes) ? balancesRes : [])
        if (Array.isArray(typesRes) && typesRes.length > 0) {
          setSelectedTypeId(typesRes[0].id)
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load leave information')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const currentBalance = balances.find(b => b.leave_type_id === Number(selectedTypeId))
  const availableDays = currentBalance ? currentBalance.balance : 0

  const calculateDays = () => {
    if (!fromDate || !toDate) return 0
    const start = new Date(fromDate)
    const end = new Date(toDate)
    if (end < start) return 0
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const days = calculateDays()
  const sufficientBalance = availableDays >= days

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTypeId || !fromDate || !toDate || !reason.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }
    if (days <= 0) {
      toast.error('End date must be on or after start date.')
      return
    }
    if (!sufficientBalance) {
      toast.error(`Insufficient leave balance. You have ${availableDays} days available.`)
      return
    }

    setIsSubmitting(true)
    try {
      await apiClient('/leaves', {
        method: 'POST',
        data: {
          leave_type_id: Number(selectedTypeId),
          start_date: fromDate,
          end_date: toDate,
          days,
          reason: reason.trim()
        }
      })
      toast.success('Leave application submitted successfully')
      navigate('/faculty/hr/my-leave')
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit leave application')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
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
            File a formal leave request for departmental review and statutory tracking.
          </p>
        </div>
        <Button variant="subtle" size="sm" onClick={() => navigate('/faculty/hr/my-leave')}>
          <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back to My Leave
        </Button>
      </div>

      {/* Leave Balances Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        {balances.map(b => {
          const isSelected = Number(selectedTypeId) === b.leave_type_id
          return (
            <div 
              key={b.leave_type_id}
              onClick={() => setSelectedTypeId(b.leave_type_id)}
              style={{ cursor: 'pointer' }}
            >
              <StatCard
                label={b.leave_type_name}
                value={`${b.balance} Days`}
                tone={isSelected ? 'accent' : 'neutral'}
                icon={b.leave_type_name.includes('Sick') ? <HeartPulse size={16} /> : b.leave_type_name.includes('Earned') ? <Sparkles size={16} /> : <Clock size={16} />}
                description={`Of ${b.entitled} total quota`}
              />
            </div>
          )
        })}
      </div>

      <Card padding={24}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              Leave Type <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <Select
              value={String(selectedTypeId)}
              onChange={(e) => setSelectedTypeId(Number(e.target.value))}
              options={leaveTypes.map(lt => {
                const bal = balances.find(b => b.leave_type_id === lt.id)
                return {
                  value: String(lt.id),
                  label: `${lt.name} (Available: ${bal ? bal.balance : 0} Days)`
                }
              })}
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
              background: sufficientBalance ? 'var(--color-surface-subtle)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${sufficientBalance ? 'var(--color-border)' : 'var(--color-error)'}`,
              fontSize: '13px'
            }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Calculated Duration:</span>
              <strong style={{ color: sufficientBalance ? 'var(--color-text-primary)' : 'var(--color-error)' }}>
                {days} {days === 1 ? 'Working Day' : 'Working Days'} {!sufficientBalance && `(Exceeds balance of ${availableDays})`}
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
            <Button variant="secondary" type="button" onClick={() => navigate('/faculty/hr/my-leave')}>Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!fromDate || !toDate || !reason.trim() || !sufficientBalance || isSubmitting}
              isLoading={isSubmitting}
            >
              <Send size={14} style={{ marginRight: '6px' }} /> Submit Leave Application
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
