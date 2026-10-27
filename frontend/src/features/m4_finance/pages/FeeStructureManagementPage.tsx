import React, { useState, useEffect } from 'react'
import { Card, Table, type Column, Button, Alert, StatCard, StatusPill, Drawer, Input, Select } from '@/components/ui'
import { CreditCard, Plus, FileText, CheckCircle2, MoreHorizontal, Download, Layers, Trash2, Award, Percent } from 'lucide-react'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'

interface ComponentFormItem {
  component_name: string
  amount: string
  due_date: string
  caste_category: 'ALL' | 'GENERAL' | 'OBC' | 'SC' | 'ST' | 'EWS'
  concession_percent: string
}

interface FeeStructureItem {
  id: number
  program_id: number
  program_name?: string
  term_id: number
  term_label?: string
  structure_name: string
  components_count?: number
  total_amount?: number
  components?: any[]
}

export const FeeStructureManagementPage: React.FC = () => {
  const [structures, setStructures] = useState<FeeStructureItem[]>([])
  const [programs, setPrograms] = useState<{ id: number; name: string }[]>([])
  const [terms, setTerms] = useState<{ id: number; term_label: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedStructure, setSelectedStructure] = useState<FeeStructureItem | null>(null)

  const [structureName, setStructureName] = useState('')
  const [selectedProgramId, setSelectedProgramId] = useState<number>(1)
  const [selectedTermId, setSelectedTermId] = useState<number>(1)

  const [componentsList, setComponentsList] = useState<ComponentFormItem[]>([
    { component_name: 'Tuition Fee (General/OBC)', amount: '50000', due_date: '2026-11-30', caste_category: 'GENERAL', concession_percent: '0' },
    { component_name: 'Tuition Fee (OBC Concession)', amount: '50000', due_date: '2026-11-30', caste_category: 'OBC', concession_percent: '25' },
    { component_name: 'Tuition Fee (SC/ST Govt Concession)', amount: '50000', due_date: '2026-11-30', caste_category: 'SC', concession_percent: '100' },
    { component_name: 'Tuition Fee (EWS Concession)', amount: '50000', due_date: '2026-11-30', caste_category: 'EWS', concession_percent: '50' },
    { component_name: 'Laboratory & Development Charges', amount: '8000', due_date: '2026-11-30', caste_category: 'ALL', concession_percent: '0' },
    { component_name: 'Library & Subscriptions', amount: '3000', due_date: '2026-11-30', caste_category: 'ALL', concession_percent: '0' }
  ])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resFs, resProg, resTerms] = await Promise.allSettled([
        apiClient<any>('/fee-structures?page_size=50'),
        apiClient<any>('/programs?page_size=50'),
        apiClient<any>('/terms?page_size=50')
      ])

      if (resFs.status === 'fulfilled') {
        const list = Array.isArray(resFs.value) ? resFs.value : resFs.value?.items || []
        setStructures(list)
      }
      if (resProg.status === 'fulfilled') {
        const pList = Array.isArray(resProg.value) ? resProg.value : resProg.value?.items || []
        setPrograms(pList)
        if (pList.length > 0) setSelectedProgramId(pList[0].id)
      }
      if (resTerms.status === 'fulfilled') {
        const tList = Array.isArray(resTerms.value) ? resTerms.value : resTerms.value?.items || []
        setTerms(tList)
        if (tList.length > 0) setSelectedTermId(tList[0].id)
      }
    } catch (err: any) {
      toast.error('Failed to load fee structures')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddComponent = () => {
    setComponentsList([
      ...componentsList,
      {
        component_name: 'Tuition Fee Concession',
        amount: '50000',
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        caste_category: 'SC',
        concession_percent: '100'
      }
    ])
  }

  const handleRemoveComponent = (idx: number) => {
    setComponentsList(componentsList.filter((_, i) => i !== idx))
  }

  const handleUpdateComponent = (idx: number, field: keyof ComponentFormItem, val: string) => {
    const updated = [...componentsList]
    updated[idx] = { ...updated[idx], [field]: val }
    setComponentsList(updated)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!structureName.trim()) {
      toast.error('Structure name is required')
      return
    }

    try {
      const payload = {
        program_id: selectedProgramId,
        term_id: selectedTermId,
        structure_name: structureName,
        components: componentsList.map(c => ({
          component_name: c.component_name,
          amount: parseFloat(c.amount) || 0,
          due_date: c.due_date,
          caste_category: c.caste_category,
          concession_percent: parseFloat(c.concession_percent) || 0
        }))
      }

      await apiClient('/fee-structures', { data: payload })
      toast.success('Fee structure created with caste concessions applied!')
      setIsDrawerOpen(false)
      setStructureName('')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create fee structure')
    }
  }

  const columns: Column<FeeStructureItem>[] = [
    {
      header: 'Structure ID',
      key: 'id',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)', fontSize: '13px' }}>
          FS-{r.id}
        </span>
      )
    },
    {
      header: 'Structure Name',
      key: 'structure_name',
      render: (r) => (
        <div>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13.5px' }}>
            {r.structure_name}
          </span>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Program #{r.program_id} · Term #{r.term_id}
          </div>
        </div>
      )
    },
    {
      header: 'Academic Program',
      key: 'program_name',
      render: (r) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          {r.program_name || `Program #${r.program_id}`}
        </span>
      )
    },
    {
      header: 'Components & Concessions',
      key: 'components_count',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '13px' }}>
            {r.components_count || (r.components ? r.components.length : 0)} items
          </span>
          <span style={{
            fontSize: '11px',
            padding: '1px 6px',
            borderRadius: '4px',
            background: 'var(--color-surface-subtle)',
            color: 'var(--color-primary)',
            border: '1px solid var(--color-border)',
            fontWeight: 600
          }}>
            Caste Rules Active
          </span>
        </div>
      )
    },
    {
      header: 'Base Total',
      key: 'total_amount',
      render: (r) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          ₹{(r.total_amount || 0).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Action',
      key: 'id',
      render: (r) => (
        <Button variant="subtle" size="sm" onClick={() => setSelectedStructure(r)}>
          View Breakdown
        </Button>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: '2px 8px', borderRadius: '4px' }}>
              M4 · Finance
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>
              Fee Structure Configurations & Caste Concessions
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Configure institutional fee structures with statutory caste concessions (General, OBC, SC, ST, EWS) and component rates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>
            Create Fee Structure
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Fee Structures"
          value={structures.length}
          icon={<CreditCard size={20} />}
          moduleColor="finance"
          supportText="Active curriculum fee schedules"
        />
        <StatCard
          label="Caste Concessions"
          value="Enabled"
          icon={<Percent size={20} />}
          moduleColor="people"
          supportText="SC/ST/OBC/EWS Concession Policy"
          supportColor="success"
        />
        <StatCard
          label="Eligible Categories"
          value="5 Categories"
          icon={<Award size={20} />}
          moduleColor="exams"
          supportText="GENERAL, OBC, SC, ST, EWS"
          supportColor="neutral"
        />
      </div>

      {/* Main Table */}
      <Card padding={0}>
        <Table columns={columns} data={structures} isLoading={loading} keyExtractor={(r) => String(r.id)} />
      </Card>

      {/* Create Structure Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Create Fee Structure with Caste Concessions"
        size="lg"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Input
            label="Structure Name"
            placeholder="e.g., B.Tech CSE Semester V Fee Structure (2026-27)"
            value={structureName}
            onChange={(e) => setStructureName(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              label="Academic Program"
              value={String(selectedProgramId)}
              options={programs.map(p => ({ label: p.name, value: String(p.id) }))}
              onChange={(e) => setSelectedProgramId(Number(e.target.value))}
            />
            <Select
              label="Academic Term"
              value={String(selectedTermId)}
              options={terms.map(t => ({ label: t.term_label, value: String(t.id) }))}
              onChange={(e) => setSelectedTermId(Number(e.target.value))}
            />
          </div>

          <div style={{
            padding: '12px 16px',
            background: 'var(--color-surface-subtle)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '13px'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Percent size={14} /> Caste Concession Guidelines:
            </div>
            <div style={{ marginTop: '4px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              Specify components by Category. If a student matches a category-specific component or concession percentage (e.g. 100% or 50% for SC/ST, 25% for OBC, 50% for EWS), that concession is automatically deducted during fee invoice generation.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Fee Components & Category Concessions ({componentsList.length})
            </span>
            <Button variant="secondary" size="sm" type="button" icon={<Plus size={14} />} onClick={handleAddComponent}>
              Add Component
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {componentsList.map((comp, idx) => (
              <div key={idx} style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    COMPONENT #{idx + 1}
                  </span>
                  {componentsList.length > 1 && (
                    <Button variant="subtle" size="sm" type="button" onClick={() => handleRemoveComponent(idx)}>
                      <Trash2 size={14} color="var(--color-error)" />
                    </Button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '10px' }}>
                  <Input
                    label="Component Name"
                    value={comp.component_name}
                    onChange={(e) => handleUpdateComponent(idx, 'component_name', e.target.value)}
                    required
                  />
                  <Input
                    label="Base Amount (₹)"
                    type="number"
                    value={comp.amount}
                    onChange={(e) => handleUpdateComponent(idx, 'amount', e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: '10px' }}>
                  <Select
                    label="Caste Category"
                    value={comp.caste_category}
                    options={[
                      { label: 'ALL (Universal)', value: 'ALL' },
                      { label: 'GENERAL (Unreserved)', value: 'GENERAL' },
                      { label: 'OBC (Other Backward Classes)', value: 'OBC' },
                      { label: 'SC (Scheduled Castes)', value: 'SC' },
                      { label: 'ST (Scheduled Tribes)', value: 'ST' },
                      { label: 'EWS (Economically Weaker)', value: 'EWS' }
                    ]}
                    onChange={(e) => handleUpdateComponent(idx, 'caste_category', e.target.value as any)}
                  />
                  <Input
                    label="Concession %"
                    type="number"
                    placeholder="e.g. 50 or 100"
                    value={comp.concession_percent}
                    onChange={(e) => handleUpdateComponent(idx, 'concession_percent', e.target.value)}
                  />
                  <Input
                    label="Due Date"
                    type="date"
                    value={comp.due_date}
                    onChange={(e) => handleUpdateComponent(idx, 'due_date', e.target.value)}
                    required
                  />
                </div>

                {parseFloat(comp.concession_percent) > 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 600 }}>
                    ✓ Effective Net Fee for {comp.caste_category}: ₹{(parseFloat(comp.amount || '0') * (1 - parseFloat(comp.concession_percent) / 100)).toLocaleString()} ({comp.concession_percent}% Concession Applied)
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="secondary" type="button" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Fee Structure
            </Button>
          </div>
        </form>
      </Drawer>

      {/* View Breakdown Drawer */}
      <Drawer
        isOpen={Boolean(selectedStructure)}
        onClose={() => setSelectedStructure(null)}
        title={selectedStructure ? `Fee Structure: ${selectedStructure.structure_name}` : ''}
        size="md"
        footer={<Button variant="secondary" onClick={() => setSelectedStructure(null)}>Close</Button>}
      >
        {selectedStructure && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>PROGRAM & TERM</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                {selectedStructure.program_name || `Program #${selectedStructure.program_id}`}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Term: {selectedStructure.term_label || `Term #${selectedStructure.term_id}`}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Configured Caste Concessions & Components
              </span>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
                When fees are assigned to students in this cohort, each student's caste category automatically triggers the appropriate concession rate.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
