import React, { useState } from 'react'
import { Card, StatCard, Button, StatusPill, EmptyState, LoadingSkeleton, Modal, Input, Select } from '@/components/ui'
import { useMyHostel, useMyComplaints, useCreateComplaint, useMyOutpasses, useCreateOutpass, useMyJourney, useNotices, useInspections, useCreateInspection } from '../hooks'
import { useNavigate } from 'react-router-dom'
import { Home, Bed, Calendar, Mail, Info, RefreshCw, LogOut, Wrench, Shield, Clock, Send, CheckCircle2, AlertCircle, FileText, ClipboardCheck, Bell, Star } from 'lucide-react'
import type { ComplaintCategory, ComplaintPriority, RequestStatus } from '../api'
import { AllocationLetterModal } from '../components/AllocationLetterModal'
import { HostelFeeStudentView } from '../components/HostelFeeStudentView'

export function S04MyHostelPage() {
  const { data: allocation, isLoading: allocLoading, error } = useMyHostel()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FEES' | 'COMPLAINTS' | 'OUTPASSES' | 'CHECKLIST' | 'NOTICES' | 'JOURNEY'>('OVERVIEW')
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false)

  // Handover Checklist (Inspections)
  const { data: inspections = [], isLoading: inspectionsLoading } = useInspections(allocation?.room_id)
  const createInspection = useCreateInspection()
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false)
  const [inspectionType, setInspectionType] = useState<'CHECK_IN' | 'CHECK_OUT' | 'ROUTINE'>('CHECK_IN')
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(5)
  const [fixturesCondition, setFixturesCondition] = useState<'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED'>('GOOD')
  const [inventoryChecked, setInventoryChecked] = useState(true)
  const [inspectionRemarks, setInspectionRemarks] = useState('')
  const [inspectorName, setInspectorName] = useState('')

  // Targeted Notices
  const { data: notices = [], isLoading: noticesLoading } = useNotices(allocation?.hostel_id || undefined)

  // Complaints & Outpasses
  const { data: complaints = [], isLoading: complaintsLoading } = useMyComplaints()
  const createComplaint = useCreateComplaint()
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false)
  const [complaintCategory, setComplaintCategory] = useState<ComplaintCategory>('ELECTRICAL')
  const [complaintPriority, setComplaintPriority] = useState<ComplaintPriority>('MEDIUM')
  const [complaintTitle, setComplaintTitle] = useState('')
  const [complaintDesc, setComplaintDesc] = useState('')

  const { data: outpasses = [], isLoading: outpassesLoading } = useMyOutpasses()
  const createOutpass = useCreateOutpass()
  const [isOutpassModalOpen, setIsOutpassModalOpen] = useState(false)
  const [outpassFrom, setOutpassFrom] = useState('')
  const [outpassTo, setOutpassTo] = useState('')
  const [outpassDest, setOutpassDest] = useState('')
  const [outpassReason, setOutpassReason] = useState('')

  const { data: journey, isLoading: journeyLoading } = useMyJourney()

  const handleOpenOutpassModal = () => {
    const from = new Date()
    const to = new Date(from.getTime() + 86400000)
    setOutpassFrom(from.toISOString().slice(0, 16))
    setOutpassTo(to.toISOString().slice(0, 16))
    setIsOutpassModalOpen(true)
  }

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault()
    if (!allocation) return
    createComplaint.mutate({
      hostel_id: allocation.hostel_id || 1,
      room_id: allocation.room_id,
      category: complaintCategory,
      priority: complaintPriority,
      title: complaintTitle,
      description: complaintDesc
    }, {
      onSuccess: () => {
        setIsComplaintModalOpen(false)
        setComplaintTitle('')
        setComplaintDesc('')
      }
    })
  }

  const handleCreateOutpass = (e: React.FormEvent) => {
    e.preventDefault()
    createOutpass.mutate({
      from_datetime: outpassFrom,
      to_datetime: outpassTo,
      destination: outpassDest,
      reason: outpassReason
    }, {
      onSuccess: () => {
        setIsOutpassModalOpen(false)
        setOutpassDest('')
        setOutpassReason('')
      }
    })
  }

  const handleCreateChecklist = (e: React.FormEvent) => {
    e.preventDefault()
    if (!allocation) return
    createInspection.mutate({
      room_id: allocation.room_id,
      student_id: allocation.student_id,
      inspection_type: inspectionType,
      cleanliness_rating: cleanlinessRating,
      fixtures_condition: fixturesCondition,
      inventory_checked: inventoryChecked,
      remarks: inspectionRemarks || undefined,
      inspector_name: inspectorName || allocation.student_name || 'Resident Student'
    }, {
      onSuccess: () => {
        setIsChecklistModalOpen(false)
        setInspectionRemarks('')
        setInspectorName('')
      }
    })
  }

  if (allocLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
        <LoadingSkeleton height={40} />
        <LoadingSkeleton height={140} />
      </div>
    )
  }

  // If there's an error or no active allocation
  if (error || !allocation || allocation.status === 'VACATED') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              HOS-04
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              My Hostel Accommodation
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Student residential accommodation portal, billing invoices, and warden desk.
          </p>
        </div>

        <Card padding={32}>
          <EmptyState
            title="No Active Hostel Room Allocation"
            description="You are currently not assigned to an active room. If you require on-campus accommodation, please submit an application."
            actionLabel="Apply for Hostel Accommodation"
            onAction={() => navigate('/student/hostel/new-request')}
          />
        </Card>

        {/* Show student hostel invoices & UPI payments even before room assignment */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px', color: 'var(--color-text-primary)' }}>
            Hostel Fees & Invoices
          </h2>
          <HostelFeeStudentView />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              HOS-04
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              My Hostel Accommodation
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Official university residential room allotment, bed number, and warden desk contact.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => navigate('/student/hostel/new-request?type=ROOM_CHANGE')}
          >
            Request Room Change
          </Button>
          <Button
            variant="subtle"
            size="sm"
            leftIcon={<LogOut size={14} />}
            onClick={() => navigate('/student/hostel/new-request?type=VACATE')}
          >
            Request Vacate
          </Button>
        </div>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Assigned Residence Hall"
          value={allocation.hostel_name || 'Residence Hall'}
          tone="positive"
          icon={<Home size={18} />}
          description={`${allocation.gender_block || 'COED'} Block`}
        />
        <StatCard
          label="Room & Bed Number"
          value={`Room ${allocation.room_number || '—'}`}
          tone="accent"
          icon={<Bed size={18} />}
          description={allocation.bed_number ? `Allocated: ${allocation.bed_number}` : 'Standard Bed'}
        />
        <StatCard
          label="Allotment Start Date"
          value={allocation.from_date ? new Date(allocation.from_date).toLocaleDateString() : '—'}
          tone="neutral"
          icon={<Calendar size={18} />}
          description="Academic Session 2026–27"
        />
        <StatCard
          label="Tenancy Status"
          value={allocation.status}
          tone="positive"
          icon={<CheckCircle2 size={18} />}
          description="Official Room Sanction"
        />
      </div>

      {/* Tabs Bar */}
      <Card padding={0}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          padding: '0 16px',
          background: 'var(--color-surface)',
          overflowX: 'auto'
        }}>
          {[
            { id: 'OVERVIEW', label: 'Room & Amenities' },
            { id: 'FEES', label: 'Hostel Fees & Invoices' },
            { id: 'COMPLAINTS', label: `Service & Maintenance (${complaints.length})` },
            { id: 'OUTPASSES', label: `Leave & Outpasses (${outpasses.length})` },
            { id: 'CHECKLIST', label: `Handover Checklist (${inspections.length})` },
            { id: 'NOTICES', label: `Hostel Notices (${notices.length})` },
            { id: 'JOURNEY', label: 'My Residential Journey' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '14px 18px',
                border: 'none',
                background: 'transparent',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                color: activeTab === tab.id ? 'var(--color-primary, #0D9488)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary, #0D9488)' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: FEES */}
        {activeTab === 'FEES' && (
          <div style={{ padding: '24px' }}>
            <HostelFeeStudentView
              studentName={allocation.student_name}
              globalStudentId={allocation.global_student_id}
              hostelName={allocation.hostel_name}
              roomNumber={allocation.room_number}
            />
          </div>
        )}

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>ROOM ALLOTMENT</div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-text-primary)' }}>
                  Room {allocation.room_number} • {allocation.bed_number || 'Bed 1'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Equipped with study desk, wardrobe & high-speed Wi-Fi
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>STUDENT IDENTITY</div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-text-primary)' }}>
                  {allocation.student_name || 'Resident'}
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Official ID: {allocation.global_student_id}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>WARDEN OFFICE</div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  {allocation.hostel_name} Warden Desk
                </div>
                <a href="mailto:warden@campusos.edu" style={{ fontSize: '13px', color: 'var(--color-primary, #0D9488)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Mail size={13} /> warden@campusos.edu
                </a>
              </div>
            </div>

            <div style={{
              marginTop: '12px',
              padding: '14px 16px',
              borderRadius: '8px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '13px',
              color: 'var(--color-text-secondary)'
            }}>
              <Info size={18} style={{ color: 'var(--color-primary, #0D9488)', flexShrink: 0 }} />
              <span>
                <strong>Hostel Maintenance Desk:</strong> For repairs (electrical, plumbing, mess, sanitation, Wi-Fi), switch to the <em>Service & Maintenance</em> tab above to raise a tracked ticket directly to the estate engineering team.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                leftIcon={<FileText size={15} />}
                onClick={() => setIsLetterModalOpen(true)}
              >
                View Official Allotment Order
              </Button>
              <Button
                variant="secondary"
                leftIcon={<ClipboardCheck size={15} />}
                onClick={() => setActiveTab('CHECKLIST')}
              >
                Move-In / Move-Out Inspection
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: COMPLAINTS */}
        {activeTab === 'COMPLAINTS' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Room Maintenance & Incident Tickets
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Track repairs, electrical faults, plumbing, and room service requests.
                </span>
              </div>
              <Button variant="primary" size="sm" leftIcon={<Wrench size={14} />} onClick={() => setIsComplaintModalOpen(true)}>
                Log Service Ticket
              </Button>
            </div>

            {complaints.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', borderRadius: '8px' }}>
                No active service complaints logged. Your room is in good order!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {complaints.map(c => (
                  <div
                    key={c.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>{c.title}</span>
                        <StatusPill
                          label={c.status}
                          status={c.status === 'RESOLVED' || c.status === 'CLOSED' ? 'success' : c.status === 'IN_PROGRESS' ? 'warning' : 'neutral'}
                        />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Category: <strong>{c.category}</strong> • Priority: <strong>{c.priority}</strong> • Submitted: {new Date(c.created_at).toLocaleDateString()}
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {c.description}
                      </p>
                      {c.resolution_notes && (
                        <div style={{ marginTop: '8px', padding: '6px 10px', background: 'var(--color-surface-subtle)', borderRadius: '4px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          <strong>Technician Note:</strong> {c.resolution_notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: OUTPASSES */}
        {activeTab === 'OUTPASSES' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Campus Leave & Overnight Outpasses
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Official outpass approvals for overnight stays or weekend home visits.
                </span>
              </div>
              <Button variant="primary" size="sm" leftIcon={<Send size={14} />} onClick={handleOpenOutpassModal}>
                Apply Outpass
              </Button>
            </div>

            {outpasses.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', borderRadius: '8px' }}>
                No outpass applications on record.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {outpasses.map(o => (
                  <div
                    key={o.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                          Destination: {o.destination}
                        </span>
                        <StatusPill
                          label={o.status}
                          status={o.status === 'APPROVED' ? 'success' : o.status === 'PENDING' ? 'warning' : 'error'}
                        />
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        From: <strong>{new Date(o.from_datetime).toLocaleString()}</strong> &nbsp;—&nbsp; To: <strong>{new Date(o.to_datetime).toLocaleString()}</strong>
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        Reason: {o.reason}
                      </p>
                      {o.decision_remark && (
                        <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          <strong>Warden Remark:</strong> {o.decision_remark}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: CHECKLIST */}
        {activeTab === 'CHECKLIST' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Move-In / Move-Out Handover Checklists
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Room fixtures, inventory audits, cleanliness rating, and handover signoffs.
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ClipboardCheck size={14} />}
                onClick={() => setIsChecklistModalOpen(true)}
              >
                Log Handover Inspection
              </Button>
            </div>

            {inspectionsLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading inspections...</div>
            ) : inspections.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', borderRadius: '8px' }}>
                No handover inspections logged yet for Room {allocation.room_number}. Click "Log Handover Inspection" to record initial condition.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {inspections.map((ins) => (
                  <div key={ins.id} style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: ins.inspection_type === 'CHECK_IN' ? '#F0FDFA' : '#FFFBEB',
                          color: ins.inspection_type === 'CHECK_IN' ? '#0F766E' : '#B45309',
                          border: `1px solid ${ins.inspection_type === 'CHECK_IN' ? '#99F6E4' : '#FDE68A'}`
                        }}>
                          {ins.inspection_type === 'CHECK_IN' ? 'MOVE-IN HANDOVER' : ins.inspection_type === 'CHECK_OUT' ? 'MOVE-OUT CLEARANCE' : 'ROUTINE INSPECTION'}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          Fixture Condition: {ins.fixtures_condition}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {new Date(ins.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      <div>Cleanliness Rating: <strong>{'★'.repeat(ins.cleanliness_rating)}{'☆'.repeat(5 - ins.cleanliness_rating)}</strong> ({ins.cleanliness_rating}/5)</div>
                      <div>Inventory Verified: <strong>{ins.inventory_checked ? 'Yes (All items accounted)' : 'Discrepancy noted'}</strong></div>
                      <div>Inspected By: <strong>{ins.inspector_name}</strong></div>
                    </div>

                    {ins.remarks && (
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)', background: 'var(--color-surface-subtle)', padding: '8px 12px', borderRadius: '4px' }}>
                        Remarks: {ins.remarks}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: NOTICES */}
        {activeTab === 'NOTICES' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Targeted Residence Announcements
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Official notices broadcast specifically for {allocation.hostel_name} residents.
              </span>
            </div>

            {noticesLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading notices...</div>
            ) : notices.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', borderRadius: '8px' }}>
                No active announcements for {allocation.hostel_name} at this time.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notices.map((n) => (
                  <div key={n.id} style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: n.priority === 'EMERGENCY' ? '#FEF2F2' : n.priority === 'URGENT' ? '#FFFBEB' : '#F0FDFA',
                          color: n.priority === 'EMERGENCY' ? '#991B1B' : n.priority === 'URGENT' ? '#B45309' : '#0F766E',
                          border: '1px solid var(--color-border)'
                        }}>
                          {n.priority}
                        </span>
                        <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{n.title}</strong>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {n.content}
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      Published by: {n.publisher_name || 'Warden Office'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: JOURNEY */}
        {activeTab === 'JOURNEY' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Official Residential Timeline
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Chronological record of applications, allocations, transfers, and maintenance logs.
              </span>
            </div>

            {journeyLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading timeline...</div>
            ) : !journey || !journey.events || journey.events.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', borderRadius: '8px' }}>
                No recorded accommodation events yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '24px' }}>
                <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: 'var(--color-border)' }} />

                {journey.events.map((event: any, idx: number) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '-24px',
                      top: '4px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: event.badge_variant === 'success' ? '#10B981' : event.badge_variant === 'warning' ? '#F59E0B' : '#0D9488',
                      border: '3px solid white',
                      boxShadow: '0 0 0 1px var(--color-border)'
                    }} />

                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                          {event.title}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Log Complaint Modal */}
      <Modal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        title="Lodge Maintenance & Repair Ticket"
      >
        <form onSubmit={handleCreateComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Select
            label="Service Category"
            value={complaintCategory}
            onChange={(e) => setComplaintCategory(e.target.value as any)}
            options={[
              { label: 'Electrical (Lights, Sockets, Fans)', value: 'ELECTRICAL' },
              { label: 'Plumbing (Taps, Showers, Drainage, Leakage)', value: 'PLUMBING' },
              { label: 'Mess & Dining (Food Quality, Hygiene)', value: 'MESS_FOOD' },
              { label: 'Cleaning & Sanitation (Washrooms, Floors)', value: 'CLEANING_SANITATION' },
              { label: 'Water Supply & Drinking Water', value: 'WATER_UTILITIES' },
              { label: 'Internet / Wi-Fi Connectivity', value: 'INTERNET_WIFI' },
              { label: 'Room Furniture & Fixtures (Bed, Cupboard, Study Desk)', value: 'ROOM_FURNITURE' },
              { label: 'Other Operations / General Issue', value: 'OTHER' }
            ]}
          />
          <Select
            label="Urgency Level"
            value={complaintPriority}
            onChange={(e) => setComplaintPriority(e.target.value as any)}
            options={[
              { label: 'Low (Routine check)', value: 'LOW' },
              { label: 'Medium (Standard repair)', value: 'MEDIUM' },
              { label: 'High (Significant inconvenience)', value: 'HIGH' },
              { label: 'Emergency (Safety hazard, leak)', value: 'EMERGENCY' }
            ]}
          />
          <Input
            label="Short Summary"
            placeholder="e.g. Study desk light socket not functioning"
            value={complaintTitle}
            onChange={(e) => setComplaintTitle(e.target.value)}
            required
          />
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              Detailed Description
            </label>
            <textarea
              value={complaintDesc}
              onChange={(e) => setComplaintDesc(e.target.value)}
              rows={3}
              placeholder="Describe the issue and when it started..."
              required
              style={{
                width: '100%',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                padding: '10px 12px',
                fontSize: '14px',
                fontFamily: 'inherit',
                color: 'var(--color-text-primary)',
                background: 'var(--color-surface)',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="tertiary" onClick={() => setIsComplaintModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createComplaint.isPending}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Apply Outpass Modal */}
      <Modal
        isOpen={isOutpassModalOpen}
        onClose={() => setIsOutpassModalOpen(false)}
        title="Apply for Campus Leave / Outpass"
      >
        <form onSubmit={handleCreateOutpass} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              type="datetime-local"
              label="Departure Datetime"
              value={outpassFrom}
              onChange={(e) => setOutpassFrom(e.target.value)}
              required
            />
            <Input
              type="datetime-local"
              label="Expected Return Datetime"
              value={outpassTo}
              onChange={(e) => setOutpassTo(e.target.value)}
              required
            />
          </div>
          <Input
            label="Destination"
            placeholder="e.g. Home Address (Pune), City Center"
            value={outpassDest}
            onChange={(e) => setOutpassDest(e.target.value)}
            required
          />
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              Reason for Leave
            </label>
            <textarea
              value={outpassReason}
              onChange={(e) => setOutpassReason(e.target.value)}
              rows={3}
              placeholder="State reason (e.g. Weekend family visit, medical appointment)..."
              required
              style={{
                width: '100%',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                padding: '10px 12px',
                fontSize: '14px',
                fontFamily: 'inherit',
                color: 'var(--color-text-primary)',
                background: 'var(--color-surface)',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="tertiary" onClick={() => setIsOutpassModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createOutpass.isPending}>
              Submit Outpass Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Handover Inspection Modal */}
      <Modal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        title="Room Handover & Inventory Inspection"
        size="md"
      >
        <form onSubmit={handleCreateChecklist} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Select
            label="Inspection Stage"
            value={inspectionType}
            onChange={(e) => setInspectionType(e.target.value as any)}
            options={[
              { label: 'Move-In Handover Checklist', value: 'CHECK_IN' },
              { label: 'Move-Out Room Clearance', value: 'CHECK_OUT' },
              { label: 'Routine Room Inspection', value: 'ROUTINE' }
            ]}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Select
              label="Cleanliness Rating"
              value={cleanlinessRating}
              onChange={(e) => setCleanlinessRating(Number(e.target.value))}
              options={[
                { label: '5 Stars — Spotless / Clean', value: 5 },
                { label: '4 Stars — Good condition', value: 4 },
                { label: '3 Stars — Acceptable', value: 3 },
                { label: '2 Stars — Needs cleaning', value: 2 },
                { label: '1 Star — Unsatisfactory', value: 1 }
              ]}
            />

            <Select
              label="Fixtures Condition"
              value={fixturesCondition}
              onChange={(e) => setFixturesCondition(e.target.value as any)}
              options={[
                { label: 'Excellent', value: 'EXCELLENT' },
                { label: 'Good', value: 'GOOD' },
                { label: 'Fair (Wear & tear)', value: 'FAIR' },
                { label: 'Damaged (Needs repair)', value: 'DAMAGED' }
              ]}
            />
          </div>

          <div style={{
            padding: '12px',
            background: 'var(--color-surface-subtle)',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <strong style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>Standard Checklist Audit:</strong>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inventoryChecked}
                onChange={(e) => setInventoryChecked(e.target.checked)}
              />
              <span>I confirm keys, bed frame, study table, chair, and wardrobe lock are accounted for.</span>
            </label>
          </div>

          <Input
            label="Inspector / Student Signature Name"
            placeholder="e.g. Student Full Name or Warden"
            value={inspectorName}
            onChange={(e) => setInspectorName(e.target.value)}
          />

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              Inspection Notes / Discrepancies
            </label>
            <textarea
              value={inspectionRemarks}
              onChange={(e) => setInspectionRemarks(e.target.value)}
              rows={3}
              placeholder="Record any pre-existing scratches, missing bulbs, or notes..."
              style={{
                width: '100%',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                padding: '10px 12px',
                fontSize: '13px',
                fontFamily: 'inherit',
                color: 'var(--color-text-primary)',
                background: 'var(--color-surface)',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="tertiary" onClick={() => setIsChecklistModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createInspection.isPending}>
              Sign & Save Inspection
            </Button>
          </div>
        </form>
      </Modal>

      {/* Official Allocation Letter Modal */}
      <AllocationLetterModal
        isOpen={isLetterModalOpen}
        onClose={() => setIsLetterModalOpen(false)}
        allocationId={allocation?.id || null}
      />
    </div>
  )
}
