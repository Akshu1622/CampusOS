import React, { useState } from 'react'
import { Card, Button, Table, type Column, Modal, Input, Select, Progress, StatusPill } from '@/components/ui'
import { useHostels, useRooms, useOccupancy, useCreateHostel, useCreateRoom } from '../hooks'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Room, GenderBlock } from '../api'

const hostelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  gender_block: z.enum(['MALE', 'FEMALE', 'COED']),
  total_capacity: z.coerce.number().min(0, 'Capacity must be >= 0')
})

const roomSchema = z.object({
  hostel_id: z.coerce.number(),
  room_number: z.string().min(1, 'Room number is required'),
  bed_capacity: z.coerce.number().min(1, 'Capacity must be >= 1')
})

export function S01HostelRoomManagementPage() {
  const { data: hostels = [], isLoading: hostelsLoading } = useHostels()
  const { data: occupancy = [] } = useOccupancy()
  
  const [selectedHostelId, setSelectedHostelId] = useState<number | undefined>()
  const { data: rooms = [], isLoading: roomsLoading } = useRooms(selectedHostelId)
  
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('ALL')

  const [isHostelModalOpen, setIsHostelModalOpen] = useState(false)
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false)

  const createHostel = useCreateHostel()
  const createRoom = useCreateRoom()

  const { register: registerHostel, handleSubmit: submitHostel, reset: resetHostel, formState: { errors: hostelErrors } } = useForm({
    resolver: zodResolver(hostelSchema),
    defaultValues: { name: '', gender_block: 'COED' as GenderBlock, total_capacity: 0 }
  })

  const { register: registerRoom, handleSubmit: submitRoom, reset: resetRoom, formState: { errors: roomErrors } } = useForm({
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
    createRoom.mutate(data, {
      onSuccess: () => {
        setIsRoomModalOpen(false)
        resetRoom()
      }
    })
  }

  const filteredRooms = rooms.filter(r => {
    if (availabilityFilter === 'AVAILABLE') return r.available_beds > 0
    if (availabilityFilter === 'FULL') return r.available_beds === 0
    if (availabilityFilter === 'EMPTY') return r.available_beds === r.bed_capacity
    return true
  })

  const columns: Column<Room>[] = [
    { header: 'Room No.', key: 'room_number', render: (r) => <span className="font-medium">{r.room_number}</span> },
    { header: 'Capacity', key: 'bed_capacity', render: (r) => <>{r.bed_capacity} Beds</> },
    { header: 'Available', key: 'available_beds', render: (r) => <span className="font-medium text-green-600">{r.available_beds}</span> },
    { header: 'Occupied', key: 'occupied', render: (r) => <>{r.bed_capacity - r.available_beds}</> },
    { 
      header: 'Status', 
      key: 'status', 
      render: (r) => (
        <StatusPill 
          label={r.available_beds === 0 ? 'Full' : r.available_beds === r.bed_capacity ? 'Empty' : 'Available'}
          status={r.available_beds === 0 ? 'error' : r.available_beds === r.bed_capacity ? 'neutral' : 'success'}
        />
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Hostel & Room Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage hostels, capacities, and individual rooms.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => { resetHostel(); setIsHostelModalOpen(true) }}>Add Hostel</Button>
          <Button variant="primary" onClick={() => { resetRoom({ hostel_id: selectedHostelId || hostels[0]?.id || 0 }); setIsRoomModalOpen(true) }}>Add Room</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Hostels List */}
        <div className="md:col-span-4 space-y-4">
          <h3 className="font-medium text-gray-700">Hostels</h3>
          <div className="space-y-3">
            <div 
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${!selectedHostelId ? 'border-primary-500 bg-primary-50' : 'bg-white hover:border-gray-300'}`}
              onClick={() => setSelectedHostelId(undefined)}
            >
              <div className="font-semibold text-gray-900">All Hostels</div>
              <div className="text-sm text-gray-500 mt-1">View all rooms</div>
            </div>
            
            {hostelsLoading ? (
              <div className="p-4 bg-white border rounded-lg animate-pulse h-24" />
            ) : (
              hostels.map(hostel => {
                const occ = occupancy.find(o => o.hostel_id === hostel.id)
                const isSelected = selectedHostelId === hostel.id
                return (
                  <div 
                    key={hostel.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-primary-500 bg-primary-50' : 'bg-white hover:border-gray-300'}`}
                    onClick={() => setSelectedHostelId(hostel.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">{hostel.name}</div>
                        <div className="text-xs text-gray-500">{hostel.gender_block}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{occ ? occ.occupied_beds : 0} / {hostel.total_capacity}</div>
                        <div className="text-xs text-gray-500">Beds filled</div>
                      </div>
                    </div>
                    {occ && <Progress value={occ.occupancy_pct || 0} variant={(occ.occupancy_pct || 0) > 90 ? 'danger' : 'primary'} size="sm" />}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right: Rooms Table */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-700">Rooms {selectedHostelId ? `in ${hostels.find(h => h.id === selectedHostelId)?.name}` : 'in All Hostels'}</h3>
            <Select 
              value={availabilityFilter} 
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              options={[
                { label: 'All Rooms', value: 'ALL' },
                { label: 'Available', value: 'AVAILABLE' },
                { label: 'Full', value: 'FULL' },
                { label: 'Empty', value: 'EMPTY' }
              ]}
            />
          </div>
          <Card padding="none">
            <Table 
              data={filteredRooms} 
              columns={columns} 
              keyExtractor={r => r.id.toString()}
              isLoading={roomsLoading}
              emptyMessage="No rooms found matching the criteria."
            />
          </Card>
        </div>
      </div>

      <Modal isOpen={isHostelModalOpen} onClose={() => setIsHostelModalOpen(false)} title="Add Hostel">
        <form onSubmit={submitHostel(onHostelSubmit)} className="space-y-4">
          <Input label="Hostel Name" {...registerHostel('name')} error={hostelErrors.name?.message} />
          <Select label="Gender/Type" {...registerHostel('gender_block')} error={hostelErrors.gender_block?.message} options={[
            { label: 'Boys', value: 'MALE' },
            { label: 'Girls', value: 'FEMALE' },
            { label: 'Co-ed', value: 'COED' }
          ]} />
          <Input type="number" label="Total Capacity" {...registerHostel('total_capacity')} error={hostelErrors.total_capacity?.message} />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="tertiary" onClick={() => setIsHostelModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createHostel.isPending}>Create Hostel</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} title="Add Room">
        <form onSubmit={submitRoom(onRoomSubmit)} className="space-y-4">
          <Select label="Hostel" {...registerRoom('hostel_id')} error={roomErrors.hostel_id?.message} options={
            hostels.map(h => ({ label: h.name, value: h.id.toString() }))
          } />
          <Input label="Room Number" {...registerRoom('room_number')} error={roomErrors.room_number?.message} />
          <Input type="number" label="Bed Capacity" {...registerRoom('bed_capacity')} error={roomErrors.bed_capacity?.message} />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="tertiary" onClick={() => setIsRoomModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createRoom.isPending}>Create Room</Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
