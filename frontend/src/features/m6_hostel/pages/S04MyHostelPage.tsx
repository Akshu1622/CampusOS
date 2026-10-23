import React from 'react'
import { Card, StatCard, Button, StatusPill, EmptyState, LoadingSkeleton } from '@/components/ui'
import { useMyHostel, useHostels, useRooms } from '../hooks'
import { useNavigate } from 'react-router-dom'
import { Home, Bed, Calendar, Mail, Info, RefreshCw, LogOut } from 'lucide-react'

export function S04MyHostelPage() {
  const { data: allocation, isLoading: allocLoading, error } = useMyHostel()
  const { data: hostels = [] } = useHostels()
  const { data: rooms = [] } = useRooms()
  const navigate = useNavigate()

  if (allocLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
        <LoadingSkeleton height={40} />
        <LoadingSkeleton height={140} />
      </div>
    )
  }

  // If there's an error or no active allocation
  if (error || !allocation || allocation.status === 'VACATED') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              HOS-04
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              My Hostel Accommodation
            </h1>
          </div>
        </div>

        <Card padding={48}>
          <EmptyState
            title="No Active Hostel Allocation"
            description="You are currently not assigned to any campus hall of residence. If you require on-campus accommodation, please submit an application."
            actionLabel="Apply for Hostel"
            onAction={() => navigate('/student/hostel/new-request')}
          />
        </Card>
      </div>
    )
  }

  const room = rooms.find(r => r.id === allocation.room_id)
  const hostel = room ? hostels.find(h => h.id === room.hostel_id) : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              HOS-04
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              My Hostel Accommodation
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Your official university residential room allotment, bed number, and warden desk contact.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => navigate('/student/hostel/new-request?type=ROOM_CHANGE')}
          >
            Request Room Change
          </Button>
          <Button
            variant="subtle"
            size="sm"
            leftIcon={<LogOut size={14} />}
            onClick={() => navigate('/student/hostel/new-request?type=VACATE')}
          >
            Request Vacate
          </Button>
        </div>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Assigned Hostel"
          value={hostel?.name || 'Diamond Hall'}
          tone="positive"
          icon={<Home size={18} />}
          description={`${hostel?.gender_block || 'COED'} Residence Wing`}
        />
        <StatCard
          label="Room Number"
          value={room?.room_number || 'Room 204'}
          tone="accent"
          icon={<Bed size={18} />}
          description={`${room?.bed_capacity || 2}-Seater Occupancy`}
        />
        <StatCard
          label="Allotment Date"
          value={new Date(allocation.from_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          tone="neutral"
          icon={<Calendar size={18} />}
          description="Academic Session 2026–27"
        />
      </div>

      {/* Allocation Details Card */}
      <Card padding={24}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'var(--color-chip-hostel-bg)',
              color: 'var(--color-chip-hostel-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Home size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {hostel?.name || 'Residence Hall'}
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                {hostel?.gender_block} Block • Floor 2
              </div>
            </div>
          </div>
          <StatusPill label="ACTIVE ALLOTMENT" status="success" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>ROOM SPECIFICATION</div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-text-primary)' }}>{room?.room_number || 'Room 204'}</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Equipped with study desk, wardrobe & high-speed Wi-Fi
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>RESIDENTIAL STATUS</div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-success)' }}>Cleared & Checked In</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Mess Dues: Settled via Tuition Bill
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>WARDEN CONTACT</div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>Chief Warden Office</div>
            <a href="mailto:warden@campusos.edu" style={{ fontSize: '13px', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Mail size={13} /> warden@campusos.edu
            </a>
          </div>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '12px 16px',
          borderRadius: '6px',
          background: 'var(--color-surface-subtle)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          color: 'var(--color-text-secondary)'
        }}>
          <Info size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <span>
            <strong>Hostel Maintenance Helpline:</strong> For repairs (electrical, plumbing, carpentry), raise an instant ticket via the Student Helpdesk or visit the ground floor warden desk between 09:00 – 17:00.
          </span>
        </div>
      </Card>
    </div>
  )
}
