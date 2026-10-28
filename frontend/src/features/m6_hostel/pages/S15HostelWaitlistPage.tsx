import React, { useState } from 'react'
import { Card, StatCard, Table, type Column, StatusPill, Button, Modal, Input, Select } from '@/components/ui'
import { useWaitlist, useCreateWaitlist, useUpdateWaitlistStatus, useHostels } from '../hooks'
import { searchHostelStudents, type StudentSearchItem, type HostelWaitlist, type WaitlistStatus } from '../api'
import { useNavigate } from 'react-router-dom'
import { ListOrdered, UserPlus, Search, CheckCircle, Clock, XCircle, ArrowRight, ShieldCheck, Filter } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function S15HostelWaitlistPage() {
  const navigate = useNavigate()
  const { data: hostels = [] } = useHostels()
  const [selectedHostelId, setSelectedHostelId] = useState<number | undefined>()
  const [statusFilter, setStatusFilter] = useState<string>('WAITING')

  const { data: waitlist = [], isLoading } = useWaitlist({
    hostel_id: selectedHostelId,
    status: statusFilter || undefined
  })

  const createWaitlist = useCreateWaitlist()
  const updateWaitlist = useUpdateWaitlistStatus()

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [studentQuery, setStudentQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StudentSearchItem[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchItem | null>(null)
  const [preferredHostelId, setPreferredHostelId] = useState<number>(hostels[0]?.id || 1)
  const [priorityScore, setPriorityScore] = useState<number>(50)
  const [notes, setNotes] = useState('')

  // Student search effect
  const handleStudentSearch = async (q: string) => {
    setStudentQuery(q)
    if (q.trim().length >= 2) {
      try {
        const results = await searchHostelStudents(q)
        setSearchResults(results)
      } catch (e) {
        setSearchResults([])
      }
    } else {
      setSearchResults([])
    }
  }

  const handleCreate = () => {
    if (!selectedStudent) {
      toast.error('Please search and select a student.')
      return
    }

    createWaitlist.mutate({
      student_id: selectedStudent.student_id ?? selectedStudent.id,
      preferred_hostel_id: preferredHostelId,
      priority_score: priorityScore,
      notes: notes || undefined
    }, {
      onSuccess: () => {
        setIsAddModalOpen(false)
        setSelectedStudent(null)
        setStudentQuery('')
        setNotes('')
      }
    })
  }

  const handleStatusChange = (id: number, status: WaitlistStatus) => {
    updateWaitlist.mutate({ id, data: { status } })
  }

  // Stat metrics
  const waitingCount = waitlist.filter(w => w.status === 'WAITING').length
  const offeredCount = waitlist.filter(w => w.status === 'OFFERED').length
  const maxScore = waitlist.length > 0 ? Math.max(...waitlist.map(w => w.priority_score)) : 0

  const columns: Column<HostelWaitlist>[] = [
    {
      header: 'Priority Rank',
      key: 'priority_score',
      render: (w) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div>
            <strong style={{ fontSize: '13px' }}>{w.priority_score} pts</strong>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Priority Score</div>
          </div>
        </div>
      )
    },
    {
      header: 'Student Identity',
      key: 'student_id',
      render: (w) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {w.student_name || `Student #${w.student_id}`}
          </div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
            {w.global_student_id || `ID: ${w.student_id}`}
          </div>
        </div>
      )
    },
    {
      header: 'Preferred Residence',
      key: 'preferred_hostel_id',
      render: (w) => (
        <div>
          <div style={{ fontWeight: 600 }}>{w.preferred_hostel_name || 'Preferred Hostel'}</div>
          {w.preferred_room_number && (
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Preferred Room: {w.preferred_room_number}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Date Queued',
      key: 'created_at',
      render: (w) => (
        <div style={{ fontSize: '12px' }}>
          {new Date(w.created_at).toLocaleDateString()}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (w) => {
        let variant: 'warning' | 'success' | 'neutral' | 'error' = 'neutral'
        if (w.status === 'WAITING') variant = 'warning'
        if (w.status === 'OFFERED') variant = 'success'
        if (w.status === 'CANCELLED' || w.status === 'EXPIRED') variant = 'error'
        return <StatusPill label={w.status} status={variant} />
      }
    },
    {
      header: 'Notes & Rationale',
      key: 'notes',
      render: (w) => (
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {w.notes || '—'}
        </span>
      )
    },
    {
      header: 'Actions',
      key: 'id',
      render: (w) => (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {w.status === 'WAITING' && (
            <>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ArrowRight size={13} />}
                onClick={() => {
                  navigate(`/admin/hostel/allocations?student_id=${w.student_id}&room_id=${w.preferred_room_id || ''}`)
                }}
                title="Proceed to Allotment"
              >
                Allot Room
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => handleStatusChange(w.id, 'CANCELLED')}
                title="Cancel waitlist entry"
              >
                Cancel
              </Button>
            </>
          )}
          {w.status === 'OFFERED' && (
            <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>Offered</span>
          )}
          {w.status === 'CANCELLED' && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Cancelled</span>
          )}
        </div>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Title & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Policy-Based Residential Waitlist
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Fair, explainable waitlist ranking based on official student identity, academic distance, and priority points.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<UserPlus size={16} />}
          onClick={() => {
            setPreferredHostelId(hostels[0]?.id || 1)
            setIsAddModalOpen(true)
          }}
        >
          Add Student to Waitlist
        </Button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Active Waitlist"
          value={waitingCount}
          tone="warning"
          icon={<Clock size={20} />}
          description="Awaiting bed release"
        />
        <StatCard
          label="Rooms Offered"
          value={offeredCount}
          tone="positive"
          icon={<CheckCircle size={20} />}
          description="Offered this cycle"
        />
        <StatCard
          label="Top Priority Score"
          value={`${maxScore} pts`}
          tone="neutral"
          icon={<ListOrdered size={20} />}
          description="Highest scored applicant"
        />
      </div>

      {/* Filter Toolbar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '220px' }}>
            <Select
              label="Filter by Residence Hall"
              value={selectedHostelId || ''}
              onChange={(e) => setSelectedHostelId(e.target.value ? Number(e.target.value) : undefined)}
              options={[
                { label: 'All Residence Halls', value: '' },
                ...hostels.map(h => ({ label: `${h.name} (${h.gender_block})`, value: h.id }))
              ]}
            />
          </div>

          <div style={{ width: '180px' }}>
            <Select
              label="Queue Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { label: 'Active (WAITING)', value: 'WAITING' },
                { label: 'Offered Bed', value: 'OFFERED' },
                { label: 'Cancelled / Expired', value: 'CANCELLED' },
                { label: 'All History', value: '' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Waitlist Table */}
      <Card padding={0}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Ranked Applicant Queue ({waitlist.length})
          </h3>
        </div>

        <Table
          columns={columns}
          data={waitlist}
          isLoading={isLoading}
          keyExtractor={(w) => w.id.toString()}
          emptyMessage="No students currently in the waitlist for the selected criteria."
        />
      </Card>

      {/* Add to Waitlist Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Student to Residential Waitlist"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Step 1: Student Search */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              1. Search Official Student Identity
            </label>
            <div style={{ position: 'relative' }}>
              <Input
                placeholder="Search by student name or official STU-..."
                value={studentQuery}
                onChange={(e) => handleStudentSearch(e.target.value)}
              />
              {searchResults.length > 0 && !selectedStudent && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  marginTop: '4px'
                }}>
                  {searchResults.map((s) => {
                    const studentName = s.full_name || `${s.first_name} ${s.last_name}`
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedStudent(s)
                          setStudentQuery(studentName)
                          setSearchResults([])
                        }}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--color-border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{studentName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{s.global_student_id}</div>
                        </div>
                        <span style={{ fontSize: '11px', color: '#0D9488', fontWeight: 600 }}>Select</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {selectedStudent && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                background: '#F0FDFA',
                border: '1px solid #99F6E4',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong style={{ fontSize: '13px', color: '#0F766E' }}>
                    {selectedStudent.full_name || `${selectedStudent.first_name} ${selectedStudent.last_name}`}
                  </strong>
                  <div style={{ fontSize: '11px', color: '#134E4A' }}>Official ID: {selectedStudent.global_student_id}</div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  style={{ background: 'none', border: 'none', color: '#0F766E', cursor: 'pointer', fontSize: '11px' }}
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Preferred Hostel */}
          <Select
            label="2. Preferred Residence Hall"
            value={preferredHostelId}
            onChange={(e) => setPreferredHostelId(Number(e.target.value))}
            options={hostels.map(h => ({ label: `${h.name} (${h.gender_block})`, value: h.id }))}
          />

          {/* Step 3: Priority Score */}
          <Input
            label="3. Policy Priority Score (1 - 100)"
            type="number"
            min={1}
            max={100}
            value={priorityScore}
            onChange={(e) => setPriorityScore(Number(e.target.value))}
          />

          {/* Step 4: Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              4. Prioritization Rationale / Remarks
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Outstation student (850km distance), verified sports scholarship or medical recommendation"
              style={{
                width: '100%',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                padding: '10px 12px',
                fontSize: '13px',
                fontFamily: 'inherit',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="tertiary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" isLoading={createWaitlist.isPending} onClick={handleCreate}>
              Confirm Waitlist Placement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
