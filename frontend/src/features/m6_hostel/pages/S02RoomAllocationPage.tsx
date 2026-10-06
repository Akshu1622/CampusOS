import React, { useState } from 'react'
import { Card, Button, Input, Select, StatusPill } from '@/components/ui'
import { useHostels, useRooms, useAllocateRoom } from '../hooks'
import { getStudents } from '../api'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const allocateSchema = z.object({
  student_id: z.coerce.number().min(1, 'Student is required'),
  room_id: z.coerce.number().min(1, 'Room is required'),
  from_date: z.string().min(1, 'From date is required')
})

export function S02RoomAllocationPage() {
  const { data: hostels = [] } = useHostels()
  const [selectedHostelId, setSelectedHostelId] = useState<number | undefined>()
  const { data: rooms = [] } = useRooms(selectedHostelId)
  
  const { data: students = [] } = useQuery({
    queryKey: ['students_all'],
    queryFn: getStudents
  })

  const allocateRoom = useAllocateRoom()

  const [searchStudent, setSearchStudent] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>()
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>()
  
  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm({
    resolver: zodResolver(allocateSchema),
    defaultValues: { student_id: 0, room_id: 0, from_date: new Date().toISOString().split('T')[0] }
  })

  const filteredStudents = students.filter((s: any) => 
    s.name?.toLowerCase().includes(searchStudent.toLowerCase()) || 
    s.university_id?.toLowerCase().includes(searchStudent.toLowerCase())
  ).slice(0, 10)

  const selectedStudent = students.find((s: any) => s.id === selectedStudentId)
  const selectedRoom = rooms.find(r => r.id === selectedRoomId)
  const selectedHostel = hostels.find(h => h.id === selectedHostelId)

  const onSubmit = (data: any) => {
    allocateRoom.mutate(data, {
      onSuccess: () => {
        reset()
        setSelectedStudentId(undefined)
        setSelectedRoomId(undefined)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Room Allocation</h1>
        <p className="text-sm text-gray-500 mt-1">Allocate students to available hostel rooms.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Pane: Student Picker */}
          <Card title="1. Select Student">
            <div className="space-y-4">
              <Input 
                placeholder="Search by name or ID..." 
                value={searchStudent}
                onChange={e => setSearchStudent(e.target.value)}
              />
              <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
                {filteredStudents.length === 0 && <div className="p-4 text-center text-sm text-gray-500">No students found</div>}
                {filteredStudents.map((s: any) => (
                  <div 
                    key={s.id} 
                    className={`p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 ${selectedStudentId === s.id ? 'bg-primary-50 border-l-2 border-primary-500' : ''}`}
                    onClick={() => {
                      setSelectedStudentId(s.id)
                      setValue('student_id', s.id)
                    }}
                  >
                    <div>
                      <div className="font-medium text-sm text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.university_id} • {s.program_id}</div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.student_id && <div className="text-sm text-red-500">{errors.student_id.message as string}</div>}
            </div>
          </Card>

          {/* Right Pane: Room Picker */}
          <Card title="2. Select Room">
            <div className="space-y-4">
              <Select 
                label="Filter by Hostel" 
                value={selectedHostelId?.toString() || ''}
                onChange={e => setSelectedHostelId(e.target.value ? parseInt(e.target.value) : undefined)}
                options={[
                  { label: 'All Hostels', value: '' },
                  ...hostels.map(h => ({ label: h.name, value: h.id.toString() }))
                ]}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {rooms.length === 0 && <div className="col-span-3 text-center text-sm text-gray-500 py-4">No rooms match filter</div>}
                {rooms.map(r => {
                  const h = hostels.find(h => h.id === r.hostel_id)
                  const isSelected = selectedRoomId === r.id
                  const isFull = r.available_beds === 0
                  return (
                    <div 
                      key={r.id}
                      className={`border rounded-lg p-3 text-center ${isFull ? 'bg-gray-100 opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-primary-300'} ${isSelected ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : ''}`}
                      onClick={() => {
                        if (!isFull) {
                          setSelectedRoomId(r.id)
                          setValue('room_id', r.id)
                        }
                      }}
                    >
                      <div className="text-xs text-gray-500 mb-1">{h?.name}</div>
                      <div className="font-medium text-gray-900 text-lg mb-2">{r.room_number}</div>
                      <StatusPill 
                        label={`${r.available_beds} left`} 
                        status={isFull ? 'error' : r.available_beds === 1 ? 'warning' : 'success'} 
                      />
                    </div>
                  )
                })}
              </div>
              {errors.room_id && <div className="text-sm text-red-500">{errors.room_id.message as string}</div>}
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Summary</div>
              <div className="text-lg font-medium text-gray-900 flex items-center gap-3">
                {selectedStudent ? <span className="text-primary-600">{selectedStudent.name}</span> : <span className="text-gray-400 italic">No student selected</span>}
                <span className="text-gray-400">→</span>
                {selectedRoom ? (
                  <span className="text-primary-600">{selectedHostel?.name} - {selectedRoom.room_number}</span>
                ) : (
                  <span className="text-gray-400 italic">No room selected</span>
                )}
              </div>
              {selectedRoom && (
                <div className="text-sm text-gray-500">
                  Beds left after: <span className="font-medium">{selectedRoom.available_beds - 1}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="w-40">
                <Input type="date" label="From Date" {...register('from_date')} error={errors.from_date?.message as string} />
              </div>
              <Button type="submit" size="lg" isLoading={allocateRoom.isPending} disabled={!selectedStudentId || !selectedRoomId}>
                Allocate Room
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  )
}
