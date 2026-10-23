import React from 'react'
import { Card, Button, StatusPill } from '@/components/ui'
import { Download, Printer, CheckCircle, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const PaymentConfirmationReceiptPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '840px', margin: '0 auto' }}>
      {/* Banner */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '8px',
        background: 'var(--color-success-bg)',
        border: '1px solid var(--color-success)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--color-success)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-success)' }}>
              Payment Completed Successfully
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Voucher <strong style={{ fontFamily: 'monospace' }}>REC-2026-001</strong> generated and settled into the student ledger.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Printer size={14} />}
            onClick={() => window.print()}
          >
            Print
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={() => alert('Downloading authentic signed PDF...')}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Printable Receipt Paper */}
      <Card padding={32}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '24px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
              CampusOS University
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Office of the Bursar & Financial Controller • Academic Tax Invoice
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              OFFICIAL RECEIPT
            </span>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '16px', color: 'var(--color-primary)', marginTop: '4px' }}>
              REC-2026-001
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Date: 2026-10-23
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Received From
            </div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>Aarav Sharma</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>Roll: CS2023-042</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>B.Tech Computer Science and Engineering</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Transaction Reference
            </div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>UPI / HDFC / 9912083</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Settled: Instant Real-time</div>
            <div style={{ marginTop: '4px' }}>
              <StatusPill label="CLEARED & PAID" status="success" />
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              <th style={{ paddingBottom: '10px' }}>Fee Head Description</th>
              <th style={{ paddingBottom: '10px' }}>Academic Term</th>
              <th style={{ paddingBottom: '10px', textAlign: 'right' }}>Amount (INR)</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '14px' }}>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '12px 0' }}>Semester Tuition Fee</td>
              <td style={{ padding: '12px 0', color: 'var(--color-text-secondary)' }}>Fall 2026</td>
              <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600 }}>₹45,000.00</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '12px 0' }}>Engineering Laboratory & Facilities</td>
              <td style={{ padding: '12px 0', color: 'var(--color-text-secondary)' }}>Fall 2026</td>
              <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600 }}>₹5,000.00</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '12px 0' }}>Examination Registration Surcharge</td>
              <td style={{ padding: '12px 0', color: 'var(--color-text-secondary)' }}>Fall 2026</td>
              <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600 }}>₹250.00</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} style={{ paddingTop: '16px', fontWeight: 700, fontSize: '16px' }}>Total Amount Paid</td>
              <td style={{ paddingTop: '16px', textAlign: 'right', fontWeight: 800, fontSize: '18px', color: 'var(--color-primary)' }}>
                ₹50,250.00
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Footer Note */}
        <div style={{
          fontSize: '12px',
          color: 'var(--color-text-muted)',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>Authorized Computer-Generated Tax Document. No physical signature required.</div>
          <Button variant="subtle" size="sm" leftIcon={<ArrowLeft size={13} />} onClick={() => navigate('/student/fees')}>
            Return to Fees
          </Button>
        </div>
      </Card>
    </div>
  )
}
