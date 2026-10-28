import React, { useState } from 'react'
import { Card, StatCard, Table, type Column, StatusPill, Button, Modal, Input, Select } from '@/components/ui'
import { useAllComplaints, useUpdateComplaintStatus, useHostels } from '../hooks'
import type { HostelComplaint, ComplaintStatus, ComplaintPriority } from '../api'
import { Wrench, CheckCircle, Clock, AlertTriangle, ShieldAlert } from 'lucide-react'

export function S13HostelComplaintsPage() {
  const { data: hostels = [] } = useHostels()
  const [selectedHostelId, setSelectedHostelId] = useState<number | undefined>()
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: complaints = [], isLoading } = useAllComplaints({
    hostel_id: selectedHostelId,
    status: statusFilter || undefined
  })

  const updateComplaint = useUpdateComplaintStatus()

  const [selectedComplaint, setSelectedComplaint] = useState<HostelComplaint | null>(null)
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('IN_PROGRESS')
  const [newPriority, setNewPriority] = useState<ComplaintPriority>('MEDIUM')
  const [assignedTo, setAssignedTo] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')

  const handleOpenAction = (c: HostelComplaint) => {
    setSelectedComplaint(c)
    setNewStatus(c.status)
    setNewPriority(c.priority || 'MEDIUM')
    setAssignedTo(c.assigned_to || '')
    setResolutionNotes(c.resolution_notes || '')
  }

  const handleUpdate = () => {
    if (!selectedComplaint) return
    updateComplaint.mutate({
      id: selectedComplaint.id,
      data: {
        status: newStatus,
        priority: newPriority,
        assigned_to: assignedTo || undefined,
        resolution_notes: resolutionNotes || undefined
      }
    }, {
      onSuccess: () => {
        setSelectedComplaint(null)
      }
    })
  }

  const pendingCount = complaints.filter(c => c.status === 'SUBMITTED' || c.status === 'ASSIGNED').length
  const inProgressCount = complaints.filter(c => c.status === 'IN_PROGRESS').length
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length

  const columns: Column<HostelComplaint>[] = [
    {
      header: 'Ticket #',
      key: 'id',
      render: (c) => <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>#{c.id}</span>
    },
    {
      header: 'Resident Student',
      key: 'student_id',
      render: (c) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.student_name || `Student #${c.student_id}`}</div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{c.global_student_id}</div>
        </div>
      )
    },
    {
      header: 'Location',
      key: 'hostel_name',
      render: (c) => (
        <div>
          <div style={{ fontWeight: 600 }}>{c.hostel_name || 'Hostel'}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Room {c.room_number || '—'}</div>
        </div>
      )
    },
    {
      header: 'Issue Details',
      key: 'title',
      render: (c) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.title}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Category: {c.category}</div>
        </div>
      )
    },
    {
      header: 'Priority',
      key: 'priority',
      render: (c) => (
        <StatusPill
          label={c.priority}
          status={c.priority === 'EMERGENCY' ? 'error' : c.priority === 'HIGH' ? 'warning' : 'neutral'}
        />
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (c) => (
        <StatusPill
          label={c.status}
          status={c.status === 'RESOLVED' || c.status === 'CLOSED' ? 'success' : c.status === 'IN_PROGRESS' ? 'warning' : 'neutral'}
        />
      )
    },
    {
      header: 'Actions',
      key: 'id',
      render: (c) => (
        <Button variant="subtle" size="sm" onClick={() => handleOpenAction(c)}>
          Manage
        </Button>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            HOS-13
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Hostel Maintenance & Complaints Desk
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Estate engineering and hostel caretaker console to assign technicians and resolve resident service tickets.
        </p>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Unassigned / New"
          value={pendingCount}
          tone="accent"
          icon={<Clock size={18} />}
          description="Awaiting technician allocation"
        />
        <StatCard
          label="In Progress Repairs"
          value={inProgressCount}
          tone="neutral"
          icon={<Wrench size={18} />}
          description="Under active maintenance"
        />
        <StatCard
          label="Resolved Tickets"
          value={resolvedCount}
          tone="positive"
          icon={<CheckCircle size={18} />}
          description="Completed work orders"
        />
      </div>

      {/* Filter Strip */}
      <Card padding={14}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '220px' }}>
            <Select
              value={selectedHostelId?.toString() || ''}
              onChange={(e) => setSelectedHostelId(e.target.value ? parseInt(e.target.value) : undefined)}
              options={[
                { label: 'All Residence Halls', value: '' },
                ...hostels.map(h => ({ label: h.name, value: h.id.toString() }))
              ]}
            />
          </div>
          <div style={{ width: '180px' }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Submitted', value: 'SUBMITTED' },
                { label: 'Assigned', value: 'ASSIGNED' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'Resolved', value: 'RESOLVED' },
                { label: 'Closed', value: 'CLOSED' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={0}>
        <Table
          data={complaints}
          columns={columns}
          keyExtractor={(c) => c.id.toString()}
          isLoading={isLoading}
          emptyMessage="No maintenance complaints match the selected filter."
        />
      </Card>

      {/* Manage Ticket Modal */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title={selectedComplaint ? `Manage Ticket #${selectedComplaint.id}: ${selectedComplaint.title}` : 'Manage Ticket'}
      >
        {selectedComplaint && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '12px',
              borderRadius: '6px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              fontSize: '13px'
            }}>
              <div>Resident: <strong>{selectedComplaint.student_name}</strong> ({selectedComplaint.global_student_id})</div>
              <div>Location: <strong>{selectedComplaint.hostel_name} - Room {selectedComplaint.room_number || 'Common Area'}</strong></div>
              <p style={{ margin: '8px 0 0', color: 'var(--color-text-secondary)' }}>
                {selectedComplaint.description}
              </p>
            </div>

            <Select
              label="Update Workflow Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
              options={[
                { label: 'Submitted (New)', value: 'SUBMITTED' },
                { label: 'Assigned to Technician', value: 'ASSIGNED' },
                { label: 'In Progress (Active Work)', value: 'IN_PROGRESS' },
                { label: 'Resolved (Finished)', value: 'RESOLVED' },
                { label: 'Closed', value: 'CLOSED' }
              ]}
            />

            <Select
              label="Admin Controlled Priority"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
              options={[
                { label: 'Low — Routine maintenance', value: 'LOW' },
                { label: 'Medium — Normal attention required', value: 'MEDIUM' },
                { label: 'High — Urgent response needed', value: 'HIGH' },
                { label: 'Emergency — Immediate hazard / health risk', value: 'EMERGENCY' }
              ]}
            />

            <Input
              label="Assigned Maintenance Staff"
              placeholder="e.g. Electrician Rajesh, Plumber Ramesh"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            />

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                Resolution / Inspection Remarks
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
                placeholder="State work performed, parts replaced, or completion notes..."
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
              <Button variant="tertiary" onClick={() => setSelectedComplaint(null)}>Cancel</Button>
              <Button variant="primary" isLoading={updateComplaint.isPending} onClick={handleUpdate}>
                Update Work Order
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
