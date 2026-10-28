import React from 'react'
import { Card, StatCard, Table, type Column, Progress, StatusPill, Button } from '@/components/ui'
import { useOccupancy, useRooms } from '../hooks'
import { useNavigate } from 'react-router-dom'
import { Bed, Users, ShieldAlert, CheckCircle, Home, Sparkles, Sliders, Radio, AlertTriangle, ShieldCheck, MapPin, ClipboardList } from 'lucide-react'
import type { HostelOccupancy } from '../api'

export function S03HostelOccupancyDashboardPage() {
  const { data: occupancy = [], isLoading: isOccupancyLoading } = useOccupancy()
  const { data: rooms = [], isLoading: isRoomsLoading } = useRooms()
  const navigate = useNavigate()

  // Calculate metrics from occupancy endpoint with fallback to active room inventory
  const occCapacity = occupancy.reduce((sum, o) => sum + Number(o.total_capacity || 0), 0)
  const occOccupied = occupancy.reduce((sum, o) => sum + Number(o.occupied_beds || 0), 0)
  const occAvailable = occupancy.reduce((sum, o) => sum + Number(o.available_beds || 0), 0)

  const roomCapacity = rooms.reduce((sum, r) => sum + Number(r.bed_capacity || 0), 0)
  const roomAvailable = rooms.reduce((sum, r) => sum + Number(r.available_beds || 0), 0)
  const roomOccupied = Math.max(0, roomCapacity - roomAvailable)

  // Guarantee continuous data display: derive hostel-level occupancy from room inventory if endpoint is pending/restricted
  const displayOccupancy: HostelOccupancy[] = React.useMemo(() => {
    if (occupancy.length > 0) return occupancy

    const grouped = new Map<number, HostelOccupancy>()
    rooms.forEach(r => {
      const hid = r.hostel_id
      if (!grouped.has(hid)) {
        grouped.set(hid, {
          hostel_id: hid,
          hostel_name: r.hostel_name || `Hostel ${hid}`,
          gender_block: r.gender_block || 'COED',
          total_capacity: 0,
          occupied_beds: 0,
          available_beds: 0,
          occupancy_pct: 0
        })
      }
      const g = grouped.get(hid)!
      const cap = Number(r.bed_capacity || 0)
      const avail = Number(r.available_beds || 0)
      const occ = Math.max(0, cap - avail)
      g.total_capacity += cap
      g.available_beds += avail
      g.occupied_beds += occ
    })

    return Array.from(grouped.values()).map(g => ({
      ...g,
      occupancy_pct: g.total_capacity > 0 ? Math.round((g.occupied_beds / g.total_capacity) * 100) : 0
    }))
  }, [occupancy, rooms])

  const totalCapacity = occCapacity > 0 ? occCapacity : roomCapacity
  const totalOccupied = occCapacity > 0 ? occOccupied : roomOccupied
  const totalAvailable = occCapacity > 0 ? occAvailable : roomAvailable
  const overallPct = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0

  const highOccupancyCount = displayOccupancy.filter(o => (o.occupancy_pct || 0) >= 90).length

  const columns: Column<HostelOccupancy>[] = [
    {
      header: 'Residence Hall',
      key: 'hostel_name',
      render: (o) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, maxWidth: '240px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            minWidth: '32px',
            borderRadius: '6px',
            background: 'var(--color-chip-hostel-bg, #E0F5F3)',
            color: 'var(--color-chip-hostel-text, #0D9488)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Home size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>{o.hostel_name}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>ID: {o.hostel_id}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Gender Block',
      key: 'gender_block',
      render: (o) => (
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'var(--color-surface-subtle)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)'
        }}>
          {o.gender_block} BLOCK
        </span>
      )
    },
    {
      header: 'Total Capacity',
      key: 'total_capacity',
      render: (o) => <span style={{ fontWeight: 600 }}>{o.total_capacity} Beds</span>
    },
    {
      header: 'Occupied Beds',
      key: 'occupied_beds',
      render: (o) => <span style={{ fontWeight: 600, color: 'var(--color-primary, #0D9488)' }}>{o.occupied_beds}</span>
    },
    {
      header: 'Available Beds',
      key: 'available_beds',
      render: (o) => (
        <span style={{ fontWeight: 700, color: o.available_beds > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
          {o.available_beds}
        </span>
      )
    },
    {
      header: 'Occupancy Rate',
      key: 'occupancy_pct',
      render: (o) => {
        const pct = Math.round(o.occupancy_pct || 0)
        const isCritical = pct >= 95
        const isWarning = pct >= 85 && pct < 95
        return (
          <div style={{ width: '150px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, color: isCritical ? 'var(--color-error)' : isWarning ? '#D97706' : 'var(--color-text-primary)' }}>
                {pct}%
              </span>
              {isCritical && (
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-error)' }}>
                  AT CAPACITY
                </span>
              )}
            </div>
            <Progress value={pct} variant={isCritical ? 'danger' : isWarning ? 'warning' : 'primary'} size="sm" />
          </div>
        )
      }
    },
    {
      header: 'Health Status',
      key: 'hostel_id',
      render: (o) => {
        const pct = Math.round(o.occupancy_pct || 0)
        if (pct >= 95) return <StatusPill label="Critical Load" status="error" />
        if (pct >= 85) return <StatusPill label="Near Capacity" status="warning" />
        return <StatusPill label="Optimal" status="success" />
      }
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            HOS-03
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Hostel Occupancy & Bed Utilization Analytics
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Real-time bed utilization, block capacities, and accommodation vacancy monitoring across all halls of residence.
        </p>
      </div>

      {/* Top StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Bed Capacity"
          value={totalCapacity}
          tone="neutral"
          icon={<Bed size={18} />}
          description="Across all registered halls"
        />
        <StatCard
          label="Currently Occupied"
          value={totalOccupied}
          tone="accent"
          icon={<Users size={18} />}
          description="Residents allocated"
        />
        <StatCard
          label="Available Vacancies"
          value={totalAvailable}
          tone="positive"
          icon={<CheckCircle size={18} />}
          description="Ready for allotment"
        />
        <StatCard
          label="Campus Occupancy Rate"
          value={`${overallPct}%`}
          tone={overallPct >= 90 ? 'warning' : 'positive'}
          description={highOccupancyCount > 0 ? `${highOccupancyCount} hall(s) near full capacity` : 'Stable density balance'}
        />
      </div>

      {/* Signature Features Quick Navigation Banner */}
      <Card padding={16}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Intelligent Hostel Operations & Decision Lab
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Access diagnostic integrity scans, explainable AI allotment, simulation engines, and impact analysis.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Flagship A */}
          <div
            onClick={() => navigate('/admin/hostel/guardian')}
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                Integrity Guardian
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Anomaly & desync radar
              </div>
            </div>
          </div>

          {/* Flagship B */}
          <div
            onClick={() => navigate('/admin/hostel/smart-allocation')}
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#F0FDFA',
              color: '#0D9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                Smart Allocation Lab
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Rule-scored room matching
              </div>
            </div>
          </div>

          {/* Flagship C */}
          <div
            onClick={() => navigate('/admin/hostel/simulator')}
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#FDF4FF',
              color: '#9333EA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sliders size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                What-If Simulator
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                In-memory scenario sandbox
              </div>
            </div>
          </div>

          {/* Flagship D */}
          <div
            onClick={() => navigate('/admin/hostel/radar')}
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Radio size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                Change Impact Radar
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Room closure mitigation
              </div>
            </div>
          </div>

          {/* Visual Map */}
          <div
            onClick={() => navigate('/admin/hostel/map')}
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#ECFDF5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <MapPin size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                Visual Hostel Map
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Interactive schematic grid
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Residence Hall Roster Table */}
      <Card padding={0}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Residence Hall Capacity Roster
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Fall 2026 Academic Term</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/admin/hostel/room-allocation')}>
            Allocate Residents
          </Button>
        </div>
        <Table
          data={displayOccupancy}
          columns={columns}
          keyExtractor={(o) => o.hostel_id.toString()}
          isLoading={isOccupancyLoading && isRoomsLoading}
          emptyMessage="No hostel occupancy data available."
        />
      </Card>

      {/* Visual Density Cards */}
      <Card padding={24}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Hall Capacity Distribution & Fill Levels
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {displayOccupancy.map(o => {
            const pct = Math.round(o.occupancy_pct || 0)
            const isCritical = pct >= 95
            return (
              <div
                key={o.hostel_id}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  border: `1.5px solid ${isCritical ? 'var(--color-error)' : 'var(--color-border)'}`,
                  background: isCritical ? '#FEF2F2' : 'var(--color-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>{o.hostel_name}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {o.gender_block} BLOCK
                    </div>
                  </div>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: isCritical ? 'var(--color-error)' : 'var(--color-primary, #0D9488)'
                  }}>
                    {pct}%
                  </span>
                </div>

                <Progress value={pct} variant={isCritical ? 'danger' : 'primary'} size="sm" />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  <span>Occupied: <strong>{o.occupied_beds}</strong></span>
                  <span>Available: <strong style={{ color: o.available_beds > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>{o.available_beds}</strong></span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
