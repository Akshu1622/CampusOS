import React, { useState } from 'react'
import { Card, StatCard, Table, type Column, Button, Modal, Input, Select, StatusPill } from '@/components/ui'
import {
  useHostelFeeSummary,
  useHostelFeeConfigs,
  useCreateHostelFeeConfig,
  useHostelInvoices,
  useGenerateBatchInvoices,
  useAllHostelPayments,
  useVerifyHostelPayment,
  useHostels
} from '../hooks'
import type { HostelInvoice, HostelPayment, HostelFeeConfig } from '../api'
import { DollarSign, CheckCircle2, Clock, AlertTriangle, RefreshCw, Plus, FileText, QrCode, ShieldCheck, Check, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function S17HostelFeeManagementPage() {
  const { data: summary, isLoading: summaryLoading } = useHostelFeeSummary()
  const { data: hostels = [] } = useHostels()
  const { data: feeConfigs = [], isLoading: configsLoading } = useHostelFeeConfigs()
  const { data: invoices = [], isLoading: invoicesLoading } = useHostelInvoices()
  const { data: payments = [], isLoading: paymentsLoading } = useAllHostelPayments()

  const [activeTab, setActiveTab] = useState<'INVOICES' | 'PAYMENTS' | 'CONFIGS'>('INVOICES')
  const [selectedInvoice, setSelectedInvoice] = useState<HostelInvoice | null>(null)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [newFeeName, setNewFeeName] = useState('')
  const [newFeeAmount, setNewFeeAmount] = useState<number>(25000)
  const [newFeeHostelId, setNewFeeHostelId] = useState<string>('')
  const [newFeeTerm, setNewFeeTerm] = useState('AY-2026-27-SEM1')
  const [newFeeDays, setNewFeeDays] = useState<number>(30)

  const [verificationNotes, setVerificationNotes] = useState('')
  const [verifyingPayment, setVerifyingPayment] = useState<HostelPayment | null>(null)

  const createConfig = useCreateHostelFeeConfig()
  const generateBatch = useGenerateBatchInvoices()
  const verifyPayment = useVerifyHostelPayment()

  const handleCreateConfig = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFeeName || newFeeAmount <= 0) {
      toast.error('Please enter a valid fee name and positive amount')
      return
    }
    createConfig.mutate({
      fee_name: newFeeName,
      amount: newFeeAmount,
      hostel_id: newFeeHostelId ? parseInt(newFeeHostelId) : undefined,
      academic_term: newFeeTerm,
      due_days: newFeeDays
    }, {
      onSuccess: () => {
        setIsConfigModalOpen(false)
        setNewFeeName('')
      }
    })
  }

  const handleVerify = (paymentId: number, status: 'VERIFIED' | 'REJECTED') => {
    verifyPayment.mutate({
      paymentId,
      data: {
        status,
        verification_notes: verificationNotes || undefined
      }
    }, {
      onSuccess: () => {
        setVerifyingPayment(null)
        setVerificationNotes('')
      }
    })
  }

  const invoiceColumns: Column<HostelInvoice>[] = [
    {
      header: 'Invoice #',
      key: 'invoice_number',
      render: (inv) => (
        <div>
          <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)' }}>
            {inv.invoice_number}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Due: {new Date(inv.due_date).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      header: 'Student',
      key: 'student_name',
      render: (inv) => (
        <div style={{ minWidth: 0, maxWidth: '200px' }}>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>
            {inv.student_name || `Student #${inv.student_id}`}
          </div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
            {inv.global_student_id || `ID: ${inv.student_id}`}
          </div>
        </div>
      )
    },
    {
      header: 'Residence Hall',
      key: 'hostel_name',
      render: (inv) => (
        <div style={{ fontSize: '13px', fontWeight: 600 }}>
          {inv.hostel_name}
        </div>
      )
    },
    {
      header: 'Fee Description',
      key: 'title',
      render: (inv) => (
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '240px', wordBreak: 'break-word' }}>
          {inv.title}
        </div>
      )
    },
    {
      header: 'Total Due',
      key: 'amount',
      render: (inv) => <span style={{ fontWeight: 600 }}>₹{inv.amount.toLocaleString()}</span>
    },
    {
      header: 'Balance',
      key: 'balance',
      render: (inv) => (
        <span style={{ fontWeight: 700, color: inv.balance > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
          ₹{inv.balance.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (inv) => {
        const variant = inv.status === 'PAID' ? 'success' : inv.status === 'PENDING_VERIFICATION' ? 'warning' : inv.status === 'PARTIALLY_PAID' ? 'neutral' : 'error'
        return <StatusPill label={inv.status.replace('_', ' ')} status={variant} />
      }
    }
  ]

  const paymentColumns: Column<HostelPayment>[] = [
    {
      header: 'Payment #',
      key: 'payment_number',
      render: (p) => (
        <div>
          <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)' }}>
            {p.payment_number}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            {new Date(p.created_at).toLocaleString()}
          </div>
        </div>
      )
    },
    {
      header: 'Student',
      key: 'student_name',
      render: (p) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{p.student_name}</div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{p.global_student_id}</div>
        </div>
      )
    },
    {
      header: 'Amount Paid',
      key: 'amount_paid',
      render: (p) => (
        <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
          ₹{p.amount_paid.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Method & Reference',
      key: 'payment_reference',
      render: (p) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
            <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600 }}>
              {p.payment_reference}
            </span>
          </div>
          {p.proof_notes && (
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {p.proof_notes}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (p) => {
        const variant = p.status === 'VERIFIED' ? 'success' : p.status === 'PENDING_VERIFICATION' ? 'warning' : 'error'
        return <StatusPill label={p.status.replace('_', ' ')} status={variant} />
      }
    },
    {
      header: 'Verification Action',
      key: 'id',
      render: (p) => (
        p.status === 'PENDING_VERIFICATION' ? (
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Check size={12} />}
              onClick={() => setVerifyingPayment(p)}
            >
              Verify
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => handleVerify(p.id, 'REJECTED')}
            >
              Reject
            </Button>
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {p.verified_at ? `Verified ${new Date(p.verified_at).toLocaleDateString()}` : 'Processed'}
          </span>
        )
      )
    }
  ]

  const configColumns: Column<HostelFeeConfig>[] = [
    {
      header: 'Fee Head Name',
      key: 'fee_name',
      render: (c) => <span style={{ fontWeight: 700 }}>{c.fee_name}</span>
    },
    {
      header: 'Applicable Hall',
      key: 'hostel_name',
      render: (c) => <span>{c.hostel_name || 'All Residence Halls (Campus-Wide)'}</span>
    },
    {
      header: 'Term',
      key: 'academic_term',
      render: (c) => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{c.academic_term}</span>
    },
    {
      header: 'Standard Amount',
      key: 'amount',
      render: (c) => <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{c.amount.toLocaleString()}</span>
    },
    {
      header: 'Payment Window',
      key: 'due_days',
      render: (c) => <span>{c.due_days} Days from Allotment</span>
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0D9488', background: '#CCFBF1', padding: '2px 8px', borderRadius: '4px' }}>
              HOS-FEES
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Hostel Fee Management & Verification
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Manage room rental structures, student billing invoices, institutional UPI payments, and warden desk verifications.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="tertiary"
            leftIcon={<Plus size={14} />}
            onClick={() => setIsConfigModalOpen(true)}
          >
            New Fee Structure
          </Button>
          <Button
            variant="primary"
            leftIcon={<RefreshCw size={14} className={generateBatch.isPending ? 'animate-spin' : ''} />}
            onClick={() => generateBatch.mutate()}
            isLoading={generateBatch.isPending}
          >
            Generate Term Invoices
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Invoiced"
          value={`₹${(summary?.total_invoiced || 0).toLocaleString()}`}
          tone="neutral"
          icon={<DollarSign size={18} />}
          description={`${summary?.invoices_count || 0} Invoices Issued`}
        />
        <StatCard
          label="Collections Verified"
          value={`₹${(summary?.total_collected || 0).toLocaleString()}`}
          tone="positive"
          icon={<CheckCircle2 size={18} />}
          description="Deposited to Institutional Account"
        />
        <StatCard
          label="Pending Outstanding"
          value={`₹${(summary?.total_pending || 0).toLocaleString()}`}
          tone="warning"
          icon={<Clock size={18} />}
          description="Due for Current Term"
        />
        <StatCard
          label="Pending Verifications"
          value={`${summary?.pending_verification_count || 0} Payments`}
          tone={summary?.pending_verification_count ? 'error' : 'positive'}
          icon={<ShieldCheck size={18} />}
          description="Awaiting Warden Approval"
        />
      </div>

      {/* Tabs */}
      <Card padding={0}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          padding: '0 16px',
          background: 'var(--color-surface)',
          gap: '8px'
        }}>
          {[
            { id: 'INVOICES', label: `Student Invoices (${invoices.length})` },
            { id: 'PAYMENTS', label: `Payment Approvals (${payments.length})` },
            { id: 'CONFIGS', label: `Fee Heads & Rules (${feeConfigs.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '14px 18px',
                border: 'none',
                background: 'transparent',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'INVOICES' && (
          <Table
            data={invoices}
            columns={invoiceColumns}
            keyExtractor={(i) => i.id.toString()}
            isLoading={invoicesLoading}
            emptyMessage="No hostel invoices recorded yet. Click 'Generate Term Invoices' to bill active residents."
          />
        )}

        {activeTab === 'PAYMENTS' && (
          <Table
            data={payments}
            columns={paymentColumns}
            keyExtractor={(p) => p.id.toString()}
            isLoading={paymentsLoading}
            emptyMessage="No payments submitted yet."
          />
        )}

        {activeTab === 'CONFIGS' && (
          <Table
            data={feeConfigs}
            columns={configColumns}
            keyExtractor={(c) => c.id.toString()}
            isLoading={configsLoading}
            emptyMessage="No fee structures defined."
          />
        )}
      </Card>

      {/* New Fee Structure Modal */}
      <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title="Configure Hostel Fee Structure">
        <form onSubmit={handleCreateConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Fee Head Name"
            placeholder="e.g. Hostel Room Rent - Fall 2026"
            value={newFeeName}
            onChange={(e) => setNewFeeName(e.target.value)}
            required
          />
          <Input
            type="number"
            label="Standard Amount (INR)"
            value={newFeeAmount.toString()}
            onChange={(e) => setNewFeeAmount(parseFloat(e.target.value) || 0)}
            required
          />
          <Select
            label="Applicable Residence Hall"
            value={newFeeHostelId}
            onChange={(e) => setNewFeeHostelId(e.target.value)}
            options={[
              { label: 'All Residence Halls (Campus-Wide)', value: '' },
              ...hostels.map(h => ({ label: `${h.name} (${h.gender_block})`, value: h.id.toString() }))
            ]}
          />
          <Input
            label="Academic Term Identifier"
            value={newFeeTerm}
            onChange={(e) => setNewFeeTerm(e.target.value)}
          />
          <Input
            type="number"
            label="Due Days from Allotment"
            value={newFeeDays.toString()}
            onChange={(e) => setNewFeeDays(parseInt(e.target.value) || 30)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="tertiary" onClick={() => setIsConfigModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createConfig.isPending}>Save Fee Rule</Button>
          </div>
        </form>
      </Modal>

      {/* Verification Notes Modal */}
      <Modal
        isOpen={!!verifyingPayment}
        onClose={() => setVerifyingPayment(null)}
        title={verifyingPayment ? `Verify Payment ${verifyingPayment.payment_number}` : ''}
      >
        {verifyingPayment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--color-surface-subtle)', borderRadius: '6px', fontSize: '13px' }}>
              <div>Student: <strong>{verifyingPayment.student_name}</strong> ({verifyingPayment.global_student_id})</div>
              <div style={{ marginTop: '4px' }}>Amount: <strong style={{ color: 'var(--color-success)' }}>₹{verifyingPayment.amount_paid.toLocaleString()}</strong></div>
              <div style={{ marginTop: '4px' }}>Mode: <strong>{verifyingPayment.payment_method}</strong></div>
              <div style={{ marginTop: '4px' }}>Reference / UTR: <code style={{ fontWeight: 700 }}>{verifyingPayment.payment_reference}</code></div>
              <div style={{ marginTop: '4px' }}>Institutional Payee: <code>{verifyingPayment.upi_id}</code></div>
            </div>

            <Input
              label="Warden Verification Notes / Bank Statement Ref"
              placeholder="e.g. Verified credited in ICICI Bank University Statement"
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="tertiary" onClick={() => setVerifyingPayment(null)}>Cancel</Button>
              <Button
                variant="primary"
                leftIcon={<Check size={14} />}
                onClick={() => handleVerify(verifyingPayment.id, 'VERIFIED')}
                isLoading={verifyPayment.isPending}
              >
                Confirm Verified
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
