import React, { useState } from 'react'
import { Modal, Button } from '@/components/ui'
import {
  importStudentDemographicsCSV,
  importRoomsCSV,
  type StudentDemographicsCSVImportResponse,
  type RoomInventoryCSVImportResponse
} from '../api'
import { Download, Upload, CheckCircle2, AlertTriangle, RefreshCw, Users, BedSingle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

interface DemographicsImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type ImportMode = 'DEMOGRAPHICS' | 'ROOMS'

const SAMPLE_DEMOGRAPHICS_CSV = `global_student_id,gender,is_hostel_eligible,remarks
STU-2023-000001,MALE,1,Verified demographic from admissions registry
STU-2023-000002,FEMALE,1,Verified female resident
STU-2023-000003,COED,1,Verified coed eligible resident`

const SAMPLE_ROOMS_CSV = `Hostel Name,Room Number,Gender Block,Bed Capacity,Readiness Status
"Boys Hostel A",101,MALE,4,READY
"Girls Hostel B",101,FEMALE,4,READY
"Hall of Innovation",101,COED,2,READY`

export function DemographicsImportModal({ isOpen, onClose, onSuccess }: DemographicsImportModalProps) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<ImportMode>('DEMOGRAPHICS')
  const [csvContent, setCsvContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [demoResult, setDemoResult] = useState<StudentDemographicsCSVImportResponse | null>(null)
  const [roomResult, setRoomResult] = useState<RoomInventoryCSVImportResponse | null>(null)

  const activeSample = mode === 'DEMOGRAPHICS' ? SAMPLE_DEMOGRAPHICS_CSV : SAMPLE_ROOMS_CSV

  const handleDownloadTemplate = () => {
    const filename = mode === 'DEMOGRAPHICS'
      ? 'hostel_student_demographics_template.csv'
      : 'hostel_room_inventory_template.csv'
    const blob = new Blob([activeSample], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Template ${filename} downloaded`)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = (event.target?.result as string) || ''
      setCsvContent(content)

      // Intelligent Auto-Detection of CSV type based on headers
      const lower = content.toLowerCase()
      if (lower.includes('room number') || lower.includes('bed capacity') || lower.includes('hostel name')) {
        setMode('ROOMS')
      } else if (lower.includes('student_id') || lower.includes('global_student_id') || lower.includes('eligib')) {
        setMode('DEMOGRAPHICS')
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!csvContent.trim()) {
      toast.error('Please select a CSV file or paste valid CSV content.')
      return
    }

    let effectiveMode = mode
    const lower = csvContent.toLowerCase()
    if (lower.includes('room number') || lower.includes('bed capacity') || lower.includes('hostel name') || lower.includes('room_number')) {
      effectiveMode = 'ROOMS'
      setMode('ROOMS')
    } else if (lower.includes('student_id') || lower.includes('global_student_id') || lower.includes('eligib')) {
      effectiveMode = 'DEMOGRAPHICS'
      setMode('DEMOGRAPHICS')
    }

    setIsSubmitting(true)
    setDemoResult(null)
    setRoomResult(null)

    try {
      if (effectiveMode === 'DEMOGRAPHICS') {
        const response = await importStudentDemographicsCSV(csvContent)
        setDemoResult(response)
        toast.success(`Processed ${response.total_processed} students: ${response.updated_count} updated.`)
      } else {
        const response = await importRoomsCSV(csvContent)
        setRoomResult(response)
        queryClient.invalidateQueries({ queryKey: ['rooms'] })
        queryClient.invalidateQueries({ queryKey: ['hostels'] })
        queryClient.invalidateQueries({ queryKey: ['occupancy'] })
        toast.success(`Processed ${response.total_processed} rooms: ${response.created_count} created, ${response.updated_count} updated.`)
      }
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'CSV import failed. Check format and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setCsvContent('')
    setDemoResult(null)
    setRoomResult(null)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hostel Operations CSV Import Center"
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Mode Selector Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--color-surface-subtle)',
          borderRadius: '8px',
          padding: '4px',
          border: '1px solid var(--color-border)'
        }}>
          <button
            onClick={() => { setMode('DEMOGRAPHICS'); setDemoResult(null); setRoomResult(null); }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: mode === 'DEMOGRAPHICS' ? 700 : 500,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: mode === 'DEMOGRAPHICS' ? 'var(--color-surface)' : 'transparent',
              color: mode === 'DEMOGRAPHICS' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              boxShadow: mode === 'DEMOGRAPHICS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={16} />
            Student Demographics & Eligibility
          </button>
          <button
            onClick={() => { setMode('ROOMS'); setDemoResult(null); setRoomResult(null); }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: mode === 'ROOMS' ? 700 : 500,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: mode === 'ROOMS' ? 'var(--color-surface)' : 'transparent',
              color: mode === 'ROOMS' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              boxShadow: mode === 'ROOMS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <BedSingle size={16} />
            Room Inventory & Capacities
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          {mode === 'DEMOGRAPHICS' ? (
            <>
              Safely update resident eligibility and authoritative gender using official IDs (<code>global_student_id</code>).
              Changes link directly to existing student records without creating duplicate profiles.
            </>
          ) : (
            <>
              Bulk import or update residence hall rooms, gender wings, bed capacities, and readiness status.
              Existing rooms are updated without displacing current occupants.
            </>
          )}
        </p>

        {/* Action Header: Download Template & Info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--color-surface-subtle)',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>
              {mode === 'DEMOGRAPHICS' ? 'Student Demographics Format' : 'Room Inventory Format'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              {mode === 'DEMOGRAPHICS'
                ? <code>global_student_id, gender, is_hostel_eligible, remarks</code>
                : <code>Hostel Name, Room Number, Gender Block, Bed Capacity, Readiness Status</code>}
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={handleDownloadTemplate}
          >
            Download Sample CSV
          </Button>
        </div>

        {/* File Input */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
            Select CSV File from Computer
          </label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            style={{
              display: 'block',
              width: '100%',
              fontSize: '13px',
              padding: '8px',
              border: '1px dashed var(--color-border)',
              borderRadius: '6px',
              background: 'var(--color-surface)',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Raw CSV Textarea */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Or Review / Paste CSV Content
            </label>
            {csvContent && (
              <button
                onClick={handleReset}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer'
                }}
              >
                Clear Content
              </button>
            )}
          </div>
          <textarea
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            rows={7}
            placeholder={activeSample}
            style={{
              width: '100%',
              fontFamily: 'monospace',
              fontSize: '12px',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              lineHeight: 1.4,
              resize: 'vertical'
            }}
          />
        </div>

        {/* Demographics Import Results Box */}
        {demoResult && (
          <div style={{
            background: demoResult.updated_count > 0 ? '#F0FDF4' : '#FFFBEB',
            border: `1px solid ${demoResult.updated_count > 0 ? '#BBF7D0' : '#FDE68A'}`,
            borderRadius: '8px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {demoResult.updated_count > 0 ? (
                <CheckCircle2 size={18} color="#16A34A" />
              ) : (
                <AlertTriangle size={18} color="#D97706" />
              )}
              <strong style={{ fontSize: '13px', color: demoResult.updated_count > 0 ? '#166534' : '#92400E' }}>
                Demographics Batch Summary
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--color-text-primary)', flexWrap: 'wrap' }}>
              <div>Total Processed: <strong>{demoResult.total_processed}</strong></div>
              <div>Successfully Updated: <strong style={{ color: '#16A34A' }}>{demoResult.updated_count}</strong></div>
              <div>Skipped / Unmatched: <strong style={{ color: '#D97706' }}>{demoResult.skipped_count}</strong></div>
            </div>

            {demoResult.errors.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#991B1B', marginBottom: '4px' }}>Notes / Warnings:</div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#991B1B' }}>
                  {demoResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Room Inventory Import Results Box */}
        {roomResult && (
          <div style={{
            background: (roomResult.created_count > 0 || roomResult.updated_count > 0) ? '#F0FDF4' : '#FFFBEB',
            border: `1px solid ${(roomResult.created_count > 0 || roomResult.updated_count > 0) ? '#BBF7D0' : '#FDE68A'}`,
            borderRadius: '8px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(roomResult.created_count > 0 || roomResult.updated_count > 0) ? (
                <CheckCircle2 size={18} color="#16A34A" />
              ) : (
                <AlertTriangle size={18} color="#D97706" />
              )}
              <strong style={{ fontSize: '13px', color: (roomResult.created_count > 0 || roomResult.updated_count > 0) ? '#166534' : '#92400E' }}>
                Room Inventory Batch Summary
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--color-text-primary)', flexWrap: 'wrap' }}>
              <div>Total Processed: <strong>{roomResult.total_processed}</strong></div>
              <div>New Rooms Created: <strong style={{ color: '#16A34A' }}>{roomResult.created_count}</strong></div>
              <div>Rooms Updated: <strong style={{ color: '#0284C7' }}>{roomResult.updated_count}</strong></div>
              <div>Skipped / Errors: <strong style={{ color: '#D97706' }}>{roomResult.skipped_count}</strong></div>
            </div>

            {roomResult.errors.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#991B1B', marginBottom: '4px' }}>Notes / Warnings:</div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#991B1B' }}>
                  {roomResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Dialog Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <Button variant="tertiary" onClick={onClose}>
            {(demoResult || roomResult) ? 'Done' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            leftIcon={isSubmitting ? <RefreshCw className="animate-spin" size={14} /> : <Upload size={14} />}
            isLoading={isSubmitting}
            onClick={handleImport}
          >
            {mode === 'DEMOGRAPHICS' ? 'Run Demographics Import' : 'Run Room Inventory Import'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
