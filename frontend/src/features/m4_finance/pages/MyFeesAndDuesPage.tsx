import React, { useState, useEffect } from 'react'
import { Card, Table, type Column, Button, Alert, StatCard, StatusPill, Drawer, Input, Select } from '@/components/ui'
import { CreditCard, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Download, DollarSign, Wallet, Award, Percent } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiClient } from '@/api/client'
import { useNavigate } from 'react-router-dom'

interface DueRecord {
  id: string | number
  component: string
  term: string
  amount: number
  dueDate: string
  lateFee: number
  paid: number
  balance: number
  status: 'Paid' | 'Due' | 'Overdue' | 'Partial'
  caste_category?: string
  student_caste_category?: string
  concession_percent?: number
  concession_applied?: number
}

export const MyFeesAndDuesPage: React.FC = () => {
  const navigate = useNavigate()
  const [dues, setDues] = useState<DueRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [studentCaste, setStudentCaste] = useState<string>('GENERAL')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [payingRecord, setPayingRecord] = useState<DueRecord | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchDues = async () => {
    setLoading(true)
    try {
      const res = await apiClient<any>('/me/dues')
      setStudentCaste(res?.student_caste_category || 'GENERAL')
      const items = Array.isArray(res?.dues) ? res.dues : []
      if (items.length > 0) {
        setDues(items.map((d: any) => ({
          id: d.id,
          component: d.component_name,
          term: d.term_label || d.structure_name || 'Current Term',
          amount: parseFloat(d.amount_due || 0),
          dueDate: d.due_date,
          lateFee: parseFloat(d.computed_late_fee || 0),
          paid: parseFloat(d.amount_paid || 0),
          balance: parseFloat(d.balance || 0),
          status: d.status === 'PAID' ? 'Paid' : (parseFloat(d.computed_late_fee || 0) > 0 ? 'Overdue' : (d.status === 'PARTIAL' ? 'Partial' : 'Due')),
          caste_category: d.caste_category,
          student_caste_category: d.student_caste_category || res?.student_caste_category,
          concession_percent: d.concession_percent || 0,
          concession_applied: d.concession_applied || 0
        })))
      } else {
        // Fallback demo data
        setDues([
          { id: '1', component: 'Semester Tuition Fee', term: 'Term 2025-26', amount: 50000, dueDate: '2026-11-15', lateFee: 0, paid: 50000, balance: 0, status: 'Paid', student_caste_category: 'GENERAL' },
          { id: '2', component: 'Laboratory & Practical Charges', term: 'Term 2025-26', amount: 8000, dueDate: '2026-11-15', lateFee: 0, paid: 8000, balance: 0, status: 'Paid', student_caste_category: 'GENERAL' },
        ])
      }
    } catch {
      // Offline fallback
      setDues([
        { id: '1', component: 'Semester Tuition Fee', term: 'Term 2025-26', amount: 50000, dueDate: '2026-11-15', lateFee: 0, paid: 50000, balance: 0, status: 'Paid', student_caste_category: 'GENERAL' },
        { id: '2', component: 'Laboratory & Practical Charges', term: 'Term 2025-26', amount: 8000, dueDate: '2026-11-15', lateFee: 0, paid: 8000, balance: 0, status: 'Paid', student_caste_category: 'GENERAL' },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDues()
  }, [])

  const totalPayable = dues.reduce((sum, d) => sum + d.amount + d.lateFee, 0)
  const totalPaid = dues.reduce((sum, d) => sum + d.paid, 0)
  const totalOutstanding = dues.reduce((sum, d) => sum + d.balance, 0)
  const totalLateFee = dues.reduce((sum, d) => sum + d.lateFee, 0)
  const totalConcession = dues.reduce((sum, d) => sum + (d.concession_applied || 0), 0)

  const handleOpenPay = (record: DueRecord) => {
    setPayingRecord(record)
    setIsPayModalOpen(true)
  }

  const handleConfirmPayment = async () => {
    if (!payingRecord) return
    setIsProcessing(true)
    try {
      const payAmount = payingRecord.balance + payingRecord.lateFee
      await apiClient('/payments', {
        data: {
          due_ids: [Number(payingRecord.id)],
          amount: payAmount,
          payment_mode: paymentMethod === 'CARD' ? 'ONLINE' : paymentMethod === 'NETBANKING' ? 'ONLINE' : 'ONLINE',
          reference_no: `PAY-${Date.now().toString(36).toUpperCase()}`
        }
      })
      toast.success(`Payment of ₹${payAmount.toLocaleString()} completed successfully!`)
      setIsPayModalOpen(false)
      fetchDues()
    } catch (err: any) {
      toast.error(err.message || 'Payment processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusFamily = (status: DueRecord['status']): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'Paid': return 'success'
      case 'Partial': return 'warning'
      case 'Due': return 'info'
      case 'Overdue': return 'error'
    }
  }

  const columns: Column<DueRecord>[] = [
    {
      header: 'Fee Component',
      key: 'component',
      render: (r) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13.5px' }}>{r.component}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Due #{r.id}</span>
            {r.concession_applied && r.concession_applied > 0 ? (
              <span style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '4px',
                background: 'var(--color-surface-subtle)',
                color: 'var(--color-success)',
                fontWeight: 600,
                border: '1px solid var(--color-border)'
              }}>
                Caste Concession Applied (-₹{r.concession_applied.toLocaleString()})
              </span>
            ) : null}
          </div>
        </div>
      )
    },
    {
      header: 'Term',
      key: 'term',
      render: (r) => <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>{r.term}</span>
    },
    {
      header: 'Assessed Amount',
      key: 'amount',
      render: (r) => (
        <div>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>₹{r.amount.toLocaleString()}</span>
        </div>
      )
    },
    {
      header: 'Due Date',
      key: 'dueDate',
      render: (r) => (
        <span style={{
          fontSize: '13px',
          color: r.status === 'Overdue' ? 'var(--color-error)' : 'var(--color-text-secondary)',
          fontWeight: r.status === 'Overdue' ? 600 : 400
        }}>
          {r.dueDate}
        </span>
      )
    },
    {
      header: 'Balance Due',
      key: 'balance',
      render: (r) => (
        <span style={{
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 700,
          color: r.balance > 0 ? 'var(--color-text-primary)' : 'var(--color-success)',
          fontSize: '14px'
        }}>
          ₹{r.balance.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (r) => (
        <StatusPill
          label={r.status}
          status={getStatusFamily(r.status)}
        />
      )
    },
    {
      header: 'Action',
      key: 'id',
      render: (r) => (
        r.balance > 0 ? (
          <Button variant="primary" size="sm" onClick={() => handleOpenPay(r)}>
            Pay Now
          </Button>
        ) : (
          <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={() => navigate('/student/receipt-history')}>
            Receipt
          </Button>
        )
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
              My Fees, Dues & Caste Concessions
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Review institutional invoices, applied category fee concessions, and settle outstanding balances.
          </p>
        </div>

        {totalOutstanding > 0 ? (
          <Button
            variant="danger"
            icon={<Wallet size={16} />}
            onClick={() => handleOpenPay(dues.find(d => d.balance > 0) || dues[0])}
          >
            Pay Outstanding (₹{totalOutstanding.toLocaleString()})
          </Button>
        ) : (
          <Button
            variant="secondary"
            icon={<Download size={16} />}
            onClick={() => navigate('/student/receipt-history')}
          >
            View Official Receipt
          </Button>
        )}
      </div>

      {/* Student Category Badge */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--color-surface-subtle)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} color="var(--color-primary)" />
          <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Registered Caste Category: <strong>{studentCaste}</strong>
          </span>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: studentCaste === 'GENERAL' ? 'var(--color-surface-muted)' : 'var(--color-success-bg)',
            color: studentCaste === 'GENERAL' ? 'var(--color-text-muted)' : 'var(--color-success)',
            fontWeight: 700
          }}>
            {studentCaste === 'GENERAL' ? 'Standard Structure' : 'Govt/Caste Concession Beneficiary'}
          </span>
        </div>
        {totalConcession > 0 && (
          <div style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: 600 }}>
            Total Concession Benefited: ₹{totalConcession.toLocaleString()}
          </div>
        )}
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Assessed"
          value={`₹${totalPayable.toLocaleString()}`}
          icon={<DollarSign size={20} />}
          moduleColor="finance"
          supportText="After caste concessions"
        />
        <StatCard
          label="Total Paid"
          value={`₹${totalPaid.toLocaleString()}`}
          icon={<CheckCircle2 size={20} />}
          moduleColor="people"
          supportText={totalOutstanding === 0 ? "100% Cleared (Receipt Unlocked)" : "Partial payment recorded"}
          supportColor="success"
        />
        <StatCard
          label="Outstanding Balance"
          value={`₹${totalOutstanding.toLocaleString()}`}
          icon={<CreditCard size={20} />}
          moduleColor="alerts"
          supportText={totalOutstanding > 0 ? 'Clear dues to unlock receipt' : 'All fees settled'}
          supportColor={totalOutstanding > 0 ? 'error' : 'success'}
        />
        <StatCard
          label="Late Fees Accrued"
          value={`₹${totalLateFee.toLocaleString()}`}
          icon={<AlertTriangle size={20} />}
          moduleColor="alerts"
          supportText={totalLateFee > 0 ? 'Overdue penalty applied' : 'Zero penalty'}
          supportColor={totalLateFee > 0 ? 'error' : 'neutral'}
        />
      </div>

      {/* Fee Table */}
      <Card padding={0}>
        <Table columns={columns} data={dues} isLoading={loading} keyExtractor={(r) => String(r.id)} />
      </Card>

      {/* Pay Drawer */}
      <Drawer
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Institutional Fee Payment"
        size="md"
      >
        {payingRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              background: 'var(--color-primary-subtle)',
              border: '1px solid var(--color-primary-subtle-border)',
              borderRadius: '12px',
              padding: '16px 20px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Invoice Details
              </span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                {payingRecord.component}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Academic Term: {payingRecord.term}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--color-surface-muted)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Assessed Amount</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>₹{payingRecord.amount.toLocaleString()}</span>
              </div>
              {payingRecord.lateFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: 'var(--color-error)' }}>
                  <span>Late Fee Penalty</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>+₹{payingRecord.lateFee.toLocaleString()}</span>
                </div>
              )}
              {payingRecord.paid > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: 'var(--color-success)' }}>
                  <span>Already Paid</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>-₹{payingRecord.paid.toLocaleString()}</span>
                </div>
              )}
              <div style={{ height: '1px', background: 'var(--color-border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                <span>Net Payable</span>
                <span style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  ₹{(payingRecord.balance + payingRecord.lateFee).toLocaleString()}
                </span>
              </div>
            </div>

            <Select
              label="Payment Rail"
              value={paymentMethod}
              options={[
                { label: 'UPI / QR Code (Instant Settlement)', value: 'UPI' },
                { label: 'Net Banking (All Major Banks)', value: 'NETBANKING' },
                { label: 'Debit / Credit Card', value: 'CARD' }
              ]}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
              <ShieldCheck size={16} color="var(--color-success)" />
              <span>Receipt will be officially generated once total fees are fully cleared.</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setIsPayModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" isLoading={isProcessing} onClick={handleConfirmPayment}>
                Pay ₹{(payingRecord.balance + payingRecord.lateFee).toLocaleString()}
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
