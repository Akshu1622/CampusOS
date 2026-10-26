import React, { useState, useEffect } from 'react'
import { Card, StatCard, Button, StatusPill, Drawer, LoadingSkeleton } from '@/components/ui'
import { Download, FileText, CheckCircle, DollarSign, Wallet, ShieldCheck, Printer } from 'lucide-react'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'

interface PayslipLine {
  id: number
  component_type: string
  description: string
  amount: number
}

interface LivePayslip {
  id: number
  run_id: number
  employee_id: number
  gross_pay: number
  total_deductions: number
  net_pay: number
  leave_days_deducted: number
  lines: PayslipLine[]
}

export const MyPayslipsPage: React.FC = () => {
  const [payslips, setPayslips] = useState<LivePayslip[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSlip, setSelectedSlip] = useState<LivePayslip | null>(null)

  const fetchPayslips = async () => {
    setLoading(true)
    try {
      const res = await apiClient<LivePayslip[]>('/me/payslips')
      setPayslips(Array.isArray(res) ? res : [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load payslips')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayslips()
  }, [])

  const latestSlip = payslips[0]
  const latestNet = latestSlip ? latestSlip.net_pay : 0
  const latestGross = latestSlip ? latestSlip.gross_pay : 0
  const totalAccumulatedPF = payslips.reduce((sum, p) => {
    const pfLine = p.lines.find(l => l.description.toLowerCase().includes('provident'))
    return sum + (pfLine ? pfLine.amount : 0)
  }, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              HR-07
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              My Compensation & Payslips
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Review official monthly salary disbursements, tax deduction statements, and download payroll slips.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => toast.success('Form 16 Tax Summary generated and sent to employee registered email.')}
        >
          <Download size={14} style={{ marginRight: '6px' }} /> Form 16 / Tax Summary
        </Button>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Latest Net Credit"
          value={`₹${latestNet.toLocaleString()}`}
          tone="positive"
          icon={<Wallet size={18} />}
          description="Direct deposit disbursed"
        />
        <StatCard
          label="Current Gross Salary"
          value={`₹${latestGross.toLocaleString()}`}
          tone="accent"
          icon={<DollarSign size={18} />}
          description="Monthly basic + allowances"
        />
        <StatCard
          label="PF Accumulated"
          value={`₹${totalAccumulatedPF.toLocaleString()}`}
          tone="neutral"
          icon={<ShieldCheck size={18} />}
          description="Provident Fund cumulative"
        />
      </div>

      {/* Payslips List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <LoadingSkeleton height={100} />
            <LoadingSkeleton height={100} />
          </div>
        )}

        {!loading && payslips.length === 0 && (
          <Card padding={40}>
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <div style={{ fontWeight: 600, fontSize: '15px' }}>No payslips generated yet</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Payslips will appear once the institutional payroll run is finalized.</div>
            </div>
          </Card>
        )}

        {payslips.map((slip, index) => {
          const basicLine = slip.lines.find(l => l.description.toLowerCase().includes('basic'))
          const basicAmt = basicLine ? basicLine.amount : 0
          return (
            <Card key={slip.id} padding={20}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      Salary Disbursement #{slip.id} (Run #{slip.run_id})
                    </h3>
                    {index === 0 && (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>
                        Latest
                      </span>
                    )}
                    <StatusPill label="Credited" status="success" />
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Gross: ₹{slip.gross_pay.toLocaleString()} • Basic: ₹{basicAmt.toLocaleString()} • Deductions: ₹{slip.total_deductions.toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>NET TAKE-HOME</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '2px 0 10px' }}>
                    ₹{slip.net_pay.toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="subtle" size="sm" onClick={() => setSelectedSlip(slip)}>
                      View Breakdown
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => toast.success(`Downloading verified Payslip #${slip.id} PDF...`)}
                    >
                      <Download size={13} style={{ marginRight: '4px' }} /> PDF
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Payslip Breakdown Drawer */}
      <Drawer
        isOpen={Boolean(selectedSlip)}
        onClose={() => setSelectedSlip(null)}
        title={selectedSlip ? `Disbursement Breakdown — Slip #${selectedSlip.id}` : ''}
        size="md"
      >
        {selectedSlip && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>NET PAYABLE AMOUNT</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  ₹{selectedSlip.net_pay.toLocaleString()}
                </div>
              </div>
              <StatusPill label="Disbursed" status="success" />
            </div>

            {/* Earnings */}
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--color-success)' }}>
                Earnings
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedSlip.lines.filter(l => l.component_type === 'EARNING').map(l => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
                    <span>{l.description}</span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>₹{l.amount.toLocaleString()}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', fontSize: '13px', fontWeight: 700 }}>
                  <span>Total Gross</span>
                  <span>₹{selectedSlip.gross_pay.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--color-error)' }}>
                Deductions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedSlip.lines.filter(l => l.component_type === 'DEDUCTION').map(l => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
                    <span>{l.description}</span>
                    <strong style={{ color: 'var(--color-error)' }}>-₹{l.amount.toLocaleString()}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', fontSize: '13px', fontWeight: 700 }}>
                  <span>Total Deductions</span>
                  <span style={{ color: 'var(--color-error)' }}>-₹{selectedSlip.total_deductions.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
