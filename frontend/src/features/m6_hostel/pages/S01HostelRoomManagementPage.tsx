import React, { useState } from 'react'
import { Card, Button, Table, type Column, Modal, Input, Select, Progress, StatusPill, Drawer, StatCard } from '@/components/ui'
import { useHostels, useRooms, useOccupancy, useCreateHostel, useCreateRoom, useUpdateRoom, useDeleteRoom, useDeleteHostel, useAllocations } from '../hooks'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Room, GenderBlock, HostelAllocation } from '../api'
import { Building2, Home, Bed, Users, Plus, Trash2, Edit, UserCheck, Search, Filter, Download, Upload } from 'lucide-react'
import { DemographicsImportModal } from '../components/DemographicsImportModal'

const hostelSchema = z.object({
  name: z.string().min(1, 'Hostel name is required'),
  gender_block: z.enum(['MALE', 'FEMALE', 'COED']),
  total_capacity: z.coerce.number().min(0, 'Capacity must be >= 0')
})

const roomSchema = z.object({
  hostel_id: z.coerce.number().min(1, 'Please select a hostel'),
  room_number: z.string().min(1, 'Room number is required'),
  bed_capacity: z.coerce.number().min(1, 'Capacity must be >= 1')
})

export function S01HostelRoomManagementPage() {
  const { data: hostels = [], isLoading: hostelsLoading } = useHostels()
  const { data: occupancy = [] } = useOccupancy()
  
  const [selectedHostelId, setSelectedHostelId] = useState<number | undefined>()
  const { data: rooms = [], isLoading: roomsLoading } = useRooms(selectedHostelId)
  const { data: activeAllocations = [] } = useAllocations({ status: 'ACTIVE' })

  const [availabilityFilter, setAvailabilityFilter] = useState<string>('ALL')
  const [genderFilter, setGenderFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals & Drawers
  const [isHostelModalOpen, setIsHostelModalOpen] = useState(false)
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [viewingRoomOccupants, setViewingRoomOccupants] = useState<Room | null>(null)
  const [isDemographicsModalOpen, setIsDemographicsModalOpen] = useState(false)

  const createHostel = useCreateHostel()
  const deleteHostel = useDeleteHostel()
  const createRoom = useCreateRoom()
  const updateRoom = useUpdateRoom()
  const deleteRoom = useDeleteRoom()

  const { register: registerHostel, handleSubmit: submitHostel, reset: resetHostel, formState: { errors: hostelErrors } } = useForm({
    resolver: zodResolver(hostelSchema),
    defaultValues: { name: '', gender_block: 'COED' as GenderBlock, total_capacity: 0 }
  })

  const { register: registerRoom, handleSubmit: submitRoom, reset: resetRoom, setValue: setRoomValue, formState: { errors: roomErrors } } = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: { hostel_id: selectedHostelId || 0, room_number: '', bed_capacity: 1 }
  })

  const onHostelSubmit = (data: any) => {
    createHostel.mutate(data, {
      onSuccess: () => {
        setIsHostelModalOpen(false)
        resetHostel()
      }
    })
  }

  const onRoomSubmit = (data: any) => {
    const hostelId = Number(data.hostel_id || selectedHostelId || hostels[0]?.id)
    if (!hostelId || isNaN(hostelId)) {
      toast.error('Please select a valid hostel')
      return
    }

    if (editingRoom) {
      updateRoom.mutate({
        id: editingRoom.id,
        data: {
          room_number: data.room_number,
          bed_capacity: Number(data.bed_capacity)
        }
      }, {
        onSuccess: () => {
          setIsRoomModalOpen(false)
          setEditingRoom(null)
          resetRoom()
        }
      })
    } else {
      createRoom.mutate({
        ...data,
        hostel_id: hostelId,
        bed_capacity: Number(data.bed_capacity)
      }, {
        onSuccess: () => {
          setIsRoomModalOpen(false)
          resetRoom()
        }
      })
    }
  }

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room)
    setRoomValue('hostel_id', room.hostel_id)
    setRoomValue('room_number', room.room_number)
    setRoomValue('bed_capacity', room.bed_capacity)
    setIsRoomModalOpen(true)
  }

  const handleDeleteRoom = (room: Room) => {
    if (room.available_beds < room.bed_capacity) {
      toast.error(`Cannot delete Room ${room.room_number}: ${room.bed_capacity - room.available_beds} bed(s) are currently occupied. Vacate or transfer residents first.`)
      return
    }
    if (window.confirm(`Are you sure you want to delete Room ${room.room_number}?`)) {
      deleteRoom.mutate(room.id)
    }
  }

  const handleDeleteHostel = (hostelId: number, hostelName: string) => {
    const hostelRooms = rooms.filter(r => r.hostel_id === hostelId)
    if (hostelRooms.length > 0) {
      toast.error(`Cannot delete ${hostelName}: It still contains ${hostelRooms.length} room(s). Delete rooms first.`)
      return
    }
    if (window.confirm(`Are you sure you want to delete ${hostelName}?`)) {
      deleteHostel.mutate(hostelId)
      if (selectedHostelId === hostelId) setSelectedHostelId(undefined)
    }
  }

  // Filtered rooms
  const filteredRooms = rooms.filter(r => {
    if (availabilityFilter === 'AVAILABLE' && r.available_beds <= 0) return false
    if (availabilityFilter === 'FULL' && r.available_beds > 0) return false
    if (availabilityFilter === 'EMPTY' && r.available_beds !== r.bed_capacity) return false

    if (genderFilter !== 'ALL' && r.gender_block !== genderFilter) return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchRoom = r.room_number.toLowerCase().includes(q)
      const matchHostel = (r.hostel_name || '').toLowerCase().includes(q)
      if (!matchRoom && !matchHostel) return false
    }

    return true
  })

  // Summary Metrics (derived directly from live room inventory for 100% data consistency)
  const totalBedsAcrossCampus = rooms.reduce((sum, r) => sum + (r.bed_capacity || 0), 0)
  const totalOccupiedAcrossCampus = rooms.reduce((sum, r) => sum + Math.max(0, (r.bed_capacity || 0) - (r.available_beds || 0)), 0)
  const totalAvailableAcrossCampus = rooms.reduce((sum, r) => sum + (r.available_beds || 0), 0)

  // Occupants for viewing drawer
  const roomOccupants: HostelAllocation[] = viewingRoomOccupants
    ? activeAllocations.filter(a => a.room_id === viewingRoomOccupants.id)
    : []

  const handleExportCSV = () => {
    if (!filteredRooms.length) {
      toast.error('No rooms to export.')
      return
    }
    const headers = ['Hostel Name', 'Room Number', 'Gender Block', 'Bed Capacity', 'Occupied Beds', 'Available Beds', 'Readiness Status']
    const rows = filteredRooms.map(r => [
      `"${(r.hostel_name || '').replace(/"/g, '""')}"`,
      r.room_number,
      r.gender_block || 'COED',
      r.bed_capacity,
      r.bed_capacity - r.available_beds,
      r.available_beds,
      r.readiness_status || 'READY'
    ])
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `hostel_room_inventory_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Room inventory CSV exported')
  }

  const columns: Column<Room>[] = [
    {
      header: 'Room No.',
      key: 'room_number',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, maxWidth: '240px' }}>
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
            <Home size={15} />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              lineHeight: 1.25,
              fontSize: '13px'
            }}>
              Room {r.room_number}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={r.hostel_name || 'Hostel'}
            >
              {r.hostel_name || 'Hostel'}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Block Type',
      key: 'gender_block',
      render: (r) => (
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'var(--color-surface-subtle)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)'
        }}>
          {r.gender_block || 'COED'}
        </span>
      )
    },
    {
      header: 'Capacity',
      key: 'bed_capacity',
      render: (r) => <span style={{ fontWeight: 600 }}>{r.bed_capacity} Beds</span>
    },
    {
      header: 'Occupied',
      key: 'occupied',
      render: (r) => {
        const occ = r.bed_capacity - r.available_beds
        return (
          <span style={{ fontWeight: 600, color: occ > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
            {occ} / {r.bed_capacity}
          </span>
        )
      }
    },
    {
      header: 'Available',
      key: 'available_beds',
      render: (r) => (
        <span style={{ fontWeight: 700, color: r.available_beds > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
          {r.available_beds}
        </span>
      )
    },
    { 
      header: 'Status', 
      key: 'status', 
      render: (r) => {
        const isFull = r.available_beds === 0
        const isEmpty = r.available_beds === r.bed_capacity
        return (
          <StatusPill
            label={isFull ? 'Full' : isEmpty ? 'Empty' : `${r.available_beds} Available`}
            status={isFull ? 'error' : isEmpty ? 'neutral' : 'success'}
          />
        )
      }
    },
    {
      header: 'Actions',
      key: 'id',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexWrap: 'nowrap' }}>
          <Button
            variant="subtle"
            size="sm"
            leftIcon={<Users size={13} />}
            onClick={() => setViewingRoomOccupants(r)}
            title="View current occupants"
          >
            Occupants
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => handleEditRoom(r)}
            title="Edit room"
          >
            <Edit size={13} />
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => handleDeleteRoom(r)}
            title="Delete room"
            disabled={r.available_beds < r.bed_capacity}
          >
            <Trash2 size={13} style={{ color: r.available_beds < r.bed_capacity ? 'var(--color-text-muted)' : 'var(--color-error)' }} />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              HOS-01
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Hostel & Room Management
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Manage residence halls, gender wings, room numbers, bed capacities, and real-time occupancy.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="secondary" leftIcon={<Upload size={14} />} onClick={() => setIsDemographicsModalOpen(true)}>
            Import CSV (Rooms / Students)
          </Button>
          <Button variant="secondary" leftIcon={<Download size={14} />} onClick={handleExportCSV}>
            Export Inventory CSV
          </Button>
          <Button variant="secondary" leftIcon={<Building2 size={15} />} onClick={() => { resetHostel(); setIsHostelModalOpen(true) }}>
            Add Hostel
          </Button>
          <Button variant="primary" leftIcon={<Plus size={15} />} onClick={() => { setEditingRoom(null); resetRoom({ hostel_id: selectedHostelId || hostels[0]?.id || 0, room_number: '', bed_capacity: 2 }); setIsRoomModalOpen(true) }}>
            Add Room
          </Button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Residence Halls"
          value={hostels.length}
          tone="neutral"
          icon={<Building2 size={18} />}
          description="Active campus blocks"
        />
        <StatCard
          label="Total Registered Rooms"
          value={rooms.length}
          tone="neutral"
          icon={<Home size={18} />}
          description={selectedHostelId ? `In selected hall` : `Across campus`}
        />
        <StatCard
          label="Total Bed Capacity"
          value={totalBedsAcrossCampus}
          tone="neutral"
          icon={<Bed size={18} />}
          description="Computed from live rooms"
        />
        <StatCard
          label="Occupied Beds"
          value={totalOccupiedAcrossCampus}
          tone="accent"
          icon={<Users size={18} />}
          description="Active student allotments"
        />
        <StatCard
          label="Available Vacancies"
          value={totalAvailableAcrossCampus}
          tone="positive"
          icon={<UserCheck size={18} />}
          description="Ready for allocation"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
        {/* Left Column: Hostels List */}
        <div style={{ gridColumn: 'span 4' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Residence Halls
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{hostels.length} halls</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: `1.5px solid ${!selectedHostelId ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: !selectedHostelId ? 'var(--color-primary-subtle, #F0FDFA)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => setSelectedHostelId(undefined)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>All Hostels</div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 8px', borderRadius: '12px' }}>
                    {rooms.length} Rooms
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Display inventory across all campus blocks
                </div>
              </div>

              {hostelsLoading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading hostels...</div>
              ) : (
                hostels.map(hostel => {
                  const occ = occupancy.find(o => o.hostel_id === hostel.id)
                  const isSelected = selectedHostelId === hostel.id
                  const hostelRooms = rooms.filter(r => r.hostel_id === hostel.id)
                  const roomCapSum = hostelRooms.reduce((sum, r) => sum + (r.bed_capacity || 0), 0)
                  const roomAvailSum = hostelRooms.reduce((sum, r) => sum + (r.available_beds || 0), 0)
                  const roomOccSum = Math.max(0, roomCapSum - roomAvailSum)

                  const totalCap = roomCapSum > 0 ? roomCapSum : (occ?.total_capacity || hostel.total_capacity || 0)
                  const occBeds = roomCapSum > 0 ? roomOccSum : (occ?.occupied_beds || 0)
                  const pct = totalCap > 0 ? Math.round((occBeds / totalCap) * 100) : 0

                  return (
                    <div
                      key={hostel.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '8px',
                        border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: isSelected ? 'var(--color-primary-subtle, #F0FDFA)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => setSelectedHostelId(hostel.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 700,
                            fontSize: '14px',
                            color: 'var(--color-text-primary)',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            lineHeight: 1.3
                          }}>
                            {hostel.name}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            {hostel.gender_block} BLOCK
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '70px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                            {occBeds} / {totalCap}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Beds Filled</div>
                        </div>
                      </div>

                      <Progress value={pct} variant={pct >= 90 ? 'danger' : 'primary'} size="sm" />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        <span>Occupancy: <strong>{pct}%</strong></span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteHostel(hostel.id, hostel.name)
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                          title="Delete Hostel"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Rooms Table */}
        <div style={{ gridColumn: 'span 8' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Filter & Search Bar */}
            <Card padding={12}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
                  <Input
                    placeholder="Search by room number or hall..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div style={{ width: '160px' }}>
                  <Select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    options={[
                      { label: 'All Statuses', value: 'ALL' },
                      { label: 'Available Beds', value: 'AVAILABLE' },
                      { label: 'Full Rooms', value: 'FULL' },
                      { label: 'Empty Rooms', value: 'EMPTY' }
                    ]}
                  />
                </div>
                <div style={{ width: '150px' }}>
                  <Select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    options={[
                      { label: 'All Gender Wings', value: 'ALL' },
                      { label: 'Boys (MALE)', value: 'MALE' },
                      { label: 'Girls (FEMALE)', value: 'FEMALE' },
                      { label: 'Co-Ed (COED)', value: 'COED' }
                    ]}
                  />
                </div>
              </div>
            </Card>

            <Card padding={0}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {selectedHostelId ? `Rooms in ${hostels.find(h => h.id === selectedHostelId)?.name}` : 'All Rooms Inventory'}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Showing {filteredRooms.length} of {rooms.length} rooms
                </span>
              </div>
              <Table
                data={filteredRooms}
                columns={columns}
                keyExtractor={r => r.id.toString()}
                isLoading={roomsLoading}
                emptyMessage="No rooms found matching the selected filter criteria."
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Add / Edit Hostel Modal */}
      <Modal isOpen={isHostelModalOpen} onClose={() => setIsHostelModalOpen(false)} title="Create New Residence Hall">
        <form onSubmit={submitHostel(onHostelSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Hostel Name" placeholder="e.g. Einstein Hall" {...registerHostel('name')} error={hostelErrors.name?.message} />
          <Select
            label="Gender Block Restriction"
            {...registerHostel('gender_block')}
            error={hostelErrors.gender_block?.message}
            options={[
              { label: 'Boys Hostel (MALE)', value: 'MALE' },
              { label: 'Girls Hostel (FEMALE)', value: 'FEMALE' },
              { label: 'Co-ed Block (COED)', value: 'COED' }
            ]}
          />
          <Input
            type="number"
            label="Initial Total Capacity"
            placeholder="0"
            {...registerHostel('total_capacity')}
            error={hostelErrors.total_capacity?.message}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="tertiary" onClick={() => setIsHostelModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createHostel.isPending}>Save Hostel</Button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Room Modal */}
      <Modal
        isOpen={isRoomModalOpen}
        onClose={() => { setIsRoomModalOpen(false); setEditingRoom(null) }}
        title={editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add New Room'}
      >
        <form onSubmit={submitRoom(onRoomSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Select
            label="Residence Hall"
            {...registerRoom('hostel_id')}
            error={roomErrors.hostel_id?.message}
            disabled={!!editingRoom}
            options={hostels.map(h => ({ label: `${h.name} (${h.gender_block})`, value: h.id.toString() }))}
          />
          <Input label="Room Number / Identifier" placeholder="e.g. 101, 204-B" {...registerRoom('room_number')} error={roomErrors.room_number?.message} />
          <Input type="number" label="Bed Capacity" placeholder="e.g. 2" {...registerRoom('bed_capacity')} error={roomErrors.bed_capacity?.message} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="tertiary" onClick={() => { setIsRoomModalOpen(false); setEditingRoom(null) }}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createRoom.isPending || updateRoom.isPending}>
              {editingRoom ? 'Update Room' : 'Create Room'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Occupants Drawer */}
      <Drawer
        isOpen={!!viewingRoomOccupants}
        onClose={() => setViewingRoomOccupants(null)}
        title={viewingRoomOccupants ? `Room ${viewingRoomOccupants.room_number} Occupants Roster` : ''}
        size="md"
      >
        {viewingRoomOccupants && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>
                  {viewingRoomOccupants.hostel_name || 'Residence Hall'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Room {viewingRoomOccupants.room_number} • {viewingRoomOccupants.gender_block} Block
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-primary)' }}>
                  {viewingRoomOccupants.bed_capacity - viewingRoomOccupants.available_beds} / {viewingRoomOccupants.bed_capacity} Beds
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Occupied</div>
              </div>
            </div>

            <h4 style={{ margin: '8px 0 0', fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Current Residents
            </h4>

            {roomOccupants.length === 0 ? (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                background: 'var(--color-surface-subtle)',
                borderRadius: '8px',
                border: '1px dashed var(--color-border)',
                color: 'var(--color-text-muted)',
                fontSize: '13px'
              }}>
                This room is currently vacant. All {viewingRoomOccupants.bed_capacity} beds are available for allocation.
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
                        {alloc.student_name || `Student #${alloc.student_id}`}
                      </div>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {alloc.global_student_id || `ID: ${alloc.student_id}`}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        Allotted on: {new Date(alloc.from_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'var(--color-primary-subtle, #F0FDFA)',
                        color: 'var(--color-primary, #0D9488)',
                        border: '1px solid var(--color-border)'
                      }}>
                        {alloc.bed_number || 'Bed A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Authoritative Demographics CSV Import */}
      <DemographicsImportModal
        isOpen={isDemographicsModalOpen}
        onClose={() => setIsDemographicsModalOpen(false)}
      />
    </div>
  )
}
