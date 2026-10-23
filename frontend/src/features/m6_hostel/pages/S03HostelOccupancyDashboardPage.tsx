import React from 'react'
import { Card, StatCard, Table, type Column, Progress, StatusPill } from '@/components/ui'
import { useOccupancy } from '../hooks'
import { Bed, Users, ShieldAlert, CheckCircle, Home } from 'lucide-react'

export function S03HostelOccupancyDashboardPage() {
  const { data: occupancy = [], isLoading } = useOccupancy()

  const totalCapacity = occupancy.reduce((sum, o) => sum + o.total_capacity, 0)
  const totalOccupied = occupancy.reduce((sum, o) => sum + o.occupied_beds, 0)
  const totalAvailable = occupancy.reduce((sum, o) => sum + o.available_beds, 0)
  const overallPct = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0

  const columns: Column<any>[] = [
    {
      header: 'Hostel Name',
      key: 'hostel_name',
      render: (o) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'var(--color-chip-hostel-bg)',
            color: 'var(--color-chip-hostel-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Home size={14} />
          </div>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{o.hostel_name}</span>
        </div>
      )
    },
    {
      header: 'Gender Block',
      key: 'gender_block',
      render: (o) => (
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'var(--color-surface-subtle)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)'
        }}>
          {o.gender_block}
        </span>
      )
    },
    {
      header: 'Total Beds',
      key: 'total_capacity',
      render: (o) => <span style={{ fontWeight: 600 }}>{o.total_capacity}</span>
    },
    {
      header: 'Occupied',
      key: 'occupied_beds',
      render: (o) => <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{o.occupied_beds}</span>
    },
    {
      header: 'Available',
      key: 'available_beds',
      render: (o) => (
        <span style={{ fontWeight: 600, color: o.available_beds > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
          {o.available_beds}
        </span>
      )
    },
    {
      header: 'Occupancy Rate',
      key: 'occupancy_pct',
      render: (o) => {
        const pct = Math.round(o.occupancy_pct || 0)
        return (
          <div style={{ width: '140px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, color: pct >= 95 ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
                {pct}%
              </span>
              {pct >= 95 && (
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-error)' }}>
                  FULL
                </span>
              )}
            </div>
            <Progress value={pct} variant={pct >= 95 ? 'danger' : 'primary'} size="sm" />
          </div>
        )
      }
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            HOS-03
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Hostel Occupancy & Bed Allocation Analytics
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Real-time bed utilization, block capacities, and accommodation vacancy monitoring across all halls of residence.
        </p>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Bed Capacity"
          value={totalCapacity}
          tone="neutral"
          icon={<Bed size={18} />}
          description="Across all hostels"
        />
        <StatCard
          label="Currently Occupied"
          value={totalOccupied}
          tone="accent"
          icon={<Users size={18} />}
          description="Residents assigned"
        />
        <StatCard
          label="Available Vacancies"
          value={totalAvailable}
          tone="positive"
          icon={<CheckCircle size={18} />}
          description="Ready for allotment"
        />
        <StatCard
          label="Overall Campus Occupancy"
          value={`${overallPct}%`}
          tone={overallPct >= 90 ? 'warning' : 'positive'}
          description="Aggregate density"
        />
      </div>

      {/* Table Card */}
      <Card padding={0}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Residence Hall Roster
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Fall 2026 Academic Term</span>
        </div>
        <Table
          data={occupancy}
          columns={columns}
          keyExtractor={(o) => o.hostel_id.toString()}
          isLoading={isLoading}
          emptyMessage="No hostel occupancy data available."
        />
      </Card>

      {/* Visual Density Chart */}
      <Card padding={24}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Hall Capacity Distribution & Fill Levels
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {occupancy.map(o => {
            const pct = Math.round(o.occupancy_pct || 0)
            const isCritical = pct >= 95
            return (
              <div
                key={o.hostel_id}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  border: `1px solid ${isCritical ? 'var(--color-error)' : 'var(--color-border)'}`,
                  background: isCritical ? 'var(--color-error-bg)' : 'var(--color-surface-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{o.hostel_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{o.gender_block} BLOCK</div>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: isCritical ? 'var(--color-error)' : 'var(--color-primary)'
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
