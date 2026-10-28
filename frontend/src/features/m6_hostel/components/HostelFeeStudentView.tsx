import React, { useState } from 'react'
import { Card, StatCard, Button, StatusPill, Modal, Input } from '@/components/ui'
import { useMyHostelInvoices, usePayMyHostelFee, useMyHostelPayments } from '../hooks'
import type { HostelInvoice, HostelPayment } from '../api'
import { DollarSign, CheckCircle2, Clock, QrCode, Copy, Check, Printer, ShieldCheck, ArrowRight, AlertCircle, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface HostelFeeStudentViewProps {
  studentName?: string
  globalStudentId?: string
  hostelName?: string
  roomNumber?: string
}

export function HostelFeeStudentView({
  studentName,
  globalStudentId,
  hostelName,
  roomNumber
}: HostelFeeStudentViewProps) {
  const { data: invoices = [], isLoading: invoicesLoading } = useMyHostelInvoices()
  const { data: payments = [], isLoading: paymentsLoading } = useMyHostelPayments()
  const payFee = usePayMyHostelFee()

  const [payingInvoice, setPayingInvoice] = useState<HostelInvoice | null>(null)
  const [payAmount, setPayAmount] = useState<number>(0)
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'DEMO'>('UPI')
  const [utrRef, setUtrRef] = useState('')
  const [remarks, setRemarks] = useState('')
  const [copiedUpi, setCopiedUpi] = useState(false)
  const [viewingReceipt, setViewingReceipt] = useState<HostelPayment | null>(null)

  const INSTITUTIONAL_UPI = 'campusos.hostel@icici'
  const PAYEE_NAME = 'CampusOS Residential Desk'

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.amount, 0)
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.amount_paid, 0)
  const totalBalance = invoices.reduce((acc, inv) => acc + inv.balance, 0)

  const handleOpenPayModal = (inv: HostelInvoice) => {
    setPayingInvoice(inv)
    setPayAmount(inv.balance)
    setUtrRef('')
    setRemarks('')
    setPaymentMode('UPI')
  }

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(INSTITUTIONAL_UPI)
    setCopiedUpi(true)
    toast.success('Institutional UPI ID copied to clipboard')
    setTimeout(() => setCopiedUpi(false), 2000)
  }

  const handleSubmitPayment = (modeOverride?: 'DEMO') => {
    if (!payingInvoice) return
    const mode = modeOverride || paymentMode

    if (payAmount <= 0) {
      toast.error('Payment amount must be greater than 0')
      return
    }

    if (payAmount > payingInvoice.balance) {
      toast.error(`Amount cannot exceed outstanding balance of ₹${payingInvoice.balance.toLocaleString()}`)
      return
    }

    const ref = mode === 'DEMO'
      ? `DEMO-PAY-${Date.now().toString().slice(-6)}`
      : utrRef.trim()

    if (!ref) {
      toast.error('Please enter the 12-digit UPI Transaction ID (UTR)')
      return
    }

    payFee.mutate({
      invoice_id: payingInvoice.id,
      amount_paid: payAmount,
      payment_method: mode,
      payment_reference: ref,
      proof_notes: remarks || (mode === 'DEMO' ? 'Instant verified demo sandbox payment' : undefined)
    }, {
      onSuccess: (res) => {
        setPayingInvoice(null)
        setViewingReceipt(res)
      }
    })
  }

  // Construct standard UPI payment URI
  const upiUri = payingInvoice
    ? `upi://pay?pa=${INSTITUTIONAL_UPI}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${payAmount}&tn=${encodeURIComponent(`Hostel Fee ${payingInvoice.invoice_number}`)}&cu=INR`
    : ''

  const qrImageUrl = payingInvoice
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`
    : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Hostel Dues"
          value={`₹${totalInvoiced.toLocaleString()}`}
          tone="neutral"
          icon={<DollarSign size={18} />}
          description="Invoiced for Term"
        />
        <StatCard
          label="Amount Paid"
          value={`₹${totalPaid.toLocaleString()}`}
          tone="positive"
          icon={<CheckCircle2 size={18} />}
          description="Verified Collections"
        />
        <StatCard
          label="Outstanding Balance"
          value={`₹${totalBalance.toLocaleString()}`}
          tone={totalBalance > 0 ? 'error' : 'positive'}
          icon={<Clock size={18} />}
          description={totalBalance > 0 ? 'Due immediately' : 'All dues settled'}
        />
      </div>

      {/* Invoices List */}
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Assigned Invoices
        </h3>

        {invoices.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            background: 'var(--color-surface-subtle)',
            borderRadius: '8px',
            border: '1px dashed var(--color-border)',
            color: 'var(--color-text-muted)',
            fontSize: '13px'
          }}>
            No hostel invoices currently issued to your account.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {invoices.map(inv => {
              const isPaid = inv.status === 'PAID'
              const isPending = inv.status === 'PENDING_VERIFICATION'
              return (
                <Card key={inv.id} padding={18}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>
                          {inv.title}
                        </span>
                        <StatusPill
                          label={inv.status.replace('_', ' ')}
                          status={isPaid ? 'success' : isPending ? 'warning' : 'error'}
                        />
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Invoice ID: <code style={{ fontWeight: 600 }}>{inv.invoice_number}</code> • Due Date: {new Date(inv.due_date).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {inv.hostel_name || 'Residence Hall'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Outstanding Due</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: inv.balance > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                          ₹{inv.balance.toLocaleString()}
                        </div>
                        {inv.amount_paid > 0 && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            ₹{inv.amount_paid.toLocaleString()} paid of ₹{inv.amount.toLocaleString()}
                          </div>
                        )}
                      </div>

                      {inv.balance > 0 && (
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<QrCode size={14} />}
                          onClick={() => handleOpenPayModal(inv)}
                        >
                          Pay Fee via UPI / QR
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Payment History & Receipts */}
      {payments.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Payment History & Receipts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {payments.map(p => {
              const isVerified = p.status === 'VERIFIED'
              return (
                <div
                  key={p.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                        {p.payment_number}
                      </span>
                      <StatusPill label={p.status.replace('_', ' ')} status={isVerified ? 'success' : p.status === 'REJECTED' ? 'error' : 'warning'} />
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: p.payment_method === 'DEMO' ? '#E0F2FE' : '#FEF3C7',
                        color: p.payment_method === 'DEMO' ? '#0369A1' : '#B45309'
                      }}>
                        {p.payment_method}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Ref: <code style={{ fontWeight: 600 }}>{p.payment_reference}</code> • Date: {new Date(p.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-success)' }}>
                      ₹{p.amount_paid.toLocaleString()}
                    </div>
                    <Button
                      variant="subtle"
                      size="sm"
                      leftIcon={<FileText size={13} />}
                      onClick={() => setViewingReceipt(p)}
                    >
                      Receipt
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pay Fee Modal */}
      <Modal
        isOpen={!!payingInvoice}
        onClose={() => setPayingInvoice(null)}
        title={payingInvoice ? `Pay Hostel Fee — ${payingInvoice.title}` : ''}
        size="md"
      >
        {payingInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Invoice ID</div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  {payingInvoice.invoice_number}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Outstanding Due</div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-error)' }}>
                  ₹{payingInvoice.balance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* UPI QR Display Card */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '16px',
              border: '1.5px dashed #0D9488',
              borderRadius: '8px',
              background: '#F0FDFA',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F766E', marginBottom: '8px' }}>
                Institutional UPI QR Code
              </div>

              {/* QR Image */}
              <div style={{
                background: '#FFFFFF',
                padding: '10px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #CCFBF1',
                marginBottom: '10px'
              }}>
                <img
                  src={qrImageUrl}
                  alt="UPI QR Code"
                  style={{ width: '150px', height: '150px', display: 'block' }}
                  onError={(e) => {
                    // Fallback to high-contrast QR icon if offline
                    (e.target as HTMLElement).style.display = 'none'
                  }}
                />
              </div>

              <div style={{ fontSize: '12px', color: '#134E4A', marginBottom: '6px' }}>
                Scan using Google Pay, PhonePe, Paytm, or BHIM UPI
              </div>

              {/* Copyable UPI ID */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FFFFFF',
                border: '1px solid #99F6E4',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0F766E'
              }}>
                <span>{INSTITUTIONAL_UPI}</span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: copiedUpi ? '#16A34A' : '#0D9488',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  title="Copy UPI ID"
                >
                  {copiedUpi ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Payment Amount */}
            <Input
              type="number"
              label="Amount to Pay (INR)"
              value={payAmount.toString()}
              onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
              max={payingInvoice.balance}
              min={1}
            />

            {/* Mode Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                Select Payment Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1.5px solid ${paymentMode === 'UPI' ? '#0D9488' : 'var(--color-border)'}`,
                    background: paymentMode === 'UPI' ? '#F0FDFA' : 'var(--color-surface)',
                    color: paymentMode === 'UPI' ? '#0F766E' : 'var(--color-text-primary)',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Official UPI (Enter UTR)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('DEMO')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1.5px solid ${paymentMode === 'DEMO' ? '#0284C7' : 'var(--color-border)'}`,
                    background: paymentMode === 'DEMO' ? '#F0F9FF' : 'var(--color-surface)',
                    color: paymentMode === 'DEMO' ? '#0369A1' : 'var(--color-text-primary)',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Instant Demo Sandbox
                </button>
              </div>
            </div>

            {paymentMode === 'UPI' ? (
              <>
                <Input
                  label="12-Digit UPI Transaction ID / UTR Number"
                  placeholder="e.g. 202610281234"
                  value={utrRef}
                  onChange={(e) => setUtrRef(e.target.value)}
                  required
                />
                <Input
                  label="Payment Notes / Bank Name (Optional)"
                  placeholder="e.g. Paid via HDFC Google Pay"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </>
            ) : (
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                fontSize: '12px',
                color: '#0369A1',
                lineHeight: 1.5
              }}>
                <strong>[DEMO SANDBOX MODE]</strong> Simulates immediate electronic settlement for evaluation. Balance will update immediately and an official receipt will be generated automatically without requiring manual warden approval.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="tertiary" onClick={() => setPayingInvoice(null)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => handleSubmitPayment()}
                isLoading={payFee.isPending}
              >
                {paymentMode === 'DEMO' ? 'Confirm Instant Demo Payment' : 'Submit Reference for Verification'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Official Printable Receipt Modal */}
      <Modal
        isOpen={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        title="Official Payment Receipt"
        size="md"
      >
        {viewingReceipt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} id="printable-hostel-receipt">
            {/* Receipt Header Banner */}
            <div style={{
              textAlign: 'center',
              borderBottom: '2px solid var(--color-border)',
              paddingBottom: '14px'
            }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '0.5px' }}>
                CAMPUSOS UNIVERSITY RESIDENTIAL SERVICES
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                OFFICIAL ELECTRONIC PAYMENT RECEIPT
              </div>
              <div style={{
                display: 'inline-block',
                marginTop: '6px',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'monospace',
                background: 'var(--color-surface-subtle)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                Receipt No: {viewingReceipt.payment_number}
              </div>
            </div>

            {/* Student & Hall Information */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '12px',
              background: 'var(--color-surface-subtle)',
              padding: '12px',
              borderRadius: '6px'
            }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Student Name:</span>
                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {studentName || viewingReceipt.student_name || 'Resident Student'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Global Student ID:</span>
                <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                  {globalStudentId || viewingReceipt.global_student_id || 'STU-OFFICIAL'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Residence Hall:</span>
                <div style={{ fontWeight: 600 }}>{hostelName || 'Campus Residence'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Room Allotment:</span>
                <div style={{ fontWeight: 600 }}>{roomNumber ? `Room ${roomNumber}` : 'Hostel Wing'}</div>
              </div>
            </div>

            {/* Payment Particulars */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                background: 'var(--color-surface-subtle)',
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
                borderBottom: '1px solid var(--color-border)'
              }}>
                PAYMENT DETAILS
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Amount Paid:</span>
                  <strong style={{ fontSize: '15px', color: 'var(--color-success)' }}>
                    ₹{viewingReceipt.amount_paid.toLocaleString()}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Payment Mode:</span>
                  <span style={{ fontWeight: 600 }}>{viewingReceipt.payment_method}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Transaction Reference / UTR:</span>
                  <code style={{ fontWeight: 700 }}>{viewingReceipt.payment_reference}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Payee Account:</span>
                  <code style={{ fontSize: '11px' }}>{viewingReceipt.upi_id}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Date & Timestamp:</span>
                  <span>{new Date(viewingReceipt.created_at).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Status:</span>
                  <StatusPill
                    label={viewingReceipt.status.replace('_', ' ')}
                    status={viewingReceipt.status === 'VERIFIED' ? 'success' : 'warning'}
                  />
                </div>
              </div>
            </div>

            {/* Verification Stamp */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '6px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              fontSize: '11px',
              color: '#166534'
            }}>
              <ShieldCheck size={20} style={{ color: '#16A34A', flexShrink: 0 }} />
              <div>
                <strong>Officially Verified Electronic Receipt</strong>
                <div>Certified by CampusOS Residential Accounts Gateway. Keep this copy for warden room handover.</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button
                variant="tertiary"
                leftIcon={<Printer size={14} />}
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
              <Button variant="primary" onClick={() => setViewingReceipt(null)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
