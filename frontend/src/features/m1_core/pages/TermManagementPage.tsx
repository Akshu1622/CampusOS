import React, { useState, useEffect } from 'react'
import { Card, StatCard, Button, Input, Select, StatusPill, Drawer, EmptyState, ConfirmationDialog } from '@/components/ui'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'
import { Plus, Calendar, MoreHorizontal } from 'lucide-react'

export function TermManagementPage() {
  const [terms, setTerms] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [formData, setFormData] = useState({ year: new Date().getFullYear().toString(), label: 'FALL', start_date: '', end_date: '', is_current: false })
  const [formLoading, setFormLoading] = useState(false)
  const [confirmCurrentTerm, setConfirmCurrentTerm] = useState(false)

  const fetchTerms = async () => {
    setLoading(true)
    try {
      const res = await apiClient('/terms')
      setTerms(Array.isArray(res) ? res : [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch terms')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTerms()
  }, [])

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!formData.year || isNaN(Number(formData.year))) {
      toast.error('Please enter a valid academic year number (e.g. 2025)')
      return
    }
    if (!formData.start_date || !formData.end_date) {
      toast.error('Please provide both start and end date')
      return
    }
    setFormLoading(true)
    try {
      await apiClient('/terms', {
        data: {
          year: Number(formData.year),
          label: formData.label,
          start_date: formData.start_date,
          end_date: formData.end_date,
          is_current: formData.is_current,
        }
      })
      toast.success('Term created successfully')
      setIsDrawerOpen(false)
      fetchTerms()
      setFormData({ year: new Date().getFullYear().toString(), label: 'FALL', start_date: '', end_date: '', is_current: false })
      setConfirmCurrentTerm(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create term')
    } finally {
      setFormLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.is_current && terms.some(t => t.is_current)) {
      setConfirmCurrentTerm(true)
    } else {
      handleCreate()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Academic Terms</h1>
          <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Manage academic years and active terms</div>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>Add Term</Button>
      </div>

      {loading ? (
        <div>Loading terms...</div>
      ) : terms.length === 0 ? (
        <Card padding={0}>
          <EmptyState 
            icon={<Calendar size={32} />}
            title="No terms configured"
            description="Create an academic term to begin enrollment and scheduling."
            action={<Button variant="primary" onClick={() => setIsDrawerOpen(true) }>Add Term</Button>}
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {terms.map((term, i) => {
            const now = new Date()
            const start = new Date(term.start_date)
            const end = new Date(term.end_date)
            let status = 'Closed'
            let variant: any = 'neutral'
            
            if (term.is_current) {
              status = 'Current'
              variant = 'success'
            } else if (start > now) {
              status = 'Upcoming'
              variant = 'info'
            }

            return (
              <Card 
                key={i} 
                style={{ 
                  backgroundColor: term.is_current ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                  border: term.is_current ? '1px solid var(--color-primary)' : '1px solid var(--color-border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{term.year} - {term.label}</h3>
                      <StatusPill label={status} status={variant} />
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      {start.toLocaleDateString()} to {end.toLocaleDateString()}
                    </div>
                  </div>
                  <Button variant="subtle" size="sm"><MoreHorizontal size={16} /></Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Add Academic Term">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input label="Academic Year" type="number" required value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} placeholder="e.g. 2025" />
          <Select 
            label="Term Label" 
            options={[
              { value: 'FALL', label: 'FALL' },
              { value: 'SPRING', label: 'SPRING' },
              { value: 'SUMMER', label: 'SUMMER' },
              { value: 'WINTER', label: 'WINTER' },
            ]}
            value={formData.label} 
            onChange={(e) => setFormData({...formData, label: (e as any)?.target?.value || e})} 
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input label="Start Date" type="date" required value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
            <Input label="End Date" type="date" required value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
          </div>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
            <input 
              type="checkbox" 
              checked={formData.is_current}
              onChange={(e) => setFormData({...formData, is_current: e.target.checked})}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Mark as Current Term</span>
          </label>
          {formData.is_current && (
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              This will become the active term for dashboards and enrollments.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={formLoading}>Save</Button>
          </div>
        </form>
      </Drawer>

      <ConfirmationDialog
        isOpen={confirmCurrentTerm}
        title="Change Current Term"
        message="Setting this as the current term will remove the 'current' status from the previous term. This affects dashboards and active enrollment scopes. Are you sure?"
        confirmLabel="Yes, set as current"
        cancelLabel="Cancel"
        isDanger={false}
        onConfirm={() => handleCreate()}
        onCancel={() => setConfirmCurrentTerm(false)}
      />
    </div>
  )
}
