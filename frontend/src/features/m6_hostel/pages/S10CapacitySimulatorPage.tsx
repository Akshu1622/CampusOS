import React, { useState, useEffect } from 'react'
import { Card, StatCard, Button, Input, Select, Progress, StatusPill } from '@/components/ui'
import { useHostels, useRooms } from '../hooks'
import { simulateCapacityWhatIf } from '../api'
import type { CapacitySimulationResponse } from '../api'
import { Sliders, RefreshCw, AlertTriangle, CheckCircle2, TrendingUp, Info } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function S10CapacitySimulatorPage() {
  const { data: hostels = [] } = useHostels()
  const { data: rooms = [] } = useRooms()

  const [extraMale, setExtraMale] = useState<number>(10)
  const [extraFemale, setExtraFemale] = useState<number>(10)
  const [closedRoomIds, setClosedRoomIds] = useState<number[]>([])
  const [closureHostelFilter, setClosureHostelFilter] = useState<string>('')

  const [simulationResult, setSimulationResult] = useState<CapacitySimulationResponse | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  const runSimulation = async (
    maleVal = extraMale,
    femaleVal = extraFemale,
    closedVal = closedRoomIds
  ) => {
    setIsSimulating(true)
    try {
      const res = await simulateCapacityWhatIf({
        additional_male_applicants: maleVal,
        additional_female_applicants: femaleVal,
        extra_male_applicants: maleVal,
        extra_female_applicants: femaleVal,
        closed_room_ids: closedVal
      })
      setSimulationResult(res)
    } catch (err: any) {
      toast.error(err.message || 'Simulation execution failed')
    } finally {
      setIsSimulating(false)
    }
  }

  // Automatically update simulation when parameters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation(extraMale, extraFemale, closedRoomIds)
    }, 250)
    return () => clearTimeout(timer)
  }, [extraMale, extraFemale, closedRoomIds])

  const toggleRoomClosure = (roomId: number) => {
    setClosedRoomIds(prev =>
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    )
  }

  const displayedRooms = closureHostelFilter
    ? rooms.filter(r => r.hostel_id.toString() === closureHostelFilter)
    : rooms

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#9333EA', background: '#FDF4FF', padding: '2px 8px', borderRadius: '4px' }}>
            FLAGSHIP C
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Capacity What-If Scenario Simulator
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Zero-mutation in-memory sandbox. Model intake surges, block offline closures, and projected bed shortages before committing changes.
        </p>
      </div>

      {/* Simulator Controls Strip */}
      <Card padding={20}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Scenario Modeling Parameters
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Adjust applicant spikes and select room maintenance closures below
            </span>
          </div>
          <Button
            variant="primary"
            leftIcon={<RefreshCw size={14} className={isSimulating ? 'animate-spin' : ''} />}
            onClick={() => runSimulation()}
            isLoading={isSimulating}
          >
            Execute What-If Model
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              Projected Male Intake Surge: +{extraMale} students
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={extraMale}
              onChange={(e) => setExtraMale(parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              <span>0 (Baseline)</span>
              <span>+50</span>
              <span>+100 Surge</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              Projected Female Intake Surge: +{extraFemale} students
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={extraFemale}
              onChange={(e) => setExtraFemale(parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              <span>0 (Baseline)</span>
              <span>+50</span>
              <span>+100 Surge</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Offline Maintenance Closures: {closedRoomIds.length} rooms
              </label>
              {closedRoomIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setClosedRoomIds([])}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0
                  }}
                >
                  Clear all ({closedRoomIds.length})
                </button>
              )}
            </div>

            <div style={{ marginBottom: '6px' }}>
              <select
                value={closureHostelFilter}
                onChange={(e) => setClosureHostelFilter(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                  padding: '4px 8px',
                  fontSize: '12px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="">All Residence Halls ({rooms.length} rooms)</option>
                {hostels.map(h => (
                  <option key={h.id} value={h.id.toString()}>{h.name}</option>
                ))}
              </select>
            </div>

            <div style={{
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              padding: '6px 10px',
              maxHeight: '90px',
              overflowY: 'auto',
              fontSize: '12px',
              background: 'var(--color-surface-subtle)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              {displayedRooms.length === 0 ? (
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>No rooms found</span>
              ) : (
                displayedRooms.map(r => (
                  <label
                    key={r.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: closedRoomIds.includes(r.id) ? '#FEE2E2' : 'var(--color-surface)',
                      border: `1px solid ${closedRoomIds.includes(r.id) ? '#EF4444' : 'var(--color-border)'}`
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={closedRoomIds.includes(r.id)}
                      onChange={() => toggleRoomClosure(r.id)}
                    />
                    <span style={{ fontWeight: closedRoomIds.includes(r.id) ? 700 : 400, color: closedRoomIds.includes(r.id) ? '#B91C1C' : 'var(--color-text-primary)' }}>
                      R-{r.room_number}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Simulation Results Display */}
      {simulationResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Projection Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <StatCard
              label="Simulated Total Shortage"
              value={`${simulationResult.overall_campus_shortage} Beds`}
              tone={simulationResult.overall_campus_shortage > 0 ? 'error' : 'positive'}
              icon={simulationResult.overall_campus_shortage > 0 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              description={simulationResult.overall_campus_shortage > 0 ? 'Unmet residential demand' : 'Campus capacity is sufficient'}
            />
            <StatCard
              label="Intake Increase Evaluated"
              value={`+${extraMale + extraFemale} Students`}
              tone="accent"
              icon={<TrendingUp size={18} />}
              description={`Male: +${extraMale} • Female: +${extraFemale}`}
            />
            <StatCard
              label="Offline Rooms Simulated"
              value={`${closedRoomIds.length} Rooms`}
              tone="neutral"
              icon={<Sliders size={18} />}
              description="Capacity subtracted during run"
            />
          </div>

          {/* Strategic Recommendations Card */}
          {simulationResult.recommendations.length > 0 && (
            <Card padding={16}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Info size={16} style={{ color: '#0D9488' }} />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Simulator Advisory Recommendations
                </h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {simulationResult.recommendations.map((rec, idx) => (
                  <li key={idx}><strong>{rec}</strong></li>
                ))}
              </ul>
            </Card>
          )}

          {/* Hall Projections Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {simulationResult.hostel_projections.map(proj => {
              const isShortage = proj.projected_shortage > 0
              return (
                <Card key={proj.hostel_id} padding={18}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>
                          {proj.hostel_name}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                          {proj.gender_block} BLOCK
                        </div>
                      </div>
                      <StatusPill
                        label={isShortage ? `-${proj.projected_shortage} Shortage` : `${proj.simulated_available} Available`}
                        status={isShortage ? 'error' : 'success'}
                      />
                    </div>

                    <div style={{ marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span>Projected Utilization</span>
                        <strong>{proj.utilization_rate}%</strong>
                      </div>
                      <Progress value={Math.min(100, proj.utilization_rate)} variant={isShortage ? 'danger' : 'primary'} size="sm" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginTop: '6px', color: 'var(--color-text-secondary)' }}>
                      <div>Baseline Cap: <strong>{proj.current_capacity}</strong></div>
                      <div>Simulated Cap: <strong>{proj.simulated_capacity}</strong></div>
                      <div>Baseline Free: <strong>{proj.current_available}</strong></div>
                      <div>Simulated Free: <strong>{proj.simulated_available}</strong></div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
