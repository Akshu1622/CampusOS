import React, { useState } from 'react'
import { Card, Table, type Column, Button, Alert, StatCard, StatusPill, Drawer, Input, Select } from '@/components/ui'
import { CreditCard, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Download, DollarSign, Wallet } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DueRecord {
  id: string
  component: string
  term: string
  amount: number
  dueDate: string
  lateFee: number
  paid: number
  balance: number
  status: 'Paid' | 'Due' | 'Overdue' | 'Partial'
}

export const MyFeesAndDuesPage: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [payingRecord, setPayingRecord] = useState<DueRecord | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [isProcessing, setIsProcessing] = useState(false)

  const [dues, setDues] = useState<DueRecord[]>([
    { id: 'D1', component: 'Semester Tuition Fee', term: 'Spring 2024', amount: 50000, dueDate: '2024-02-15', lateFee: 250, paid: 0, balance: 50250, status: 'Overdue' },
    { id: 'D2', component: 'Laboratory & Equipment Fee', term: 'Spring 2024', amount: 8000, dueDate: '2024-03-01', lateFee: 0, paid: 0, balance: 8000, status: 'Due' },
    { id: 'D3', component: 'Library & Digital Subscriptions', term: 'Spring 2024', amount: 3000, dueDate: '2024-01-15', lateFee: 0, paid: 3000, balance: 0, status: 'Paid' },
    { id: 'D4', component: 'Hostel Accommodation (Sem 5)', term: 'Spring 2024', amount: 24000, dueDate: '2024-01-20', lateFee: 0, paid: 24000, balance: 0, status: 'Paid' },
  ])

  const totalPayable = dues.reduce((sum, d) => sum + d.amount + d.lateFee, 0)
  const totalPaid = dues.reduce((sum, d) => sum + d.paid, 0)
  const totalOutstanding = dues.reduce((sum, d) => sum + d.balance, 0)
  const totalLateFee = dues.reduce((sum, d) => sum + d.lateFee, 0)

  const handleOpenPay = (record: DueRecord) => {
    setPayingRecord(record)
    setIsPayModalOpen(true)
  }

  const handleConfirmPayment = () => {
    if (!payingRecord) return
    setIsProcessing(true)
    setTimeout(() => {
      setDues(prev => prev.map(d => {
        if (d.id === payingRecord.id) {
          return {
            ...d,
            paid: d.paid + d.balance,
            balance: 0,
            status: 'Paid'
          }
        }
        return d
      }))
      setIsProcessing(false)
      setIsPayModalOpen(false)
      toast.success(`Payment of ₹${payingRecord.balance.toLocaleString()} completed successfully! Receipt generated.`)
    }, 1000)
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
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Invoice #{r.id}</span>
        </div>
      )
    },
    {
      header: 'Term',
      key: 'term',
      render: (r) => <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>{r.term}</span>
    },
    {
      header: 'Base Amount',
      key: 'amount',
      render: (r) => <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>₹{r.amount.toLocaleString()}</span>
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
      header: 'Late Fee',
      key: 'lateFee',
      render: (r) => (
        <span style={{
          fontVariantNumeric: 'tabular-nums',
          color: r.lateFee > 0 ? 'var(--color-error)' : 'var(--color-text-muted)',
          fontWeight: r.lateFee > 0 ? 600 : 400
        }}>
          {r.lateFee > 0 ? `+₹${r.lateFee}` : '₹0'}
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
          <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={() => toast.success(`Receipt downloaded for ${r.component}`)}>
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
              My Fees & Dues
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Review institutional invoices, late penalty breakdowns, and settle outstanding balances securely.
          </p>
        </div>

        {totalOutstanding > 0 && (
          <Button
            variant="danger"
            icon={<Wallet size={16} />}
            onClick={() => handleOpenPay(dues.find(d => d.balance > 0) || dues[0])}
          >
            Pay Outstanding (₹{totalOutstanding.toLocaleString()})
          </Button>
        )}
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Assessed"
          value={`₹${totalPayable.toLocaleString()}`}
          icon={<DollarSign size={20} />}
          moduleColor="finance"
          supportText="Spring 2024 academic term"
        />
        <StatCard
          label="Total Paid"
          value={`₹${totalPaid.toLocaleString()}`}
          icon={<CheckCircle2 size={20} />}
          moduleColor="people"
          supportText="Receipts available"
          supportColor="success"
        />
        <StatCard
          label="Outstanding Balance"
          value={`₹${totalOutstanding.toLocaleString()}`}
          icon={<CreditCard size={20} />}
          moduleColor="alerts"
          supportText={totalOutstanding > 0 ? 'Payment required' : 'All fees settled'}
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

      {/* Overdue Warning Alert */}
      {dues.some(d => d.status === 'Overdue') && (
        <Alert
          variant="error"
          title="Outstanding Overdue Fees"
          message="You have overdue fee balances. University automated rules will restrict final examination registration if dues remain unsettled."
        />
      )}

      {/* Fee Table */}
      <Card padding={0}>
        <Table columns={columns} data={dues} />
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
                <span style={{ color: 'var(--color-text-secondary)' }}>Base Amount</span>
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
                <span style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>₹{payingRecord.balance.toLocaleString()}</span>
              </div>
            </div>

            <Select
              label="Payment Method"
              value={paymentMethod}
              options={[
                { label: 'UPI / QR Code (Instant)', value: 'UPI' },
                { label: 'Net Banking (All Major Banks)', value: 'NETBANKING' },
                { label: 'Debit / Credit Card', value: 'CARD' },
                { label: 'NEFT / RTGS Transfer', value: 'NEFT' }
              ]}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
              <ShieldCheck size={16} color="var(--color-success)" />
              <span>Payments are encrypted with 256-bit SSL and processed instantly into the student ledger.</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setIsPayModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" isLoading={isProcessing} onClick={handleConfirmPayment}>
                Pay ₹{payingRecord.balance.toLocaleString()}
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
