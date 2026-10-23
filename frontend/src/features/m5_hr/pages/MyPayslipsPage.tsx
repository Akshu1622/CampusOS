import React, { useState } from 'react'
import { Card, StatCard, Button, StatusPill, Drawer } from '@/components/ui'
import { Download, FileText, CheckCircle, DollarSign, Wallet, ShieldCheck, Printer } from 'lucide-react'

interface Payslip {
  month: string
  period: string
  net: number
  gross: number
  basic: number
  hra: number
  da: number
  specialAllowance: number
  pf: number
  tax: number
  deductions: number
  status: string
  disbursedOn: string
}

const mockPayslips: Payslip[] = [
  {
    month: 'September 2026',
    period: '01 Sep 2026 – 30 Sep 2026',
    net: 125000,
    gross: 150000,
    basic: 75000,
    hra: 30000,
    da: 25000,
    specialAllowance: 20000,
    pf: 15000,
    tax: 10000,
    deductions: 25000,
    status: 'Credited to Bank',
    disbursedOn: '2026-09-30'
  },
  {
    month: 'August 2026',
    period: '01 Aug 2026 – 31 Aug 2026',
    net: 125000,
    gross: 150000,
    basic: 75000,
    hra: 30000,
    da: 25000,
    specialAllowance: 20000,
    pf: 15000,
    tax: 10000,
    deductions: 25000,
    status: 'Credited to Bank',
    disbursedOn: '2026-08-31'
  },
  {
    month: 'July 2026',
    period: '01 Jul 2026 – 31 Jul 2026',
    net: 120000,
    gross: 145000,
    basic: 72500,
    hra: 29000,
    da: 24000,
    specialAllowance: 19500,
    pf: 15000,
    tax: 10000,
    deductions: 25000,
    status: 'Credited to Bank',
    disbursedOn: '2026-07-31'
  },
]

export const MyPayslipsPage: React.FC = () => {
  const [selectedSlip, setSelectedSlip] = useState<Payslip | null>(null)

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
          leftIcon={<Download size={14} />}
          onClick={() => alert('Downloading Annual Form 16 Tax Summary...')}
        >
          Form 16 / Tax Summary
        </Button>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Latest Net Credit"
          value="₹1,25,000"
          tone="positive"
          icon={<Wallet size={18} />}
          description="Disbursed for Sept 2026"
        />
        <StatCard
          label="Current Gross Salary"
          value="₹1,50,000"
          tone="accent"
          icon={<DollarSign size={18} />}
          description="Monthly basic + allowances"
        />
        <StatCard
          label="Annual PF Accumulated"
          value="₹1,80,000"
          tone="neutral"
          icon={<ShieldCheck size={18} />}
          description="Provident Fund balance"
        />
      </div>

      {/* Payslips List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {mockPayslips.map((slip, index) => (
          <Card key={slip.month} padding={20}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {slip.month}
                  </h3>
                  {index === 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>
                      Latest
                    </span>
                  )}
                  <StatusPill label={slip.status} status="success" />
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Pay Period: {slip.period} • Credited: {slip.disbursedOn}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Gross: <strong>₹{slip.gross.toLocaleString()}</strong></span>
                  <span style={{ color: 'var(--color-error)' }}>Deductions: <strong>₹{slip.deductions.toLocaleString()}</strong></span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>NET TAKE-HOME</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '2px 0 10px' }}>
                  ₹{slip.net.toLocaleString()}
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button variant="subtle" size="sm" onClick={() => setSelectedSlip(slip)}>
                    View Breakdown
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Download size={13} />}
                    onClick={() => alert(`Downloading verified Payslip PDF for ${slip.month}`)}
                  >
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Payslip Breakdown Drawer */}
      <Drawer
        isOpen={!!selectedSlip}
        onClose={() => setSelectedSlip(null)}
        title={selectedSlip ? `Salary Breakdown — ${selectedSlip.month}` : ''}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button variant="secondary" onClick={() => window.print()} leftIcon={<Printer size={14} />}>Print</Button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setSelectedSlip(null)}>Close</Button>
              <Button variant="primary" leftIcon={<Download size={14} />} onClick={() => alert('Downloading PDF')}>
                Download Slip
              </Button>
            </div>
          </div>
        }
      >
        {selectedSlip && (
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
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>NET PAYABLE CREDIT</div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-success)' }}>
                  ₹{selectedSlip.net.toLocaleString()}
                </div>
              </div>
              <StatusPill label={selectedSlip.status} status="success" />
            </div>

            {/* Earnings */}
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Earnings
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Basic Pay</span>
                  <span style={{ fontWeight: 600 }}>₹{selectedSlip.basic.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>House Rent Allowance (HRA)</span>
                  <span style={{ fontWeight: 600 }}>₹{selectedSlip.hra.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Dearness Allowance (DA)</span>
                  <span style={{ fontWeight: 600 }}>₹{selectedSlip.da.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Special Academic Allowance</span>
                  <span style={{ fontWeight: 600 }}>₹{selectedSlip.specialAllowance.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, borderTop: '1px solid var(--color-border)' }}>
                  <span>Total Gross Earnings</span>
                  <span style={{ color: 'var(--color-primary)' }}>₹{selectedSlip.gross.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Statutory Deductions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Provident Fund (Employee EPF)</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-error)' }}>₹{selectedSlip.pf.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Income Tax (TDS Section 192)</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-error)' }}>₹{selectedSlip.tax.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, borderTop: '1px solid var(--color-border)' }}>
                  <span>Total Deductions</span>
                  <span style={{ color: 'var(--color-error)' }}>₹{selectedSlip.deductions.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
