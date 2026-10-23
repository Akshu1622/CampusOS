import React, { useState } from 'react'
import { Card, Button, Select, Alert, StatCard } from '@/components/ui'
import { Check, CheckCircle2, Users, Receipt, Layers, ArrowRight, ArrowLeft } from 'lucide-react'

export const FeeAssignmentWizardPage: React.FC = () => {
  const [step, setStep] = useState(1)
  const [selectedProgram, setSelectedProgram] = useState('cs')
  const [selectedTerm, setSelectedTerm] = useState('f26')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '880px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            FIN-07
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Batch Fee Assignment Wizard
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Generate standardized semester fee invoices across academic cohorts with automatic duplicate suppression.
        </p>
      </div>

      {/* Stepper Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {[1, 2, 3].map((s) => (
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
              transition: 'background 0.2s ease'
            }} />
          </div>
        ))}
      </div>

      <Card padding={24}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
                Step 1: Define Target Student Cohort
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Choose the academic degree program and calendar term to attach fee schedules.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Degree Program</label>
                <Select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  options={[
                    { value: 'cs', label: 'B.Tech Computer Science and Engineering' },
                    { value: 'ee', label: 'B.Tech Electrical and Electronics' },
                    { value: 'me', label: 'B.Tech Mechanical Engineering' },
                    { value: 'ce', label: 'B.Tech Civil Engineering' }
                  ]}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Target Term</label>
                <Select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  options={[
                    { value: 'f26', label: 'Fall 2026 (Semester VII / V / III / I)' },
                    { value: 's26', label: 'Spring 2026' }
                  ]}
                />
              </div>
            </div>

            <div style={{
              padding: '12px',
              borderRadius: '6px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
              color: 'var(--color-text-secondary)'
            }}>
              <strong>Applicable Fee Structure:</strong> Standard B.Tech Tuition (₹50,000) + Examination Fee (₹2,500) + Library & Amenities (₹2,500) = <strong style={{ color: 'var(--color-primary)' }}>₹55,000 per student</strong>.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
              <Button variant="primary" rightIcon={<ArrowRight size={14} />} onClick={() => setStep(2)}>
                Next: Cohort Preview
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
                Step 2: Preview & Deduplication Check
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                The core billing engine scanned registered records and detected 2 existing invoices that will be safely preserved.
              </p>
            </div>

            <Alert variant="info" title="Safe Deduplication Engine Active">
              2 students already possess invoices for this term and are automatically excluded to prevent double-billing.
            </Alert>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <StatCard
                label="Eligible Students"
                value="128"
                tone="accent"
                icon={<Users size={18} />}
                description="Active enrolled records"
              />
              <StatCard
                label="Invoice Amount"
                value="₹55,000"
                tone="neutral"
                icon={<Receipt size={18} />}
                description="Standard UG per semester"
              />
              <StatCard
                label="Total Billing Commitment"
                value="₹70.40L"
                tone="positive"
                icon={<Layers size={18} />}
                description="Ledger accrual value"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
              <Button variant="secondary" leftIcon={<ArrowLeft size={14} />} onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" onClick={() => setStep(3)}>
                Confirm & Generate Invoices
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
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
                Batch Fee Invoices Successfully Generated
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '480px' }}>
                128 invoices amounting to ₹70.40 Lakhs have been created and assigned to students' student portal accounts with notifications sent.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <Button variant="secondary" onClick={() => setStep(1)}>
                Assign Another Cohort
              </Button>
              <Button variant="primary" onClick={() => window.location.href = '/finance/ledger'}>
                View Payment Ledger
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
