import React, { useState } from 'react'
import { Card, StatCard, Button, Table, type Column, StatusPill, Drawer } from '@/components/ui'
import { Download, FileText, CheckCircle, CreditCard, ShieldCheck } from 'lucide-react'

interface HistoryRecord {
  id: string
  receiptNo: string
  date: string
  amount: number
  mode: string
  items: string
  status: 'Success' | 'Failed' | 'Pending'
}

const mockHistory: HistoryRecord[] = [
  { id: '1', receiptNo: 'REC-2026-001', date: '2026-08-16', amount: 50250, mode: 'Credit Card', items: 'Tuition Fee, Exam Fee', status: 'Success' },
  { id: '2', receiptNo: 'REC-2026-002', date: '2026-08-10', amount: 5000, mode: 'UPI', items: 'Library Security Deposit', status: 'Success' },
  { id: '3', receiptNo: 'REC-2026-003', date: '2026-01-14', amount: 48000, mode: 'Net Banking', items: 'Spring 2026 Tuition', status: 'Success' },
]

export const ReceiptPaymentHistoryPage: React.FC = () => {
  const [selectedReceipt, setSelectedReceipt] = useState<HistoryRecord | null>(null)

  const totalPaid = mockHistory.reduce((sum, r) => sum + r.amount, 0)

  const columns: Column<HistoryRecord>[] = [
    {
      header: 'Receipt No.',
      key: 'receiptNo',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>
          {r.receiptNo}
        </span>
      )
    },
    {
      header: 'Payment Date',
      key: 'date',
      render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.date}</span>
    },
    {
      header: 'Amount Paid',
      key: 'amount',
      render: (r) => (
        <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
          ₹{r.amount.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Payment Mode',
      key: 'mode',
      render: (r) => (
        <span style={{
          fontSize: '12px',
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'var(--color-surface-subtle)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)'
        }}>
          {r.mode}
        </span>
      )
    },
    {
      header: 'Fee Heads / Items',
      key: 'items',
      render: (r) => <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>{r.items}</span>
    },
    {
      header: 'Status',
      key: 'status',
      render: (r) => (
        <StatusPill
          label={r.status}
          status={r.status === 'Success' ? 'success' : r.status === 'Pending' ? 'warning' : 'error'}
        />
      )
    },
    {
      header: 'Receipt Voucher',
      key: 'id',
      render: (r) => (
        <Button
          variant="subtle"
          size="sm"
          leftIcon={<FileText size={13} />}
          onClick={() => setSelectedReceipt(r)}
        >
          View Receipt
        </Button>
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
              FIN-05
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              My Payment History & Tax Receipts
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Review all completed university fee settlements, retrieve official PDF receipts, and export statements.
          </p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<Download size={14} />}
          onClick={() => alert('Downloading full academic year statement PDF...')}
        >
          Annual Statement (PDF)
        </Button>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Cumulative Paid"
          value={`₹${totalPaid.toLocaleString()}`}
          tone="positive"
          icon={<CreditCard size={18} />}
          description="Total fees settled"
        />
        <StatCard
          label="Current Outstanding"
          value="₹0"
          tone="positive"
          description="All dues cleared for Fall 2026"
        />
        <StatCard
          label="Verified Receipts"
          value={mockHistory.length}
          tone="neutral"
          icon={<ShieldCheck size={18} />}
          description="Available for download"
        />
      </div>

      {/* Data Table */}
      <Card padding={0}>
        <Table data={mockHistory} columns={columns} keyExtractor={(r) => r.id} />
      </Card>

      {/* Receipt Drawer */}
      <Drawer
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title={selectedReceipt ? `Official Receipt — ${selectedReceipt.receiptNo}` : ''}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setSelectedReceipt(null)}>Close</Button>
            <Button
              variant="primary"
              leftIcon={<Download size={14} />}
              onClick={() => {
                alert(`Downloading verified PDF for receipt ${selectedReceipt?.receiptNo}`)
                setSelectedReceipt(null)
              }}
            >
              Download PDF
            </Button>
          </div>
        }
      >
        {selectedReceipt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>SETTLED AMOUNT</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-success)' }}>
                  ₹{selectedReceipt.amount.toLocaleString()}
                </div>
              </div>
              <StatusPill label="PAID & VERIFIED" status="success" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Receipt Number</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedReceipt.receiptNo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Payment Date</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Payment Mode</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.mode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Items Covered</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.items}</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '6px',
              background: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              fontSize: '13px'
            }}>
              <CheckCircle size={16} />
              This digital receipt is authenticated with University Core ERP cryptographic digital seal.
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
