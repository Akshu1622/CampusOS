import React, { useState } from 'react'
import { Card, StatCard, Button, Select, StatusPill, Drawer } from '@/components/ui'
import { useHostels, useRooms, useAllocations } from '../hooks'
import type { Room, HostelAllocation } from '../api'
import { MapPin, Home, Bed, Users, Plus, UserCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function S14VisualHostelMapPage() {
  const { data: hostels = [] } = useHostels()
  const [selectedHostelId, setSelectedHostelId] = useState<number | undefined>(hostels[0]?.id)

  const currentHostelId = selectedHostelId || hostels[0]?.id
  const { data: rooms = [], isLoading: roomsLoading } = useRooms(currentHostelId)
  const { data: activeAllocations = [] } = useAllocations({ hostel_id: currentHostelId, status: 'ACTIVE' })

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const navigate = useNavigate()

  const currentHostel = hostels.find(h => h.id === currentHostelId)

  // Room metrics
  const totalRooms = rooms.length
  const totalBeds = rooms.reduce((sum, r) => sum + r.bed_capacity, 0)
  const availableBeds = rooms.reduce((sum, r) => sum + r.available_beds, 0)
  const occupiedBeds = totalBeds - availableBeds
  const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  const roomOccupants: HostelAllocation[] = selectedRoom
    ? activeAllocations.filter(a => a.room_id === selectedRoom.id)
    : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              HOS-14
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Interactive Visual Hostel Floor Map
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Spatial layout visualization. Inspect real-time room occupancy, vacant bed placements, and room rosters at a glance.
          </p>
        </div>

        <div style={{ width: '240px' }}>
          <Select
            value={currentHostelId?.toString() || ''}
            onChange={(e) => setSelectedHostelId(e.target.value ? parseInt(e.target.value) : undefined)}
            options={hostels.map(h => ({ label: `${h.name} (${h.gender_block})`, value: h.id.toString() }))}
          />
        </div>
      </div>

      {/* Hall Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Hall Gender Block"
          value={currentHostel?.gender_block || 'COED'}
          tone="neutral"
          icon={<Home size={18} />}
          description={currentHostel?.name || 'Selected Hall'}
        />
        <StatCard
          label="Total Hall Capacity"
          value={`${totalBeds} Beds`}
          tone="neutral"
          icon={<Bed size={18} />}
          description={`Across ${totalRooms} rooms`}
        />
        <StatCard
          label="Currently Occupied"
          value={`${occupiedBeds} Beds`}
          tone="accent"
          icon={<Users size={18} />}
          description={`${occupancyPct}% Hall Density`}
        />
        <StatCard
          label="Available Vacancies"
          value={`${availableBeds} Beds`}
          tone="positive"
          icon={<UserCheck size={18} />}
          description="Ready for immediate assignment"
        />
      </div>

      {/* Legend & Visual Map Canvas */}
      <Card padding={24}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Floor Plan & Room Grid: {currentHostel?.name || 'Hostel'}
            </h3>
          </div>

          {/* Color Legend */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#D1FAE5', border: '1px solid #10B981' }} />
              <span>Available (2+ beds)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#FEF3C7', border: '1px solid #F59E0B' }} />
              <span>1 Bed Remaining</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#FEE2E2', border: '1px solid #EF4444' }} />
              <span>Fully Occupied (0 beds)</span>
            </div>
          </div>
        </div>

        {roomsLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading floor schematic...</div>
        ) : rooms.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No rooms configured for this hostel yet.</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '14px'
          }}>
            {rooms.map(room => {
              const isFull = room.available_beds <= 0
              const isLow = room.available_beds === 1
              const isSelected = selectedRoom?.id === room.id

              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  style={{
                    padding: '14px 12px',
                    borderRadius: '8px',
                    border: `2px solid ${isSelected ? 'var(--color-primary, #0D9488)' : isFull ? '#FCA5A5' : isLow ? '#FCD34D' : '#86EFAC'}`,
                    background: isFull ? '#FEF2F2' : isLow ? '#FFFBEB' : '#F0FDF4',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    boxShadow: isSelected ? '0 0 0 3px rgba(13,148,136,0.2)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-text-primary)' }}>
                      R-{room.room_number}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: 'white',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {room.gender_block || 'COED'}
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    Capacity: <strong>{room.bed_capacity} Beds</strong>
                  </div>

                  <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    marginTop: '2px',
                    color: isFull ? '#DC2626' : isLow ? '#D97706' : '#16A34A'
                  }}>
                    {isFull ? 'NO VACANCY' : `${room.available_beds} Vacant`}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Room Occupants Drawer */}
      <Drawer
        isOpen={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
        title={selectedRoom ? `Room ${selectedRoom.room_number} Occupancy Profile` : ''}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setSelectedRoom(null)}>Close</Button>
            {selectedRoom && selectedRoom.available_beds > 0 && (
              <Button
                variant="primary"
                onClick={() => navigate(`/admin/hostel/room-allocation?room_id=${selectedRoom.id}`)}
              >
                Allot Bed in this Room
              </Button>
            )}
          </div>
        }
      >
        {selectedRoom && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-text-primary)' }}>
                  Room {selectedRoom.room_number}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {currentHostel?.name} • {selectedRoom.gender_block} Block
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-primary, #0D9488)' }}>
                  {selectedRoom.bed_capacity - selectedRoom.available_beds} / {selectedRoom.bed_capacity} Beds
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Occupied</div>
              </div>
            </div>

            <h4 style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Resident Roster
            </h4>

            {roomOccupants.length === 0 ? (
              <div style={{
                padding: '28px',
                textAlign: 'center',
                background: 'var(--color-surface-subtle)',
                borderRadius: '8px',
                border: '1px dashed var(--color-border)',
                color: 'var(--color-text-muted)',
                fontSize: '13px'
              }}>
                This room currently has no residents assigned. All {selectedRoom.bed_capacity} beds are available.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {roomOccupants.map(alloc => (
                  <div
                    key={alloc.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                        {alloc.student_name}
                      </div>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {alloc.global_student_id}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        Allotted: {new Date(alloc.from_date).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'var(--color-primary-subtle, #F0FDFA)',
                      color: 'var(--color-primary, #0D9488)',
                      border: '1px solid var(--color-border)'
                    }}>
                      {alloc.bed_number || 'Bed 1'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
