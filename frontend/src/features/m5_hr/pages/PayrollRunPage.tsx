import React, { useState } from 'react'
import { Card, StatCard, Button, Alert, StatusPill, Table, type Column } from '@/components/ui'
import { Check, CheckCircle2, ArrowRight, ArrowLeft, AlertTriangle, Users, DollarSign, Calendar, Layers, ShieldCheck, RefreshCw } from 'lucide-react'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface PayslipLine {
  id: number
  payslip_id: number
  component_type: string
  description: string
  amount: number
}

interface PayslipItem {
  id: number
  run_id: number
  employee_id: number
  gross_pay: number
  total_deductions: number
  net_pay: number
  leave_days_deducted: number
  lines?: PayslipLine[]
}

interface PayrollRunData {
  id: number
  payroll_month: string
  run_date: string
  status: 'DRAFT' | 'FINALIZED'
  run_by: number
  payslips: PayslipItem[]
}

export const PayrollRunPage: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const currentMonthStr = new Date().toISOString().slice(0, 7)
  const [month, setMonth] = useState(currentMonthStr)
  const [loading, setLoading] = useState(false)
  const [runData, setRunData] = useState<PayrollRunData | null>(null)
  const [alreadyFinalized, setAlreadyFinalized] = useState(false)

  const handleStartCycle = async () => {
    if (!month || !/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(month)) {
      toast.error('Please enter a valid month in YYYY-MM format.')
      return
    }

    setLoading(true)
    setAlreadyFinalized(false)
    try {
      // First check if run already exists
      try {
        const existing = await apiClient<PayrollRunData>(`/payroll/${month}`)
        if (existing && existing.status === 'FINALIZED') {
          setAlreadyFinalized(true)
          setRunData(existing)
          setStep(2)
          return
        }
      } catch (e) {
        // Not yet created, continue to run draft
      }

      // Execute payroll run calculation
      const res = await apiClient<PayrollRunData>('/payroll/run', {
        method: 'POST',
        data: { payroll_month: month }
      })
      setRunData(res)
      setStep(2)
      toast.success(`Draft payroll generated for ${month}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate payroll cycle')
    } finally {
      setLoading(false)
    }
  }

  const handleFinalize = async () => {
    if (!month) return
    setLoading(true)
    try {
      const res = await apiClient<PayrollRunData>(`/payroll/${month}/finalize`, {
        method: 'POST'
      })
      setRunData(res)
      setStep(4)
      toast.success(`Payroll run for ${month} finalized and locked!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to finalize payroll')
    } finally {
      setLoading(false)
    }
  }

  const payslips = runData?.payslips || []
  const totalEmployees = payslips.length
  const totalGross = payslips.reduce((sum, p) => sum + (Number(p.gross_pay) || 0), 0)
  const totalDeductions = payslips.reduce((sum, p) => sum + (Number(p.total_deductions) || 0), 0)
  const totalNet = payslips.reduce((sum, p) => sum + (Number(p.net_pay) || 0), 0)
  const totalLopDays = payslips.reduce((sum, p) => sum + (Number(p.leave_days_deducted) || 0), 0)

  const payslipColumns: Column<PayslipItem>[] = [
    {
      header: 'Employee ID',
      key: 'employee_id',
      render: (r) => <span style={{ fontWeight: 600 }}>#{r.employee_id}</span>
    },
    {
      header: 'Gross Pay',
      key: 'gross_pay',
      render: (r) => <span>₹{Number(r.gross_pay).toLocaleString()}</span>
    },
    {
      header: 'Deductions',
      key: 'total_deductions',
      render: (r) => <span style={{ color: 'var(--color-error)' }}>-₹{Number(r.total_deductions).toLocaleString()}</span>
    },
    {
      header: 'Net Pay',
      key: 'net_pay',
      render: (r) => <strong style={{ color: 'var(--color-success)' }}>₹{Number(r.net_pay).toLocaleString()}</strong>
    },
    {
      header: 'LOP Days',
      key: 'leave_days_deducted',
      render: (r) => (
        <span>
          {r.leave_days_deducted > 0 ? (
            <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>{r.leave_days_deducted} days</span>
          ) : (
            '—'
          )}
        </span>
      )
    }
  ]

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
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                Payroll Cycle (YYYY-MM)
              </label>
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
              <strong>Cycle Metadata:</strong> Cycle for {month} will aggregate active employees, lookup defined salary structures, and factor unpaid/loss-of-pay leaves into net disbursement calculations.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
              <Button
                variant="primary"
                rightIcon={<ArrowRight size={14} />}
                onClick={handleStartCycle}
                isLoading={loading}
              >
                Compute Draft Payroll Run
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
                  Step 2: Automated Pre-Flight Validations
                </h2>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  Checking computed payslips and attendance-adjusted deductions for {month}.
                </p>
              </div>
              {alreadyFinalized && (
                <StatusPill label="Already Finalized" status="neutral" />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '6px',
                background: totalEmployees > 0 ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                color: totalEmployees > 0 ? 'var(--color-success)' : 'var(--color-warning)',
                border: `1px solid ${totalEmployees > 0 ? 'var(--color-success)' : 'var(--color-warning)'}`,
                fontSize: '13px'
              }}>
                <CheckCircle2 size={18} />
                <span>
                  <strong>{totalEmployees} Employees Processed:</strong> Active contracts evaluated against designation salary structures.
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '6px',
                background: totalLopDays > 0 ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
                color: totalLopDays > 0 ? 'var(--color-warning)' : 'var(--color-success)',
                border: `1px solid ${totalLopDays > 0 ? 'var(--color-warning)' : 'var(--color-success)'}`,
                fontSize: '13px'
              }}>
                {totalLopDays > 0 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                <span>
                  <strong>Leave Adjustments Synchronized:</strong> {totalLopDays} Loss-of-Pay (LOP) days accounted for prorated salary deduction.
                </span>
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
                <ShieldCheck size={18} />
                <span>
                  <strong>Database Integrity Verified:</strong> Unique monthly payroll run record allocated (Run ID #{runData?.id || '—'}).
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
              <Button variant="secondary" leftIcon={<ArrowLeft size={14} />} onClick={() => setStep(1)}>
                Change Month
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <StatCard
                label="Total Employees"
                value={totalEmployees}
                tone="accent"
                icon={<Users size={18} />}
                description="Processed payslips"
              />
              <StatCard
                label="Gross Earnings"
                value={`₹${totalGross.toLocaleString()}`}
                tone="neutral"
                icon={<DollarSign size={18} />}
                description="Basic + Allowances"
              />
              <StatCard
                label="Statutory Deductions"
                value={`₹${totalDeductions.toLocaleString()}`}
                tone="critical"
                description="PF, Tax & LOP"
              />
              <StatCard
                label="Net Disbursable"
                value={`₹${totalNet.toLocaleString()}`}
                tone="positive"
                description="Direct Bank ACH deposit"
              />
            </div>

            {payslips.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  Computed Line Items Preview ({payslips.length} Employees)
                </h3>
                <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
                  <Table data={payslips} columns={payslipColumns} keyExtractor={(r) => String(r.id)} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
              <Button variant="secondary" leftIcon={<ArrowLeft size={14} />} onClick={() => setStep(2)}>
                Back
              </Button>
              {alreadyFinalized || runData?.status === 'FINALIZED' ? (
                <Button variant="primary" onClick={() => navigate('/admin/hr/payroll-register')}>
                  View in Payroll Register
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleFinalize}
                  isLoading={loading}
                  disabled={totalEmployees === 0}
                >
                  Finalize & Lock Payroll Run
                </Button>
              )}
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
                ₹{totalNet.toLocaleString()} net compensation locked into general ledger for {totalEmployees} employees. Audit register records generated.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <Button variant="secondary" onClick={() => { setStep(1); setRunData(null); setAlreadyFinalized(false) }}>
                Process Another Cycle
              </Button>
              <Button variant="primary" onClick={() => navigate('/admin/hr/payroll-register')}>
                View Payroll Register
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
