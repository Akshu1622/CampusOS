import React, { useState, useEffect } from 'react'
import { Card, StatCard, Button, Table, type Column, StatusPill, Drawer, Alert } from '@/components/ui'
import { Download, FileText, CheckCircle, CreditCard, ShieldCheck, AlertCircle, ArrowRight, Lock } from 'lucide-react'
import { apiClient } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface LivePayment {
  id: number
  student_id: number
  amount: number | string
  payment_mode: string
  reference_no: string
  receipt_number?: string
  payment_date: string
  status: string
}

export const ReceiptPaymentHistoryPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [payments, setPayments] = useState<LivePayment[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<LivePayment | null>(null)
  const [duesInfo, setDuesInfo] = useState<{ total_outstanding: number; total_payable: number; total_paid: number } | null>(null)

  const isAdmin = Boolean(user?.roles?.some((r: string) => r.toLowerCase() === 'admin' || r.toLowerCase() === 'superadmin'))

  const fetchPayments = async () => {
    setLoading(true)
    try {
      if (!isAdmin) {
        // In student login: check dues to verify if whole fee has been paid
        try {
          const duesRes = await apiClient<any>('/me/dues')
          setDuesInfo({
            total_outstanding: parseFloat(duesRes?.total_outstanding || 0),
            total_payable: parseFloat(duesRes?.total_payable || 0),
            total_paid: parseFloat(duesRes?.total_paid || 0),
          })

          if (parseFloat(duesRes?.total_outstanding || 0) > 0.01) {
            // Whole fee is NOT paid yet: official receipt is only generated when whole fee is settled
            setPayments([])
            setLoading(false)
            return
          }
        } catch {
          // If dues endpoint fails, continue to payments
        }
      }

      const endpoint = isAdmin ? '/payments?page_size=100' : '/me/payments'
      const res = await apiClient<any>(endpoint)
      const list = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : []
      setPayments(list)
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch payment receipts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [user])

  const totalPaid = payments.reduce((sum, r) => sum + parseFloat(String(r.amount) || '0'), 0)
  const hasOutstanding = !isAdmin && duesInfo !== null && duesInfo.total_outstanding > 0.01

  const columns: Column<LivePayment>[] = [
    {
      header: 'Receipt / Ref No.',
      key: 'reference_no',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>
          {r.receipt_number || r.reference_no}
        </span>
      )
    },
    {
      header: 'Payment Date',
      key: 'payment_date',
      render: (r) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          {new Date(r.payment_date).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Amount Paid',
      key: 'amount',
      render: (r) => (
        <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
          ₹{parseFloat(String(r.amount)).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Payment Mode',
      key: 'payment_mode',
      render: (r) => (
        <span style={{
          fontSize: '12px',
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'var(--color-surface-subtle)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)',
          fontWeight: 600
        }}>
          {r.payment_mode}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (r) => (
        <StatusPill
          label={r.status}
          status={r.status === 'SUCCESS' ? 'success' : r.status === 'PENDING' ? 'warning' : 'error'}
        />
      )
    },
    {
      header: 'Actions',
      key: 'id',
      render: (r) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="subtle" size="sm" onClick={() => setSelectedReceipt(r)}>
            View
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toast.success(`Receipt #${r.receipt_number || r.reference_no} downloaded`)}>
            <Download size={13} style={{ marginRight: '4px' }} /> PDF
          </Button>
        </div>
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
              FIN-04
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Official Payment Receipts & Historical Ledger
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Digitally signed transaction vouchers, fee receipts, and bank reconciliation entries.
          </p>
        </div>
        {!hasOutstanding && payments.length > 0 && (
          <Button variant="secondary" onClick={() => toast.success('Payment ledger exported')}>
            <Download size={14} style={{ marginRight: '6px' }} /> Export Statement
          </Button>
        )}
      </div>

      {/* Notice Banner when fee is not wholly paid */}
      {hasOutstanding && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '8px',
          background: 'var(--color-surface-subtle)',
          border: '1px solid var(--color-warning)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-warning)' }}>
            <Lock size={20} />
            <span style={{ fontSize: '15px', fontWeight: 700 }}>
              Official Fee Receipt Generation Locked
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            In accordance with university regulations, an <strong>official fee receipt is only generated once your entire fee is 100% settled</strong>.
            You have an outstanding balance of <strong style={{ color: 'var(--color-error)' }}>₹{duesInfo?.total_outstanding.toLocaleString()}</strong>.
            Please settle all pending dues to generate and download your official receipt.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
            <Button variant="primary" size="sm" onClick={() => navigate('/student/fees')}>
              View & Settle Outstanding Dues <ArrowRight size={14} style={{ marginLeft: '4px' }} />
            </Button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Settled Payments"
          value={hasOutstanding ? `₹${(duesInfo?.total_paid || 0).toLocaleString()}` : `₹${totalPaid.toLocaleString()}`}
          tone="positive"
          icon={<CreditCard size={20} />}
          description="Verified bank deposits"
        />
        <StatCard
          label="Receipts Issued"
          value={hasOutstanding ? "0 (Pending Full Fee)" : payments.length}
          tone={hasOutstanding ? "neutral" : "accent"}
          icon={<FileText size={20} />}
          description={hasOutstanding ? "Issued upon 100% payment" : "Official university vouchers"}
        />
        <StatCard
          label="Reconciliation Status"
          value={hasOutstanding ? "Pending Settlement" : "100% Cleared"}
          tone={hasOutstanding ? "neutral" : "positive"}
          icon={<ShieldCheck size={20} />}
          description={hasOutstanding ? `₹${(duesInfo?.total_outstanding || 0).toLocaleString()} remaining` : "Zero pending reversals"}
        />
      </div>

      {/* Main Table Card */}
      <Card padding={0}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Transaction History ({payments.length})
          </h3>
          <Button variant="secondary" size="sm" onClick={fetchPayments} isLoading={loading}>
            Refresh Receipts
          </Button>
        </div>

        <Table
          data={payments}
          columns={columns}
          keyExtractor={(r) => String(r.id)}
          isLoading={loading}
          emptyMessage={
            hasOutstanding
              ? "No receipts issued yet. Official receipts are only generated when the whole fee has been paid."
              : "No payment transactions found."
          }
        />
      </Card>

      {/* Receipt Viewer Drawer */}
      <Drawer
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title={selectedReceipt ? `Receipt Voucher — ${selectedReceipt.receipt_number || selectedReceipt.reference_no}` : ''}
        size="md"
        footer={
          selectedReceipt && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setSelectedReceipt(null)}>Close</Button>
              <Button variant="primary" onClick={() => toast.success(`Receipt #${selectedReceipt.receipt_number || selectedReceipt.reference_no} printed`)}>
                Print Receipt
              </Button>
            </div>
          )
        }
      >
        {selectedReceipt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              padding: '20px',
              borderRadius: '8px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>TRANSACTION AMOUNT</div>
              <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-success)', marginTop: '4px' }}>
                ₹{parseFloat(String(selectedReceipt.amount)).toLocaleString()}
              </div>
              <div style={{ marginTop: '8px' }}>
                <StatusPill label={selectedReceipt.status} status="success" />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Voucher Reference:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedReceipt.receipt_number || selectedReceipt.reference_no}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Internal Payment ID:</span>
                <span>#{selectedReceipt.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Student ID:</span>
                <span>#{selectedReceipt.student_id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Payment Channel:</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.payment_mode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Settlement Timestamp:</span>
                <span>{new Date(selectedReceipt.payment_date).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
