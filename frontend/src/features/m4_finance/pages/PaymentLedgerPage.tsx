import React, { useState } from 'react'
import { Card, StatCard, Button, Input, Select, Table, type Column, StatusPill, Drawer } from '@/components/ui'
import { Search, Download, CheckCircle, CreditCard, DollarSign, RefreshCw, FileText } from 'lucide-react'

interface LedgerRecord {
  id: string
  receiptNo: string
  student: string
  rollNumber: string
  program: string
  amount: number
  mode: 'UPI' | 'Credit Card' | 'Net Banking' | 'Demand Draft'
  transactionId: string
  date: string
  recordedBy: string
  status: 'Success' | 'Reversed' | 'Pending Verification'
}

const mockLedger: LedgerRecord[] = [
  { id: '1', receiptNo: 'REC-2026-8801', student: 'Aarav Sharma', rollNumber: 'CS2023-042', program: 'B.Tech CS', amount: 50250, mode: 'Credit Card', transactionId: 'TXN_991827461', date: '2026-10-22 14:32', recordedBy: 'Payment Gateway', status: 'Success' },
  { id: '2', receiptNo: 'REC-2026-8802', student: 'Priya Patel', rollNumber: 'EE2023-018', program: 'B.Tech EE', amount: 45000, mode: 'UPI', transactionId: 'UPI/9912083/HDFC', date: '2026-10-22 11:15', recordedBy: 'Payment Gateway', status: 'Success' },
  { id: '3', receiptNo: 'REC-2026-8803', student: 'Vikram Joshi', rollNumber: 'ME2024-009', program: 'B.Tech ME', amount: 62000, mode: 'Net Banking', transactionId: 'NB_SBI_11092837', date: '2026-10-21 16:40', recordedBy: 'Finance Desk', status: 'Success' },
  { id: '4', receiptNo: 'REC-2026-8804', student: 'Rhea Sen', rollNumber: 'CS2024-089', program: 'B.Tech CS', amount: 15000, mode: 'UPI', transactionId: 'UPI/4401928/ICICI', date: '2026-10-20 09:20', recordedBy: 'Payment Gateway', status: 'Success' },
  { id: '5', receiptNo: 'REC-2026-8805', student: 'Ananya Verma', rollNumber: 'CE2024-031', program: 'B.Tech CE', amount: 28000, mode: 'Demand Draft', transactionId: 'DD_776510', date: '2026-10-19 13:00', recordedBy: 'Finance Desk', status: 'Success' },
]

export const PaymentLedgerPage: React.FC = () => {
  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState<LedgerRecord | null>(null)

  const filtered = mockLedger.filter(r => {
    const matchSearch = r.student.toLowerCase().includes(search.toLowerCase()) ||
                        r.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
                        r.transactionId.toLowerCase().includes(search.toLowerCase())
    const matchMode = modeFilter ? r.mode === modeFilter : true
    return matchSearch && matchMode
  })

  const totalCollected = mockLedger.reduce((sum, r) => sum + r.amount, 0)

  const columns: Column<LedgerRecord>[] = [
    {
      header: 'Receipt No',
      key: 'receiptNo',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>
          {r.receiptNo}
        </span>
      )
    },
    {
      header: 'Student',
      key: 'student',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.student}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{r.program} • {r.rollNumber}</div>
        </div>
      )
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
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          fontWeight: 500,
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
      header: 'Date & Timestamp',
      key: 'date',
      render: (r) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {r.date}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (r) => (
        <StatusPill
          label={r.status}
          status={r.status === 'Success' ? 'success' : r.status === 'Pending Verification' ? 'warning' : 'error'}
        />
      )
    },
    {
      header: 'Action',
      key: 'id',
      render: (r) => (
        <Button
          variant="subtle"
          size="sm"
          leftIcon={<FileText size={13} />}
          onClick={() => setSelectedReceipt(r)}
        >
          Receipt
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
              FIN-04
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Payment Ledger & Collections
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Complete audit trail of all student tuition, examination, hostel, and miscellaneous receipts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            leftIcon={<Download size={14} />}
            onClick={() => alert('Exporting Payment Ledger to Excel/CSV...')}
          >
            Export Ledger
          </Button>
        </div>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Collected"
          value={`₹${(totalCollected / 100000).toFixed(2)}L`}
          tone="positive"
          icon={<DollarSign size={18} />}
          description="Verified bank settlements"
        />
        <StatCard
          label="Transactions Today"
          value={mockLedger.length}
          tone="accent"
          icon={<CreditCard size={18} />}
          description="Across all payment modes"
        />
        <StatCard
          label="Pending Clearance"
          value="0"
          tone="neutral"
          icon={<RefreshCw size={18} />}
          description="Instant PG settlement active"
        />
        <StatCard
          label="Reversals / Chargebacks"
          value="₹0"
          tone="positive"
          description="0% dispute rate"
        />
      </div>

      {/* Filter Toolbar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px' }}>
            <Input
              placeholder="Search by student, receipt # or gateway txn ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <div style={{ width: '200px' }}>
            <Select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              options={[
                { value: '', label: 'All Payment Modes' },
                { value: 'UPI', label: 'UPI' },
                { value: 'Credit Card', label: 'Credit Card' },
                { value: 'Net Banking', label: 'Net Banking' },
                { value: 'Demand Draft', label: 'Demand Draft' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card padding={0}>
        <Table data={filtered} columns={columns} keyExtractor={(r) => r.id} />
      </Card>

      {/* Receipt Voucher Drawer */}
      <Drawer
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title={selectedReceipt ? `Payment Voucher — ${selectedReceipt.receiptNo}` : ''}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setSelectedReceipt(null)}>Close</Button>
            <Button
              variant="primary"
              leftIcon={<Download size={14} />}
              onClick={() => {
                alert(`Downloading PDF for ${selectedReceipt?.receiptNo}`)
                setSelectedReceipt(null)
              }}
            >
              Download PDF Voucher
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
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>PAID AMOUNT</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-success)' }}>
                  ₹{selectedReceipt.amount.toLocaleString()}
                </div>
              </div>
              <StatusPill label={selectedReceipt.status} status="success" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Student Name</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.student}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Roll / Enrollment No</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedReceipt.rollNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Degree Program</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.program}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Payment Mode</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.mode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Transaction Reference</span>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>{selectedReceipt.transactionId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Recorded System</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.recordedBy}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Timestamp</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.date}</span>
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
              This transaction is cryptographically signed and confirmed on the university core ledger.
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
