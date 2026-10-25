import React, { useEffect } from 'react'
import { Card, Button, Input, Select, Alert } from '@/components/ui'
import { useCreateMyRequest, useMyHostel, useHostels } from '../hooks'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { RequestType } from '../api'
import { Home, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react'

const requestSchema = z.object({
  request_type: z.enum(['ALLOCATION', 'ROOM_CHANGE', 'VACATE']),
  details: z.string().optional()
})

export function S05NewHostelRequestPage() {
  const [searchParams] = useSearchParams()
  const defaultType = (searchParams.get('type') as RequestType) || 'ALLOCATION'
  
  const { data: allocation, isLoading: allocLoading } = useMyHostel()
  const { data: hostels = [] } = useHostels()
  const createRequest = useCreateMyRequest()
  const navigate = useNavigate()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: { request_type: defaultType, details: '' }
  })

  const selectedType = watch('request_type')

  useEffect(() => {
    if (!allocLoading) {
      if (allocation && allocation.status !== 'VACATED' && selectedType === 'ALLOCATION') {
        setValue('request_type', 'ROOM_CHANGE')
      } else if ((!allocation || allocation.status === 'VACATED') && selectedType !== 'ALLOCATION') {
        setValue('request_type', 'ALLOCATION')
      }
    }
  }, [allocation, allocLoading, selectedType, setValue])

  const onSubmit = (data: any) => {
    createRequest.mutate(data, {
      onSuccess: () => {
        navigate('/student/hostel/requests')
      }
    })
  }

  if (allocLoading) return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading allocation status...</div>

  const hasAllocation = allocation && allocation.status !== 'VACATED'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              HOS-05
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Submit Hostel Request
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Apply for on-campus residential accommodation, room transfers, or vacate clearance.
          </p>
        </div>
        <Button variant="subtle" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/student/hostel')}>
          Back
        </Button>
      </div>

      {hasAllocation && (
        <Alert variant="info" title="Existing Hall Allocation Active">
          You currently hold an active room allotment. You may submit a request for a Room Transfer or to Vacate your current room.
        </Alert>
      )}

      <Card padding={24}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--color-text-primary)' }}>
              Select Request Nature
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {[
                { type: 'ALLOCATION' as const, label: 'New Allocation', desc: 'Fresh room allotment', disabled: hasAllocation },
                { type: 'ROOM_CHANGE' as const, label: 'Room Transfer', desc: 'Transfer wing or floor', disabled: !hasAllocation },
                { type: 'VACATE' as const, label: 'Vacate Hostel', desc: 'Relinquish room key', disabled: !hasAllocation },
              ].map(item => (
                <div
                  key={item.type}
                  onClick={() => !item.disabled && setValue('request_type', item.type)}
                  style={{
                    border: `1.5px solid ${selectedType === item.type ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: '8px',
                    padding: '14px',
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    opacity: item.disabled ? 0.5 : 1,
                    background: selectedType === item.type ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '14px', color: selectedType === item.type ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(selectedType === 'ALLOCATION' || selectedType === 'ROOM_CHANGE') && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                Preferred Residence Hall (Optional)
              </label>
              <Select
                options={[
                  { label: 'No Specific Preference', value: '' },
                  ...hostels.map(h => ({ label: `${h.name} (${h.gender_block} Block)`, value: h.name }))
                ]}
                onChange={(e) => {
                  const currentVal = watch('details') || ''
                  const pref = e.target.value ? `Preference: ${e.target.value}\n` : ''
                  setValue('details', pref + currentVal.replace(/^Preference: .*\n/, ''))
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              Justification & Medical / Academic Notes
            </label>
            <textarea
              {...register('details')}
              rows={4}
              placeholder={selectedType === 'VACATE' ? "State reason for vacating (e.g. Day Scholar conversion, graduation)..." : "Specific requirements (e.g. ground floor request due to medical injury)..."}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
            <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" variant="primary" leftIcon={<Send size={14} />} isLoading={createRequest.isPending}>
              Submit Request
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
