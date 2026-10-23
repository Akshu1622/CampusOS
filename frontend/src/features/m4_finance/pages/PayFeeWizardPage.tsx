import React, { useState } from 'react'
import { Card, Button, StatCard } from '@/components/ui'
import { CreditCard, QrCode, Building, Check, ArrowRight, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const PayFeeWizardPage: React.FC = () => {
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState<'card' | 'upi' | 'netbanking'>('upi')
  const [isProcessing, setIsProcessing] = useState(false)
  const navigate = useNavigate()

  const handlePay = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      navigate('/student/payment-history')
    }, 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            PAY-01
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Secure Student Fee Payment
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Review invoice breakdown, choose your preferred payment rail, and confirm checkout.
        </p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {[1, 2].map((s) => (
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
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Step 1: Fee Itemization & Payment Mode
            </h2>

            <div style={{
              background: 'var(--color-surface-subtle)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Tuition Fee (Fall 2026 Semester VII)</span>
                <span style={{ fontWeight: 600 }}>₹45,000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Laboratory & Development Charges</span>
                <span style={{ fontWeight: 600 }}>₹5,000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Examination Surcharge</span>
                <span style={{ fontWeight: 600 }}>₹250</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid var(--color-border)',
                fontWeight: 700,
                fontSize: '18px',
                color: 'var(--color-text-primary)'
              }}>
                <span>Total Amount Due</span>
                <span style={{ color: 'var(--color-primary)' }}>₹50,250</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--color-text-primary)' }}>
                Select Payment Rail
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {[
                  { id: 'upi' as const, label: 'Instant UPI / QR', icon: <QrCode size={18} /> },
                  { id: 'card' as const, label: 'Debit / Credit Card', icon: <CreditCard size={18} /> },
                  { id: 'netbanking' as const, label: 'Net Banking', icon: <Building size={18} /> },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setMode(item.id)}
                    style={{
                      border: `1.5px solid ${mode === item.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: '8px',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      background: mode === item.id ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ color: mode === item.id ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: mode === item.id ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
              <Button variant="primary" rightIcon={<ArrowRight size={14} />} onClick={() => setStep(2)}>
                Next: Authorization
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Step 2: Confirm & Pay
            </h2>

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
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>PAYABLE TO UNIVERSITY</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)' }}>₹50,250</div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', background: 'var(--color-primary-subtle)', padding: '4px 10px', borderRadius: '4px' }}>
                Mode: {mode.toUpperCase()}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              padding: '12px',
              borderRadius: '6px',
              background: 'var(--color-primary-subtle)'
            }}>
              <ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} />
              Protected by 256-bit bank encryption. Once processed, an official tax receipt is deposited to your ledger.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
              <Button variant="secondary" leftIcon={<ArrowLeft size={14} />} onClick={() => setStep(1)} disabled={isProcessing}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handlePay}
                isLoading={isProcessing}
                leftIcon={isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              >
                {isProcessing ? 'Processing Payment...' : 'Authorize ₹50,250'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
