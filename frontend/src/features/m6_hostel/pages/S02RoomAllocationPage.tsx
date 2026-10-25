import React, { useState } from 'react'
import { Card, Button, Input, Select, StatusPill, StatCard } from '@/components/ui'
import { useHostels, useRooms, useAllocateRoom } from '../hooks'
import { getStudents } from '../api'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Home, Bed, User, CheckCircle2, ArrowRight } from 'lucide-react'

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

  const filteredStudents = students.filter((s: any) => {
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim()
    const studentId = s.global_student_id || s.student_id || ''
    return fullName.toLowerCase().includes(searchStudent.toLowerCase()) || 
      String(studentId).toLowerCase().includes(searchStudent.toLowerCase())
  }).slice(0, 10)

  const selectedStudent = students.find((s: any) => s.id === selectedStudentId)
  const selectedRoom = rooms.find(r => r.id === selectedRoomId)
  const selectedHostel = hostels.find(h => h.id === (selectedRoom ? selectedRoom.hostel_id : selectedHostelId))

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            HOS-02
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Room & Bed Allocation Console
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Assign verified students to vacant hostel beds with automatic vacancy recount and fee sync.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Left Pane: Student Picker */}
          <Card padding={20}>
            <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              1. Select Student
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input 
                placeholder="Search student by name or enrollment ID..." 
                value={searchStudent}
                onChange={e => setSearchStudent(e.target.value)}
              />
              <div style={{
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {filteredStudents.length === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    No students match search
                  </div>
                )}
                {filteredStudents.map((s: any) => (
                  <div 
                    key={s.id} 
                    onClick={() => {
                      setSelectedStudentId(s.id)
                      setValue('student_id', s.id)
                    }}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border)',
                      background: selectedStudentId === s.id ? 'var(--color-primary-subtle)' : 'transparent',
                      borderLeft: selectedStudentId === s.id ? '3px solid var(--color-primary)' : '3px solid transparent'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                      {s.first_name} {s.last_name}
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                      {s.global_student_id || s.student_id} • Program #{s.program_id}
                    </div>
                  </div>
                ))}
              </div>
              {errors.student_id && <div style={{ fontSize: '12px', color: 'var(--color-error)' }}>{errors.student_id.message as string}</div>}
            </div>
          </Card>

          {/* Right Pane: Room Picker */}
          <Card padding={20}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                2. Select Vacant Room
              </h3>
              <div style={{ width: '160px' }}>
                <Select
                  value={selectedHostelId?.toString() || ''}
                  onChange={e => setSelectedHostelId(e.target.value ? parseInt(e.target.value) : undefined)}
                  options={[
                    { label: 'All Hostels', value: '' },
                    ...hostels.map(h => ({ label: h.name, value: h.id.toString() }))
                  ]}
                />
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '10px',
              maxHeight: '300px',
              overflowY: 'auto',
              padding: '4px'
            }}>
              {rooms.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>No rooms available</div>}
              {rooms.map(r => {
                const isSelected = selectedRoomId === r.id
                const isFull = r.available_beds === 0
                return (
                  <div 
                    key={r.id}
                    onClick={() => {
                      if (!isFull) {
                        setSelectedRoomId(r.id)
                        setValue('room_id', r.id)
                      }
                    }}
                    style={{
                      border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: '6px',
                      padding: '10px 8px',
                      textAlign: 'center',
                      cursor: isFull ? 'not-allowed' : 'pointer',
                      opacity: isFull ? 0.4 : 1,
                      background: isSelected ? 'var(--color-primary-subtle)' : isFull ? 'var(--color-surface-subtle)' : 'var(--color-surface)'
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{r.room_number}</div>
                    <div style={{ marginTop: '4px' }}>
                      <StatusPill 
                        label={`${r.available_beds} bed`} 
                        status={isFull ? 'error' : r.available_beds === 1 ? 'warning' : 'success'} 
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            {errors.room_id && <div style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '8px' }}>{errors.room_id.message as string}</div>}
          </Card>
        </div>

        {/* Bottom Submission Strip */}
        <Card padding={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>CONFIRMATION SUMMARY</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedStudent ? (
                  <span style={{ color: 'var(--color-primary)' }}>{selectedStudent.first_name} {selectedStudent.last_name}</span>
                ) : (
                  <span style={{ color: 'var(--color-text-muted)' }}>Select Student</span>
                )}
                <span>→</span>
                {selectedRoom ? (
                  <span style={{ color: 'var(--color-primary)' }}>{selectedHostel?.name} (Room {selectedRoom.room_number})</span>
                ) : (
                  <span style={{ color: 'var(--color-text-muted)' }}>Select Room</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '160px' }}>
                <Input type="date" {...register('from_date')} />
              </div>
              <Button type="submit" variant="primary" size="md" isLoading={allocateRoom.isPending} disabled={!selectedStudentId || !selectedRoomId}>
                Confirm Allocation
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  )
}
