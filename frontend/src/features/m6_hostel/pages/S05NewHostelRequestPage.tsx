import React, { useEffect, useState } from 'react'
import { Card, Button, Input, Select, Alert } from '@/components/ui'
import { useCreateMyRequest, useMyHostel, useHostels, useRooms, useMyRequests } from '../hooks'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { RequestType } from '../api'
import { Home, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function S05NewHostelRequestPage() {
  const [searchParams] = useSearchParams()
  const defaultType = (searchParams.get('type') as RequestType) || 'ALLOCATION'
  
  const { data: allocation, isLoading: allocLoading } = useMyHostel()
  const { data: hostels = [] } = useHostels()
  const { data: pendingRequests = [] } = useMyRequests('PENDING')

  const [preferredHostelId, setPreferredHostelId] = useState<number | undefined>()
  const { data: rooms = [] } = useRooms(preferredHostelId)
  const [preferredRoomId, setPreferredRoomId] = useState<number | undefined>()

  const [requestType, setRequestType] = useState<RequestType>(defaultType)
  const [details, setDetails] = useState('')

  const createRequest = useCreateMyRequest()
  const navigate = useNavigate()

  const hasAllocation = allocation && allocation.status !== 'VACATED'
  const hasPendingRequest = pendingRequests.length > 0

  useEffect(() => {
    if (!allocLoading) {
      if (hasAllocation && requestType === 'ALLOCATION') {
        setRequestType('ROOM_CHANGE')
      } else if (!hasAllocation && requestType !== 'ALLOCATION') {
        setRequestType('ALLOCATION')
      }
    }
  }, [hasAllocation, allocLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (hasPendingRequest) {
      toast.error('You already have a pending hostel request awaiting warden review.')
      return
    }

    createRequest.mutate({
      request_type: requestType,
      preferred_hostel_id: preferredHostelId || undefined,
      preferred_room_id: preferredRoomId || undefined,
      details: details.trim() || undefined
    }, {
      onSuccess: () => {
        navigate('/student/hostel/requests')
      }
    })
  }

  if (allocLoading) {
    return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading accommodation status...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              HOS-05
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              New Hostel Request & Application
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Apply for on-campus residential accommodation, room transfers, or vacate clearance.
          </p>
        </div>
        <Button variant="subtle" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/student/hostel')}>
          Back to Portal
        </Button>
      </div>

      {hasPendingRequest && (
        <Alert variant="warning" title="Pending Application Detected">
          You currently have a pending request awaiting administrative sanction. University policy restricts multiple active applications concurrently.
        </Alert>
      )}

      {hasAllocation && (
        <Alert variant="info" title="Existing Hall Allocation Active">
          You are currently allotted to <strong>{allocation.hostel_name} - Room {allocation.room_number}</strong>. You may submit a request for a Room Transfer or to Vacate your current room.
        </Alert>
      )}

      <Card padding={24}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--color-text-primary)' }}>
              Select Request Nature
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {[
                { type: 'ALLOCATION' as const, label: 'New Allocation', desc: 'Fresh room allotment', disabled: !!hasAllocation },
                { type: 'ROOM_CHANGE' as const, label: 'Room Transfer', desc: 'Transfer hall or wing', disabled: !hasAllocation },
                { type: 'VACATE' as const, label: 'Vacate Hostel', desc: 'Relinquish room tenancy', disabled: !hasAllocation },
              ].map(item => (
                <div
                  key={item.type}
                  onClick={() => !item.disabled && setRequestType(item.type)}
                  style={{
                    border: `1.5px solid ${requestType === item.type ? 'var(--color-primary, #0D9488)' : 'var(--color-border)'}`,
                    borderRadius: '8px',
                    padding: '14px',
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    opacity: item.disabled ? 0.45 : 1,
                    background: requestType === item.type ? 'var(--color-primary-subtle, #F0FDFA)' : 'var(--color-surface)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '14px', color: requestType === item.type ? 'var(--color-primary, #0D9488)' : 'var(--color-text-primary)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(requestType === 'ALLOCATION' || requestType === 'ROOM_CHANGE') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                  Preferred Residence Hall (Optional)
                </label>
                <Select
                  value={preferredHostelId?.toString() || ''}
                  onChange={(e) => {
                    const id = e.target.value ? parseInt(e.target.value) : undefined
                    setPreferredHostelId(id)
                    setPreferredRoomId(undefined)
                  }}
                  options={[
                    { label: 'No Specific Preference', value: '' },
                    ...hostels.map(h => ({ label: `${h.name} (${h.gender_block} Block)`, value: h.id.toString() }))
                  ]}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                  Preferred Room (Optional)
                </label>
                <Select
                  value={preferredRoomId?.toString() || ''}
                  onChange={(e) => setPreferredRoomId(e.target.value ? parseInt(e.target.value) : undefined)}
                  disabled={!preferredHostelId}
                  options={[
                    { label: 'Any Vacant Room', value: '' },
                    ...rooms.map(r => ({ label: `Room ${r.room_number} (${r.available_beds} beds free)`, value: r.id.toString() }))
                  ]}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              Justification & Medical / Academic Notes
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder={requestType === 'VACATE' ? "State reason for vacating (e.g. Day Scholar conversion, graduation)..." : "State preferences or justification (e.g. ground floor request due to medical injury, quiet study floor)..."}
              style={{
                width: '100%',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                padding: '10px 12px',
                fontSize: '14px',
                fontFamily: 'inherit',
                color: 'var(--color-text-primary)',
                background: 'var(--color-surface)',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
            <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Send size={14} />}
              isLoading={createRequest.isPending}
              disabled={hasPendingRequest}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
