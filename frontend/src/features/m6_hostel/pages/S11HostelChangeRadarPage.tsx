import React, { useState } from 'react'
import { Card, StatCard, Table, type Column, StatusPill, Button } from '@/components/ui'
import { useRooms, useHostels } from '../hooks'
import { getChangeImpactRadar } from '../api'
import type { ImpactRadarResponse, ImpactAffectedResident, Room } from '../api'
import { Radio, AlertTriangle, Users, Bed, CheckCircle2, ArrowRight, RefreshCw, ShieldAlert } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export function S11HostelChangeRadarPage() {
  const { data: hostels = [] } = useHostels()
  const [selectedHostelId, setSelectedHostelId] = useState<number | undefined>()
  const { data: rooms = [] } = useRooms(selectedHostelId)

  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([])
  const [impactReport, setImpactReport] = useState<ImpactRadarResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const navigate = useNavigate()

  const handleToggleRoom = (roomId: number) => {
    setSelectedRoomIds(prev =>
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    )
  }

  const runAnalysis = async () => {
    if (selectedRoomIds.length === 0) {
      toast.error('Please select at least one room to analyze impact')
      return
    }

    setIsAnalyzing(true)
    try {
      const res = await getChangeImpactRadar({
        target_action: 'CLOSE_ROOM',
        target_room_ids: selectedRoomIds,
        closed_room_ids: selectedRoomIds
      })
      setImpactReport(res)
    } catch (err: any) {
      toast.error(err.message || 'Impact analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const columns: Column<ImpactAffectedResident>[] = [
    {
      header: 'Resident Student',
      key: 'student_id',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.student_name}</div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{r.global_student_id}</div>
        </div>
      )
    },
    {
      header: 'Currently Displaced From',
      key: 'room_number',
      render: (r) => (
        <span style={{ fontWeight: 600, color: 'var(--color-error)' }}>
          {r.hostel_name} - Room {r.room_number}
        </span>
      )
    },
    {
      header: 'Recommended Alternate Room',
      key: 'suggested_alternate_room_number',
      render: (r) => (
        r.suggested_alternate_room_number ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: '#F0FDF4',
              color: '#166534',
              border: '1px solid #BBF7D0'
            }}>
              Room {r.suggested_alternate_room_number}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Compatible gender block</span>
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--color-error)', fontWeight: 600 }}>
            No immediate vacancy in same hall
          </span>
        )
      )
    },
    {
      header: 'Action',
      key: 'student_id',
      render: (r) => (
        <Button
          variant="subtle"
          size="sm"
          onClick={() => navigate(`/admin/hostel/room-allocation?student_id=${r.student_id}&room_id=${r.suggested_alternate_room_id || ''}`)}
        >
          Transfer Resident
        </Button>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: '4px' }}>
            FLAGSHIP D
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Hostel Change Impact Radar
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Pre-closure disruption analysis. Evaluate student displacement, capacity losses, and automated alternate room reallocations before executing renovations.
        </p>
      </div>

      {/* Room Selection Toolbar */}
      <Card padding={20}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              1. Select Planned Room Closures
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {selectedRoomIds.length} room(s) marked for closure
              </span>
              {selectedRoomIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setSelectedRoomIds([]); setImpactReport(null) }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#D97706',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0
                  }}
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={selectedHostelId?.toString() || ''}
              onChange={(e) => {
                setSelectedHostelId(e.target.value ? parseInt(e.target.value) : undefined)
              }}
              style={{
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                padding: '8px 12px',
                fontSize: '13px',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="">All Hostels ({rooms.length} rooms)</option>
              {hostels.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.gender_block})</option>
              ))}
            </select>

            <Button
              variant="primary"
              leftIcon={<Radio size={14} />}
              onClick={runAnalysis}
              isLoading={isAnalyzing}
              disabled={selectedRoomIds.length === 0}
            >
              Analyze Impact
            </Button>
          </div>
        </div>

        {/* Room Picker Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '8px',
          maxHeight: '200px',
          overflowY: 'auto',
          padding: '4px'
        }}>
          {rooms.map(r => {
            const isSelected = selectedRoomIds.includes(r.id)
            const isOccupied = r.bed_capacity > r.available_beds
            return (
              <div
                key={r.id}
                onClick={() => handleToggleRoom(r.id)}
                style={{
                  border: `1.5px solid ${isSelected ? '#D97706' : 'var(--color-border)'}`,
                  borderRadius: '6px',
                  padding: '8px 10px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isSelected ? '#FEF3C7' : 'var(--color-surface)',
                  transition: 'all 0.15s ease',
                  minWidth: 0
                }}
              >
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere'
                }}>
                  Room {r.room_number}
                </div>
                <div style={{ fontSize: '10px', color: isOccupied ? 'var(--color-error)' : 'var(--color-text-muted)', marginTop: '2px' }}>
                  {isOccupied ? `${r.bed_capacity - r.available_beds} residents` : 'Vacant'}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Impact Radar Report */}
      {impactReport && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Risk Indicator */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <StatCard
              label="Impact Severity Level"
              value={impactReport.severity_level}
              tone={impactReport.severity_level === 'BLOCKING' || impactReport.severity_level === 'HIGH' ? 'error' : impactReport.severity_level === 'MEDIUM' ? 'warning' : 'positive'}
              icon={<ShieldAlert size={18} />}
              description="Overall operational risk assessment"
            />
            <StatCard
              label="Displaced Students"
              value={`${impactReport.displaced_residents_count} Residents`}
              tone={impactReport.displaced_residents_count > 0 ? 'error' : 'positive'}
              icon={<Users size={18} />}
              description="Active occupants needing relocation"
            />
            <StatCard
              label="Immediate Bed Capacity Loss"
              value={`-${impactReport.capacity_loss} Beds`}
              tone="warning"
              icon={<Bed size={18} />}
              description="Offline during maintenance window"
            />
          </div>

          {/* Mitigation Strategies Card */}
          {impactReport.mitigation_options.length > 0 && (
            <Card padding={16}>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Radar Disruption Mitigation Strategy
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {impactReport.mitigation_options.map((option, idx) => (
                  <li key={idx}><strong>{option}</strong></li>
                ))}
              </ul>
            </Card>
          )}

          {/* Affected Residents Table */}
          <Card padding={0}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Displaced Resident Reassignment Roster
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Identified occupants and automatically matched vacant alternates
                </span>
              </div>
            </div>

            <Table
              data={impactReport.affected_residents}
              columns={columns}
              keyExtractor={(r) => `${r.student_id}-${r.room_id}`}
              emptyMessage="No residents are currently displaced by the selected room closures (all chosen rooms are vacant)."
            />
          </Card>
        </div>
      )}
    </div>
  )
}
