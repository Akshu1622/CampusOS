import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Select, StatusPill, StatCard, Table, type Column, Modal } from '@/components/ui'
import { useHostels, useRooms, useAllocateRoom, useAllocations, useVacateRoom, useTransferRoom } from '../hooks'
import { searchHostelStudents } from '../api'
import type { StudentSearchItem, HostelAllocation, Room } from '../api'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Home, Bed, User, CheckCircle2, ArrowRight, Sparkles, LogOut, RefreshCw, AlertCircle, Search, ShieldCheck, Download, Upload, FileText } from 'lucide-react'
import { DemographicsImportModal } from '../components/DemographicsImportModal'
import { AllocationLetterModal } from '../components/AllocationLetterModal'
import { toast } from 'react-hot-toast'

export function S02RoomAllocationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const prefillStudentId = searchParams.get('student_id') ? Number(searchParams.get('student_id')) : undefined
  const prefillRoomId = searchParams.get('room_id') ? Number(searchParams.get('room_id')) : undefined

  const { data: hostels = [] } = useHostels()
  const [selectedHostelId, setSelectedHostelId] = useState<number | undefined>()
  const { data: rooms = [] } = useRooms(selectedHostelId)
  
  // Allocations Roster
  const [allocationStatusFilter, setAllocationStatusFilter] = useState<string>('ACTIVE')
  const [allocationSearch, setAllocationSearch] = useState('')
  const { data: allocations = [], isLoading: allocLoading } = useAllocations({
    status: allocationStatusFilter || undefined,
    search: allocationSearch || undefined
  })

  const allocateRoom = useAllocateRoom()
  const vacateRoom = useVacateRoom()
  const transferRoom = useTransferRoom()

  // Student search state
  const [studentQuery, setStudentQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StudentSearchItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchItem | null>(null)

  // Allocation form state
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(prefillRoomId)
  const [bedNumber, setBedNumber] = useState('Bed 1')
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0])

  // Transfer Modal State
  const [transferingAlloc, setTransferingAlloc] = useState<HostelAllocation | null>(null)
  const [transferTargetHostelId, setTransferTargetHostelId] = useState<number | undefined>()
  const { data: transferRooms = [] } = useRooms(transferTargetHostelId)
  const [transferTargetRoomId, setTransferTargetRoomId] = useState<number | undefined>()
  const [transferBedNumber, setTransferBedNumber] = useState('Bed 1')

  // Vacate Modal State
  const [vacatingAlloc, setVacatingAlloc] = useState<HostelAllocation | null>(null)

  // Demographics Import & Allotment Letter Modals
  const [isDemographicsModalOpen, setIsDemographicsModalOpen] = useState(false)
  const [viewingLetterAllocId, setViewingLetterAllocId] = useState<number | null>(null)

  const handleExportCSV = () => {
    if (!allocations.length) {
      toast.error('No allocations to export.')
      return
    }
    const headers = ['ID', 'Student Name', 'Global Student ID', 'Hostel', 'Gender Block', 'Room Number', 'Bed Number', 'From Date', 'To Date', 'Status']
    const rows = allocations.map(a => [
      a.id,
      `"${(a.student_name || '').replace(/"/g, '""')}"`,
      a.global_student_id || '',
      `"${(a.hostel_name || '').replace(/"/g, '""')}"`,
      a.gender_block || '',
      a.room_number,
      a.bed_number || '',
      a.from_date,
      a.to_date || '',
      a.status
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `hostel_allocation_roster_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Allocation roster CSV exported')
  }

  // Debounced student search
  useEffect(() => {
    if (!studentQuery || studentQuery.trim().length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchHostelStudents(studentQuery.trim())
        setSearchResults(results)
      } catch (err: any) {
        console.error('Failed to search students:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [studentQuery])

  // If prefilled student ID is present, search and preselect
  useEffect(() => {
    if (prefillStudentId) {
      searchHostelStudents(String(prefillStudentId)).then(res => {
        const found = res.find(s => s.id === prefillStudentId)
        if (found) {
          setSelectedStudent(found)
        }
      }).catch(console.error)
    }
  }, [prefillStudentId])

  // Handle selected room
  const selectedRoom = rooms.find(r => r.id === selectedRoomId)
  const selectedHostel = hostels.find(h => h.id === (selectedRoom ? selectedRoom.hostel_id : selectedHostelId))

  // Demographic compatibility check
  const checkCompatibility = () => {
    if (!selectedStudent || !selectedRoom) return { ok: true, reason: '' }

    const roomGender = selectedRoom.gender_block || selectedHostel?.gender_block || 'COED'
    const studentGender = selectedStudent.gender // 'MALE', 'FEMALE', or null

    if (!selectedStudent.is_hostel_eligible) {
      return { ok: false, reason: 'Student is marked as ineligible for hostel accommodation.' }
    }

    if (studentGender === null) {
      if (roomGender !== 'COED') {
        return {
          ok: false,
          reason: `Student demographics are unverified. Institutional policy strictly restricts unverified students from ${roomGender} blocks. Only COED halls are permissible.`
        }
      }
    } else if (studentGender !== roomGender && roomGender !== 'COED') {
      return {
        ok: false,
        reason: `Gender Mismatch: Student is registered as ${studentGender}, but this hall is restricted to ${roomGender} students.`
      }
    }

    if (selectedStudent.has_active_allocation) {
      return {
        ok: false,
        reason: 'Student currently holds an active bed allotment. Use Room Transfer instead of a new allocation.'
      }
    }

    return { ok: true, reason: '' }
  }

  const compatibility = checkCompatibility()

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !selectedRoomId) {
      toast.error('Please select both a student and a vacant room')
      return
    }

    if (!compatibility.ok) {
      toast.error(compatibility.reason)
      return
    }

    allocateRoom.mutate({
      student_id: selectedStudent.id,
      room_id: selectedRoomId,
      bed_number: bedNumber || undefined,
      from_date: fromDate
    }, {
      onSuccess: () => {
        setSelectedStudent(null)
        setSelectedRoomId(undefined)
        setStudentQuery('')
        setSearchResults([])
      }
    })
  }

  const handleConfirmVacate = () => {
    if (!vacatingAlloc) return
    vacateRoom.mutate(vacatingAlloc.id, {
      onSuccess: () => {
        setVacatingAlloc(null)
      }
    })
  }

  const handleConfirmTransfer = () => {
    if (!transferingAlloc || !transferTargetRoomId) {
      toast.error('Please select a target room for transfer')
      return
    }

    transferRoom.mutate({
      allocId: transferingAlloc.id,
      data: {
        new_room_id: transferTargetRoomId,
        new_bed_number: transferBedNumber || undefined
      }
    }, {
      onSuccess: () => {
        setTransferingAlloc(null)
        setTransferTargetRoomId(undefined)
      }
    })
  }

  // Allocations Table Columns
  const allocationColumns: Column<HostelAllocation>[] = [
    {
      header: 'Student',
      key: 'student_id',
      render: (a) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {a.student_name || `Student #${a.student_id}`}
          </div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
            {a.global_student_id || `ID: ${a.student_id}`}
          </div>
        </div>
      )
    },
    {
      header: 'Residence Hall',
      key: 'hostel_name',
      render: (a) => (
        <div>
          <div style={{ fontWeight: 600 }}>{a.hostel_name || 'Hostel'}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{a.gender_block || 'COED'} Block</div>
        </div>
      )
    },
    {
      header: 'Room & Bed',
      key: 'room_number',
      render: (a) => (
        <div style={{ minWidth: 0, maxWidth: '180px' }}>
          <span style={{ fontWeight: 600, wordBreak: 'break-word' }}>Room {a.room_number}</span>
          <span style={{
            fontSize: '11px',
            marginLeft: '6px',
            padding: '1px 6px',
            borderRadius: '4px',
            background: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            whiteSpace: 'nowrap'
          }}>
            {a.bed_number || 'Bed 1'}
          </span>
        </div>
      )
    },
    {
      header: 'Allotment Period',
      key: 'from_date',
      render: (a) => (
        <div style={{ fontSize: '12px' }}>
          <div>From: <strong>{new Date(a.from_date).toLocaleDateString()}</strong></div>
          {a.to_date && <div style={{ color: 'var(--color-text-muted)' }}>To: {new Date(a.to_date).toLocaleDateString()}</div>}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (a) => (
        <StatusPill
          label={a.status}
          status={a.status === 'ACTIVE' ? 'success' : 'neutral'}
        />
      )
    },
    {
      header: 'Actions',
      key: 'id',
      render: (a) => {
        if (a.status !== 'ACTIVE') return <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Archived</span>
        return (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FileText size={13} />}
              onClick={() => setViewingLetterAllocId(a.id)}
              title="Official Cryptographic Allotment Order"
            >
              Letter
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              leftIcon={<RefreshCw size={13} />}
              onClick={() => {
                setTransferingAlloc(a)
                setTransferTargetHostelId(a.hostel_id || hostels[0]?.id)
              }}
              title="Transfer to another room"
            >
              Transfer
            </Button>
            <Button
              variant="subtle"
              size="sm"
              leftIcon={<LogOut size={13} />}
              onClick={() => setVacatingAlloc(a)}
              title="Vacate room & release bed"
            >
              Vacate
            </Button>
          </div>
        )
      }
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              HOS-02
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Room Allocation & Bed Allotment Console
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Official student allocation with demographic block enforcement, bed number tracking, and atomic transfers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            leftIcon={<Upload size={15} />}
            onClick={() => setIsDemographicsModalOpen(true)}
          >
            Import Demographics CSV
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Sparkles size={15} style={{ color: '#0D9488' }} />}
            onClick={() => navigate('/admin/hostel/smart-allocation')}
          >
            Smart Allocation Lab
          </Button>
        </div>
      </div>

      {/* Allocation Workflow Form */}
      <Card padding={20}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          New Bed Allotment Workflow
        </h3>

        <form onSubmit={handleAllocate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>

            {/* Step 1: Student Search */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                1. Search & Select Student (Official Identity)
              </label>

              <div style={{ position: 'relative' }}>
                <Input
                  placeholder="Search by student name or official STU-ID..."
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                />
              </div>

              {/* Student Search Dropdown Results */}
              {isSearching && (
                <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Searching students...
                </div>
              )}

              {searchResults.length > 0 && (
                <div style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  background: 'var(--color-surface)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}>
                  {searchResults.map(s => {
                    const isAllocated = s.has_active_allocation === 1
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedStudent(s)
                          setSearchResults([])
                          setStudentQuery(`${s.first_name} ${s.last_name}`)
                        }}
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: selectedStudent?.id === s.id ? 'var(--color-primary-subtle, #F0FDFA)' : 'transparent',
                          transition: 'background 0.15s'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                            {s.first_name} {s.last_name}
                          </div>
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                            {s.global_student_id} • {s.program_code || 'Undergraduate'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: s.gender ? 'var(--color-surface-subtle)' : '#FEF3C7',
                            color: s.gender ? 'var(--color-text-secondary)' : '#92400E',
                            border: '1px solid var(--color-border)'
                          }}>
                            {s.gender || 'UNVERIFIED'}
                          </span>
                          {isAllocated && (
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>
                              Allocated
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Selected Student Confirmation Card */}
              {selectedStudent && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--color-primary, #0D9488)',
                  background: 'var(--color-primary-subtle, #F0FDFA)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </div>
                    <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Official ID: <strong>{selectedStudent.global_student_id}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      Demographics: <strong>{selectedStudent.gender || 'UNVERIFIED GENDER'}</strong> • Status: {selectedStudent.status}
                    </div>
                  </div>
                  <div>
                    <Button variant="tertiary" size="sm" onClick={() => setSelectedStudent(null)}>
                      Change
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Room & Bed Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  2. Select Vacant Room
                </label>
                <div style={{ width: '160px' }}>
                  <Select
                    value={selectedHostelId?.toString() || ''}
                    onChange={(e) => setSelectedHostelId(e.target.value ? parseInt(e.target.value) : undefined)}
                    options={[
                      { label: 'All Hostels', value: '' },
                      ...hostels.map(h => ({ label: `${h.name} (${h.gender_block})`, value: h.id.toString() }))
                    ]}
                  />
                </div>
              </div>

              {/* Room Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
                gap: '8px',
                maxHeight: '220px',
                overflowY: 'auto',
                padding: '4px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px'
              }}>
                {rooms.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '24px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    No rooms available for the selected filter.
                  </div>
                )}
                {rooms.map(r => {
                  const isSelected = selectedRoomId === r.id
                  const isFull = r.available_beds <= 0
                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        if (!isFull) setSelectedRoomId(r.id)
                      }}
                      style={{
                        border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: '6px',
                        padding: '8px',
                        textAlign: 'center',
                        cursor: isFull ? 'not-allowed' : 'pointer',
                        opacity: isFull ? 0.45 : 1,
                        background: isSelected ? 'var(--color-primary-subtle, #F0FDFA)' : isFull ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {r.room_number}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {r.gender_block || 'COED'}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <StatusPill
                          label={`${r.available_beds} free`}
                          status={isFull ? 'error' : r.available_beds === 1 ? 'warning' : 'success'}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {selectedRoom && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  fontSize: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>
                    Selected: <strong>Room {selectedRoom.room_number}</strong> ({selectedHostel?.name || 'Hostel'} - {selectedRoom.gender_block} Block)
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                    {selectedRoom.available_beds} Beds Available
                  </span>
                </div>
              )}
            </div>

            {/* Step 3: Bed & Date Specifics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                3. Bed Assignment & Period
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input
                  label="Bed Identifier"
                  placeholder="e.g. Bed A, Bed 1"
                  value={bedNumber}
                  onChange={(e) => setBedNumber(e.target.value)}
                />
                <Input
                  type="date"
                  label="Allotment Start Date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              {/* Compatibility Alert Message */}
              {!compatibility.ok && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Allocation Blocked:</strong> {compatibility.reason}
                  </div>
                </div>
              )}

              {compatibility.ok && selectedStudent && selectedRoom && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: '#F0FDF4',
                  border: '1px solid #86EFAC',
                  color: '#166534',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle2 size={16} />
                  <span>Demographic & vacancy eligibility verified. Ready to allocate.</span>
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={allocateRoom.isPending}
                  disabled={!selectedStudent || !selectedRoomId || !compatibility.ok}
                  style={{ width: '100%' }}
                >
                  Confirm Allocation
                </Button>
              </div>
            </div>

          </div>
        </form>
      </Card>

      {/* Active & Historical Allocations Table */}
      <Card padding={0}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Hostel Resident Allotments Roster
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Official registry of allocated students, rooms, bed numbers, and tenancy records.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '200px' }}>
              <Input
                placeholder="Search allocations..."
                value={allocationSearch}
                onChange={(e) => setAllocationSearch(e.target.value)}
              />
            </div>
            <div style={{ width: '140px' }}>
              <Select
                value={allocationStatusFilter}
                onChange={(e) => setAllocationStatusFilter(e.target.value)}
                options={[
                  { label: 'Active Allotments', value: 'ACTIVE' },
                  { label: 'Vacated History', value: 'VACATED' },
                  { label: 'All Records', value: '' }
                ]}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={handleExportCSV}
              title="Export filtered roster to CSV"
            >
              Export CSV
            </Button>
          </div>
        </div>

        <Table
          data={allocations}
          columns={allocationColumns}
          keyExtractor={(a) => a.id.toString()}
          isLoading={allocLoading}
          emptyMessage="No hostel resident allocations found."
        />
      </Card>

      {/* Vacate Confirmation Modal */}
      <Modal
        isOpen={!!vacatingAlloc}
        onClose={() => setVacatingAlloc(null)}
        title="Confirm Room Vacation"
      >
        {vacatingAlloc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Are you sure you want to vacate the bed allotment for <strong>{vacatingAlloc.student_name}</strong> ({vacatingAlloc.global_student_id}) in <strong>Room {vacatingAlloc.room_number}</strong> ({vacatingAlloc.hostel_name})?
            </p>
            <div style={{
              padding: '12px',
              borderRadius: '6px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
              color: 'var(--color-text-muted)'
            }}>
              • The room's available bed counter will be incremented immediately.<br />
              • The resident's tenancy history will be permanently archived.<br />
              • Any pending room change or vacate requests will be completed.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button variant="tertiary" onClick={() => setVacatingAlloc(null)}>Cancel</Button>
              <Button variant="danger" isLoading={vacateRoom.isPending} onClick={handleConfirmVacate}>
                Confirm Vacate
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Room Transfer Modal */}
      <Modal
        isOpen={!!transferingAlloc}
        onClose={() => { setTransferingAlloc(null); setTransferTargetRoomId(undefined) }}
        title={transferingAlloc ? `Transfer ${transferingAlloc.student_name}` : 'Room Transfer'}
      >
        {transferingAlloc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '10px 12px',
              borderRadius: '6px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              fontSize: '13px'
            }}>
              <div>Current: <strong>{transferingAlloc.hostel_name} - Room {transferingAlloc.room_number} ({transferingAlloc.bed_number || 'Bed 1'})</strong></div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Student: {transferingAlloc.student_name} • {transferingAlloc.global_student_id}
              </div>
            </div>

            <Select
              label="Target Residence Hall"
              value={transferTargetHostelId?.toString() || ''}
              onChange={(e) => setTransferTargetHostelId(e.target.value ? parseInt(e.target.value) : undefined)}
              options={hostels.map(h => ({ label: `${h.name} (${h.gender_block})`, value: h.id.toString() }))}
            />

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                Target Room
              </label>
              <Select
                value={transferTargetRoomId?.toString() || ''}
                onChange={(e) => setTransferTargetRoomId(e.target.value ? parseInt(e.target.value) : undefined)}
                options={[
                  { label: 'Select Target Room', value: '' },
                  ...transferRooms.filter(r => r.available_beds > 0 && r.id !== transferingAlloc.room_id).map(r => ({
                    label: `Room ${r.room_number} (${r.available_beds} beds free)`,
                    value: r.id.toString()
                  }))
                ]}
              />
            </div>

            <Input
              label="New Bed Identifier"
              placeholder="e.g. Bed B, Bed 2"
              value={transferBedNumber}
              onChange={(e) => setTransferBedNumber(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="tertiary" onClick={() => setTransferingAlloc(null)}>Cancel</Button>
              <Button
                variant="primary"
                isLoading={transferRoom.isPending}
                disabled={!transferTargetRoomId}
                onClick={handleConfirmTransfer}
              >
                Execute Atomic Transfer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Official Allocation Letter Modal */}
      <AllocationLetterModal
        isOpen={!!viewingLetterAllocId}
        onClose={() => setViewingLetterAllocId(null)}
        allocationId={viewingLetterAllocId}
      />

      {/* Demographics CSV Import Modal */}
      <DemographicsImportModal
        isOpen={isDemographicsModalOpen}
        onClose={() => setIsDemographicsModalOpen(false)}
      />

    </div>
  )
}
