import React, { useState, useEffect } from 'react'
import { Modal, Button } from '@/components/ui'
import { getAllocationLetter, type AllocationLetterResponse } from '../api'
import { Printer, Download, CheckCircle2, Building2, ShieldCheck, FileText, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AllocationLetterModalProps {
  isOpen: boolean
  onClose: () => void
  allocationId: number | null
}

export function AllocationLetterModal({ isOpen, onClose, allocationId }: AllocationLetterModalProps) {
  const [letter, setLetter] = useState<AllocationLetterResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && allocationId) {
      setIsLoading(true)
      setError(null)
      getAllocationLetter(allocationId)
        .then((res) => {
          setLetter(res)
        })
        .catch((err) => {
          setError(err.message || 'Failed to generate allocation letter.')
          toast.error('Could not generate allotment letter')
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setLetter(null)
    }
  }, [isOpen, allocationId])

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Residential Allotment Order"
      size="lg"
    >
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
          <FileText className="animate-pulse" size={36} style={{ margin: '0 auto 12px' }} />
          <div>Generating official cryptographic allotment sanction...</div>
        </div>
      )}

      {error && !isLoading && (
        <div style={{
          padding: '16px',
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '8px',
          color: '#991B1B',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
      )}

      {letter && !isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Printable Letterhead Document Container */}
          <div
            id="allotment-letter-printable"
            style={{
              background: '#FFFFFF',
              color: '#0F172A',
              padding: '28px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            {/* Header / Crest */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0F172A',
              paddingBottom: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: '#0F172A',
                  color: '#FFFFFF',
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building2 size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    CampusOS University
                  </h2>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                    Office of Residential Life & Student Housing Services
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>ORDER REFERENCE</div>
                <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'monospace', color: '#0D9488' }}>
                  {letter.letter_id}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                  Date: {new Date(letter.issued_date).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '10px 16px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Official Hostel Room Allotment Sanction Letter
              </span>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                Academic Term: <strong>{letter.academic_term}</strong>
              </div>
            </div>

            {/* Student & Allotment Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '20px'
            }}>
              {/* Resident Identity */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '14px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Resident Student Identity
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                  {letter.student.full_name}
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#0D9488', fontWeight: 600, marginTop: '2px' }}>
                  Official ID: {letter.student.global_student_id}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
                  Gender / Eligibility: <strong>{letter.student.gender || 'Verified'}</strong>
                </div>
                {letter.student.email && (
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                    Email: {letter.student.email}
                  </div>
                )}
              </div>

              {/* Sanctioned Room Details */}
              <div style={{
                background: '#F0FDFA',
                border: '1px solid #99F6E4',
                borderRadius: '6px',
                padding: '14px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F766E', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Sanctioned Accommodation
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#134E4A' }}>
                  {letter.accommodation.hostel_name}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F766E', marginTop: '2px' }}>
                  Room {letter.accommodation.room_number} • {letter.accommodation.bed_number || 'Bed Standard'}
                </div>
                <div style={{ fontSize: '12px', color: '#115E59', marginTop: '6px' }}>
                  Block Type: <strong>{letter.accommodation.gender_block}</strong>
                </div>
                <div style={{ fontSize: '11px', color: '#134E4A', marginTop: '2px' }}>
                  Valid From: <strong>{new Date(letter.accommodation.from_date).toLocaleDateString()}</strong>
                </div>
              </div>
            </div>

            {/* Rules and Terms */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', marginBottom: '6px' }}>
                Residential Regulations & Undertaking
              </div>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '11px', color: '#334155', lineHeight: 1.6 }}>
                {letter.rules_and_terms.map((term, idx) => (
                  <li key={idx}>{term}</li>
                ))}
              </ol>
            </div>

            {/* Warden Endorsement Seal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderTop: '1px dashed #CBD5E1',
              paddingTop: '16px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16A34A', fontSize: '11px', fontWeight: 600 }}>
                  <ShieldCheck size={16} />
                  <span>Digitally Endorsed Order</span>
                </div>
                <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748B', marginTop: '2px' }}>
                  Verification Stamp: {letter.warden_endorsement.verification_code}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'serif',
                  fontStyle: 'italic',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#0F172A',
                  marginBottom: '2px'
                }}>
                  {letter.warden_endorsement.digital_signature}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A', borderTop: '1px solid #94A3B8', paddingTop: '2px' }}>
                  {letter.warden_endorsement.warden_title}
                </div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>
                  {letter.warden_endorsement.institution_name}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="tertiary" onClick={onClose}>Close</Button>
            <Button variant="primary" leftIcon={<Printer size={15} />} onClick={handlePrint}>
              Print Allotment Slip
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
