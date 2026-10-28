import React, { useState } from 'react'
import { Card, StatCard, Button, Input, StatusPill, LoadingSkeleton } from '@/components/ui'
import { searchHostelStudents, getStudentHostelJourney } from '../api'
import type { StudentSearchItem, StudentJourneyResponse } from '../api'
import { Compass, User, Clock, Home, CheckCircle2, AlertCircle, Wrench, Send, LogOut, RefreshCw, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function S12StudentHostelJourneyPage() {
  const [studentQuery, setStudentQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StudentSearchItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchItem | null>(null)

  const [journey, setJourney] = useState<StudentJourneyResponse | null>(null)
  const [isLoadingJourney, setIsLoadingJourney] = useState(false)

  const handleSearch = async (query: string) => {
    setStudentQuery(query)
    if (!query || query.trim().length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchHostelStudents(query.trim())
      setSearchResults(results)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectStudent = async (student: StudentSearchItem) => {
    setSelectedStudent(student)
    setSearchResults([])
    setStudentQuery(`${student.first_name} ${student.last_name}`)
    setIsLoadingJourney(true)
    try {
      const res = await getStudentHostelJourney(student.id)
      setJourney(res)
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch student journey')
    } finally {
      setIsLoadingJourney(false)
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'REQUEST_SUBMITTED':
      case 'REQUEST_DECIDED':
        return <Clock size={16} />
      case 'ALLOCATED':
        return <Home size={16} />
      case 'TRANSFER':
        return <RefreshCw size={16} />
      case 'VACATED':
        return <LogOut size={16} />
      case 'COMPLAINT':
        return <Wrench size={16} />
      case 'OUTPASS':
        return <Send size={16} />
      default:
        return <CheckCircle2 size={16} />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '4px' }}>
            FLAGSHIP E
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Student Hostel Residential Journey
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Unified chronological timeline tracing an individual student's residential lifecycle from initial application to room allocation, transfers, complaints, inspections, and vacating.
        </p>
      </div>

      {/* Student Picker Card */}
      <Card padding={20}>
        <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Select Student to Audit Residential Journey
        </h3>

        <div style={{ position: 'relative', maxWidth: '480px' }}>
          <Input
            placeholder="Search by student name or STU-... ID..."
            value={studentQuery}
            onChange={(e) => handleSearch(e.target.value)}
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
              maxHeight: '220px',
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
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    {s.gender || 'UNVERIFIED'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Journey Content */}
      {isLoadingJourney && (
        <Card padding={24}>
          <LoadingSkeleton height={40} />
          <div style={{ marginTop: '16px' }}><LoadingSkeleton height={140} /></div>
        </Card>
      )}

      {journey && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Student Status Profile */}
          <Card padding={20}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {journey.student_name}
                  </h3>
                  <StatusPill
                    label={journey.current_hostel ? 'CURRENTLY ALLOCATED' : 'UNALLOCATED RESIDENT'}
                    status={journey.current_hostel ? 'success' : 'neutral'}
                  />
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Official ID: <strong>{journey.global_student_id}</strong> • Status: {journey.current_status}
                </div>
              </div>

              {journey.current_hostel && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: 'var(--color-primary-subtle, #F0FDFA)',
                  border: '1px solid var(--color-primary, #0D9488)',
                  fontSize: '13px'
                }}>
                  Current: <strong>{journey.current_hostel} - Room {journey.current_room || '—'}</strong>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline Stream */}
          <Card padding={24}>
            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Complete Residential Timeline ({journey.events.length} Milestones)
            </h3>

            {journey.events.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No events recorded for this student.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '28px' }}>
                <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: 'var(--color-border)' }} />

                {journey.events.map((event: any, idx: number) => {
                  const badgeVariant = event.badge_variant || 'neutral'
                  return (
                    <div key={idx} style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        left: '-28px',
                        top: '4px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: badgeVariant === 'success' ? '#10B981' : badgeVariant === 'warning' ? '#F59E0B' : badgeVariant === 'error' ? '#EF4444' : '#0D9488',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 0 3px white',
                        border: '1px solid var(--color-border)'
                      }}>
                        {getEventIcon(event.event_type)}
                      </div>

                      <div style={{
                        padding: '14px 18px',
                        borderRadius: '8px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>
                            {event.title}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                          {event.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
