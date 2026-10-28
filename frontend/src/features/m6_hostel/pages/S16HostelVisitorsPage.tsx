import React, { useState } from 'react'
import { Card, StatCard, Table, type Column, StatusPill, Button, Modal, Input, Select } from '@/components/ui'
import { useVisitors, useRegisterVisitor, useRecordVisitorExit, useHostels } from '../hooks'
import { searchHostelStudents, type StudentSearchItem, type HostelVisitor } from '../api'
import { Shield, UserCheck, Clock, LogOut, Plus, Search, CheckCircle2, Ticket, Printer } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function S16HostelVisitorsPage() {
  const { data: hostels = [] } = useHostels()
  const [selectedHostelId, setSelectedHostelId] = useState<number | undefined>()

  const { data: visitors = [], isLoading } = useVisitors({
    hostel_id: selectedHostelId
  })

  const registerVisitor = useRegisterVisitor()
  const recordExit = useRecordVisitorExit()

  // Register Modal state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [hostelId, setHostelId] = useState<number>(hostels[0]?.id || 1)
  const [studentQuery, setStudentQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StudentSearchItem[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchItem | null>(null)
  const [visitorName, setVisitorName] = useState('')
  const [relationship, setRelationship] = useState('Parent')
  const [idProofType, setIdProofType] = useState('Aadhaar Card')
  const [idProofNumber, setIdProofNumber] = useState('')
  const [purpose, setPurpose] = useState('')

  // View Pass modal
  const [viewingPass, setViewingPass] = useState<HostelVisitor | null>(null)

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

  const handleRegister = () => {
    if (!selectedStudent) {
      toast.error('Please search and select the resident student.')
      return
    }
    if (!visitorName.trim()) {
      toast.error('Visitor name is required.')
      return
    }

    registerVisitor.mutate({
      hostel_id: hostelId,
      student_id: selectedStudent.student_id ?? selectedStudent.id,
      visitor_name: visitorName,
      relationship,
      id_proof_type: idProofType,
      id_proof_number: idProofNumber || undefined,
      purpose: purpose || 'General visit'
    }, {
      onSuccess: () => {
        setIsRegisterOpen(false)
        setSelectedStudent(null)
        setStudentQuery('')
        setVisitorName('')
        setIdProofNumber('')
        setPurpose('')
      }
    })
  }

  const handleLogExit = (id: number) => {
    recordExit.mutate({ id, data: { exit_time: new Date().toISOString() } })
  }

  const activeVisitorsCount = visitors.filter(v => !v.exit_time).length
  const departedCount = visitors.filter(v => !!v.exit_time).length

  const columns: Column<HostelVisitor>[] = [
    {
      header: 'Gate Pass #',
      key: 'gate_pass_number',
      render: (v) => (
        <span style={{
          fontFamily: 'monospace',
          fontWeight: 700,
          background: 'var(--color-surface-subtle)',
          padding: '4px 8px',
          borderRadius: '4px',
          color: '#0D9488',
          border: '1px solid var(--color-border)'
        }}>
          {v.gate_pass_number || `GP-${v.id}`}
        </span>
      )
    },
    {
      header: 'Visitor Details',
      key: 'visitor_name',
      render: (v) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{v.visitor_name}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Relation: <strong>{v.relationship}</strong> • ID: {v.id_proof_type}
          </div>
        </div>
      )
    },
    {
      header: 'Host Student',
      key: 'student_id',
      render: (v) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v.student_name || `Student #${v.student_id}`}</div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
            {v.global_student_id}
          </div>
        </div>
      )
    },
    {
      header: 'Residence Hall',
      key: 'hostel_name',
      render: (v) => (
        <div style={{ fontSize: '13px', fontWeight: 500 }}>
          {v.hostel_name || 'Hostel'}
        </div>
      )
    },
    {
      header: 'Entry / Departure',
      key: 'entry_time',
      render: (v) => (
        <div style={{ fontSize: '12px' }}>
          <div>Entry: <strong>{new Date(v.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> ({new Date(v.entry_time).toLocaleDateString()})</div>
          {v.exit_time ? (
            <div style={{ color: 'var(--color-text-muted)' }}>
              Exit: {new Date(v.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          ) : (
            <div style={{ color: '#D97706', fontWeight: 600 }}>Currently Inside</div>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'id',
      render: (v) => (
        <StatusPill
          label={v.exit_time ? 'Departed' : 'Active Pass'}
          status={v.exit_time ? 'neutral' : 'warning'}
        />
      )
    },
    {
      header: 'Actions',
      key: 'id',
      render: (v) => (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Button
            variant="tertiary"
            size="sm"
            leftIcon={<Ticket size={13} />}
            onClick={() => setViewingPass(v)}
            title="View Gate Pass Slip"
          >
            Gate Pass
          </Button>
          {!v.exit_time && (
            <Button
              variant="subtle"
              size="sm"
              leftIcon={<LogOut size={13} />}
              onClick={() => handleLogExit(v.id)}
              isLoading={recordExit.isPending}
              title="Record Visitor Departure"
            >
              Log Exit
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Hostel Visitor Desk & Gate Pass Management
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Digital visitor registry, official gate pass issuance, and campus security timestamping.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => {
            setHostelId(hostels[0]?.id || 1)
            setIsRegisterOpen(true)
          }}
        >
          Register Visitor & Issue Pass
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Active Visitors On-Site"
          value={activeVisitorsCount}
          tone="warning"
          icon={<Shield size={20} />}
          description="Currently inside hostels"
        />
        <StatCard
          label="Departed Today"
          value={departedCount}
          tone="positive"
          icon={<CheckCircle2 size={20} />}
          description="Exited safely"
        />
        <StatCard
          label="Total Logged Visits"
          value={visitors.length}
          tone="neutral"
          icon={<Clock size={20} />}
          description="Security registry entries"
        />
      </div>

      {/* Filter Toolbar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '240px' }}>
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
        </div>
      </Card>

      {/* Visitor Log Table */}
      <Card padding={0}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Visitor Activity Log ({visitors.length})
          </h3>
        </div>

        <Table
          columns={columns}
          data={visitors}
          isLoading={isLoading}
          keyExtractor={(v) => v.id.toString()}
          emptyMessage="No visitor records logged for the selected hall."
        />
      </Card>

      {/* Register Visitor Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Visitor Registration & Digital Gate Pass"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Hostel Selection */}
          <Select
            label="Residence Hall"
            value={hostelId}
            onChange={(e) => setHostelId(Number(e.target.value))}
            options={hostels.map(h => ({ label: `${h.name} (${h.gender_block})`, value: h.id }))}
          />

          {/* Student Search */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              Host Resident Student
            </label>
            <div style={{ position: 'relative' }}>
              <Input
                placeholder="Search resident student name or STU-..."
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
                  maxHeight: '160px',
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
                          justifyContent: 'space-between'
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
                  <div style={{ fontSize: '11px', color: '#134E4A' }}>ID: {selectedStudent.global_student_id}</div>
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

          {/* Visitor Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Visitor Full Name"
              placeholder="e.g. Ramesh Sharma"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              required
            />
            <Select
              label="Relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              options={[
                { label: 'Parent / Guardian', value: 'Parent' },
                { label: 'Sibling', value: 'Sibling' },
                { label: 'Relative', value: 'Relative' },
                { label: 'Friend / Peer', value: 'Friend' },
                { label: 'Official / Delivery', value: 'Official' }
              ]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Select
              label="ID Proof Type"
              value={idProofType}
              onChange={(e) => setIdProofType(e.target.value)}
              options={[
                { label: 'Aadhaar Card', value: 'Aadhaar Card' },
                { label: 'Passport', value: 'Passport' },
                { label: 'Driver License', value: 'Driver License' },
                { label: 'Voter ID', value: 'Voter ID' },
                { label: 'College ID', value: 'College ID' }
              ]}
            />
            <Input
              label="ID Proof Number"
              placeholder="e.g. 1234-5678-9012"
              value={idProofNumber}
              onChange={(e) => setIdProofNumber(e.target.value)}
            />
          </div>

          <Input
            label="Purpose of Visit"
            placeholder="e.g. Bringing study materials, weekend family visit"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="tertiary" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
            <Button variant="primary" isLoading={registerVisitor.isPending} onClick={handleRegister}>
              Generate Gate Pass & Log Entry
            </Button>
          </div>
        </div>
      </Modal>

      {/* Gate Pass View Modal */}
      <Modal
        isOpen={!!viewingPass}
        onClose={() => setViewingPass(null)}
        title="Official Visitor Security Pass"
        size="md"
      >
        {viewingPass && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: '#FFFFFF',
              border: '2px solid #0F172A',
              borderRadius: '8px',
              padding: '20px',
              color: '#0F172A'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, textTransform: 'uppercase' }}>CampusOS Gate Pass</h3>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Hostel Security Checkpoint</div>
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '14px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '4px'
                }}>
                  {viewingPass.gate_pass_number || `GP-${viewingPass.id}`}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Visitor Name</div>
                  <strong>{viewingPass.visitor_name}</strong> ({viewingPass.relationship})
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Host Resident</div>
                  <strong>{viewingPass.student_name || `Student #${viewingPass.student_id}`}</strong>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0D9488' }}>{viewingPass.global_student_id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Residence Hall</div>
                  <strong>{viewingPass.hostel_name || 'Hostel'}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Entry Timestamp</div>
                  <strong>{new Date(viewingPass.entry_time).toLocaleString()}</strong>
                </div>
              </div>

              {viewingPass.exit_time && (
                <div style={{ marginTop: '12px', padding: '8px', background: '#F8FAFC', borderRadius: '4px', fontSize: '12px' }}>
                  Departure Recorded: <strong>{new Date(viewingPass.exit_time).toLocaleString()}</strong>
                </div>
              )}

              <div style={{ marginTop: '14px', borderTop: '1px dashed #CBD5E1', paddingTop: '10px', fontSize: '10px', color: '#64748B', lineHeight: 1.4 }}>
                Notice: Visitors must wear this pass at all times while on campus. Visiting hours conclude strictly at 20:00.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="tertiary" onClick={() => setViewingPass(null)}>Close</Button>
              <Button variant="primary" leftIcon={<Printer size={14} />} onClick={() => window.print()}>
                Print Gate Pass
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
