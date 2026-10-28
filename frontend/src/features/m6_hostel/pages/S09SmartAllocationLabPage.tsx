import React, { useState, useEffect } from 'react'
import { Card, StatCard, Button, Input, Select, StatusPill, LoadingSkeleton } from '@/components/ui'
import { searchHostelStudents, getSmartAllocation } from '../api'
import { useAllocateRoom } from '../hooks'
import type { StudentSearchItem, SmartAllocationResponse, RoomScoreDetail } from '../api'
import { Sparkles, Bed, Home, CheckCircle2, User, Search, Award, ArrowRight, ShieldAlert, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export function S09SmartAllocationLabPage() {
  const [studentQuery, setStudentQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StudentSearchItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchItem | null>(null)

  const [recommendations, setRecommendations] = useState<SmartAllocationResponse | null>(null)
  const [isLoadingRecs, setIsLoadingRecs] = useState(false)

  const allocateRoom = useAllocateRoom()
  const navigate = useNavigate()

  // Debounced search
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
      } catch (err) {
        console.error(err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [studentQuery])

  const handleSelectStudent = async (student: StudentSearchItem) => {
    setSelectedStudent(student)
    setSearchResults([])
    setStudentQuery(`${student.first_name} ${student.last_name}`)
    setIsLoadingRecs(true)
    try {
      const recs = await getSmartAllocation(student.id)
      setRecommendations(recs)
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate recommendations')
    } finally {
      setIsLoadingRecs(false)
    }
  }

  const handleAllotRoom = (room: RoomScoreDetail) => {
    if (!selectedStudent) return
    allocateRoom.mutate({
      student_id: selectedStudent.id,
      room_id: room.room_id,
      bed_number: room.suggested_bed,
      from_date: new Date().toISOString().split('T')[0]
    }, {
      onSuccess: () => {
        toast.success(`Successfully allocated ${selectedStudent.first_name} to Room ${room.room_number} (${room.suggested_bed})`)
        navigate('/admin/hostel/room-allocation')
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0D9488', background: '#E0F5F3', padding: '2px 8px', borderRadius: '4px' }}>
            FLAGSHIP B
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Explainable Smart Allocation Lab
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Rule-scored room allocation engine with demographic block matching, vacancy reserve optimization, and explainable rationale.
        </p>
      </div>

      {/* Student Selector Card */}
      <Card padding={20}>
        <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Select Student for Intelligent Matching
        </h3>

        <div style={{ position: 'relative', maxWidth: '480px' }}>
          <Input
            placeholder="Type student name or STU-... ID to evaluate..."
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
          />

          {isSearching && (
            <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Searching student registry...
            </div>
          )}

          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 10,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              marginTop: '4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              maxHeight: '240px',
              overflowY: 'auto'
            }}>
              {searchResults.map(s => (
                <div
                  key={s.id}
                  onClick={() => handleSelectStudent(s)}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
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
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Selected Student & Recommendations Area */}
      {isLoadingRecs && (
        <Card padding={24}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <LoadingSkeleton height={32} />
            <LoadingSkeleton height={120} />
          </div>
        </Card>
      )}

      {recommendations && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Student Eligibility Profile Banner */}
          <Card padding={20}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {recommendations.student_name}
                  </h3>
                  <StatusPill
                    label={recommendations.is_eligible ? 'ELIGIBLE APPLICANT' : 'ALLOCATION BLOCKED'}
                    status={recommendations.is_eligible ? 'success' : 'error'}
                  />
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Official ID: {recommendations.global_student_id} • Demographics: {recommendations.gender || 'UNVERIFIED'}
                </div>
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)'
                }}>
                  <strong>Eligibility Note:</strong> {recommendations.eligibility_note}
                </div>
              </div>
            </div>
          </Card>

          {/* Ranked Recommendations List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Ranked Room Recommendations (Sorted by Match Score)
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {recommendations.recommended_rooms.length} candidate rooms evaluated
              </span>
            </div>

            {recommendations.recommended_rooms.length === 0 ? (
              <Card padding={32}>
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                  No eligible rooms found for this student based on current block rules and vacancy availability.
                </div>
              </Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {recommendations.recommended_rooms.map((room, idx) => {
                  const isTopMatch = idx === 0 && room.score > 70
                  return (
                    <Card key={room.room_id} padding={20}>
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                Room {room.room_number}
                              </h4>
                              {isTopMatch && (
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#0D9488',
                                  background: '#E0F5F3',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}>
                                  <Sparkles size={11} /> TOP MATCH
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              {room.hostel_name} ({room.gender_block} Block)
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontSize: '20px',
                              fontWeight: 800,
                              color: room.score >= 80 ? '#0D9488' : room.score >= 60 ? '#D97706' : 'var(--color-text-primary)'
                            }}>
                              {room.score}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Match Score</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'var(--color-surface-subtle)',
                            fontWeight: 600
                          }}>
                            {room.available_beds} of {room.bed_capacity} Beds Free
                          </span>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: '#F0FDFA',
                            color: '#0D9488',
                            fontWeight: 600
                          }}>
                            Suggested: {room.suggested_bed}
                          </span>
                        </div>

                        {/* Explainable Rationale */}
                        <div style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          background: 'var(--color-surface-subtle)',
                          border: '1px solid var(--color-border)',
                          flex: 1
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                            SCORING BREAKDOWN & RATIONALE
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                            {room.reasons.map((r, rIdx) => (
                              <li key={rIdx}>{r}</li>
                            ))}
                          </ul>
                        </div>

                        <Button
                          variant={isTopMatch ? 'primary' : 'secondary'}
                          size="sm"
                          leftIcon={<Check size={14} />}
                          isLoading={allocateRoom.isPending}
                          onClick={() => handleAllotRoom(room)}
                          style={{ width: '100%' }}
                        >
                          Allot Room {room.room_number} ({room.suggested_bed})
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
