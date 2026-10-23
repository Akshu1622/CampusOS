import React, { useState } from 'react'
import { Card, StatCard, Button, Alert, StatusPill } from '@/components/ui'
import { Check, CheckCircle2, ArrowRight, ArrowLeft, AlertTriangle, Users, DollarSign, Calendar, Layers, ShieldCheck } from 'lucide-react'

export const PayrollRunPage: React.FC = () => {
  const [step, setStep] = useState(1)
  const [month, setMonth] = useState('2026-10')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '840px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            HR-08
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Monthly Payroll Execution Engine
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Run automated salary computations, sync leave deductions, and generate banking disbursement files.
        </p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {[1, 2, 3, 4].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              background: step > s ? 'var(--color-success)' : step === s ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
              color: step >= s ? '#FFFFFF' : 'var(--color-text-muted)',
              border: step >= s ? 'none' : '1px solid var(--color-border)'
            }}>
              {step > s ? <Check size={14} /> : s}
            </div>
            <div style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: step >= s ? 'var(--color-primary)' : 'var(--color-border)',
            }} />
          </div>
        ))}
      </div>

      <Card padding={24}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
                Step 1: Select Pay Cycle Month
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Target billing month for faculty, laboratory instructors, and administrative personnel.
              </p>
            </div>

            <div style={{ maxWidth: '280px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Payroll Cycle</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{
              padding: '12px',
              borderRadius: '6px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
              color: 'var(--color-text-secondary)'
            }}>
              <strong>Cycle Metadata:</strong> October 2026 includes 22 university working days. All approved casual, sick, and duty leaves have been synced from the HR attendance register.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
              <Button variant="primary" rightIcon={<ArrowRight size={14} />} onClick={() => setStep(2)}>
                Next: Pre-Flight Integrity Check
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
                Step 2: Automated Pre-Flight Validations
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Scanning employee biometric attendance, sanctioned unpaid leaves, and statutory tax slabs.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '6px',
                background: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                border: '1px solid var(--color-success)',
                fontSize: '13px'
              }}>
                <CheckCircle2 size={18} />
                <span><strong>52 Employees Validated:</strong> Active contracts and verified bank routing details in system.</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '6px',
                background: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                border: '1px solid var(--color-success)',
                fontSize: '13px'
              }}>
                <CheckCircle2 size={18} />
                <span><strong>Leave Adjustments Synchronized:</strong> 3 Loss-of-Pay (LOP) days accounted for prorated deduction.</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '6px',
                background: 'var(--color-warning-bg)',
                color: 'var(--color-warning)',
                border: '1px solid var(--color-warning)',
                fontSize: '13px'
              }}>
                <AlertTriangle size={18} />
                <span><strong>1 Visiting Adjunct Faculty:</strong> Missing updated PAN card number. Standard 20% TDS tax slab applied.</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
              <Button variant="secondary" leftIcon={<ArrowLeft size={14} />} onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" rightIcon={<ArrowRight size={14} />} onClick={() => setStep(3)}>
                Proceed to Salary Ledger Review
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
                Step 3: Executive Payroll Summary
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Review aggregate compensation figures before permanent ledger posting and bank file generation.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <StatCard
                label="Total Employees"
                value="52"
                tone="accent"
                icon={<Users size={18} />}
                description="Faculty + Administrative"
              />
              <StatCard
                label="Gross Earnings"
                value="₹64.50L"
                tone="neutral"
                icon={<DollarSign size={18} />}
                description="Basic + HRA + Allowances"
              />
              <StatCard
                label="Statutory Deductions"
                value="₹9.20L"
                tone="critical"
                description="PF, Professional Tax & TDS"
              />
              <StatCard
                label="Net Disbursable"
                value="₹55.30L"
                tone="positive"
                description="Direct Bank ACH deposit"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
              <Button variant="secondary" leftIcon={<ArrowLeft size={14} />} onClick={() => setStep(2)}>
                Back
              </Button>
              <Button variant="primary" onClick={() => setStep(4)}>
                Finalize & Lock Payroll Run
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 16px', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
                Payroll Run for {month} Successfully Finalized
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '480px' }}>
                ₹55.30 Lakhs net compensation locked into general ledger. Automated NACH/NEFT bank disbursement file generated.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <Button variant="secondary" onClick={() => setStep(1)}>
                Process Another Cycle
              </Button>
              <Button variant="primary" onClick={() => window.location.href = '/hr/payroll-register'}>
                View Payroll Register
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
