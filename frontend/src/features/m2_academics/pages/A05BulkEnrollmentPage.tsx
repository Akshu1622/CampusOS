import React, { useState } from 'react'
import {
  Card, Button, Select, StatusPill, Table, Alert
} from '@/components/ui'
import {
  useBulkEnrollmentValidate, useBulkEnrollmentRun,
  usePrograms, useTerms, useCurriculum, useOfferings, useStudents
} from '../hooks'
import type { BulkEnrollmentItem, BulkEnrollmentResponse, BulkEnrollmentRowResult } from '../api'
import {
  Upload, FileText, CheckCircle2, Download, ArrowRight, ArrowLeft, Check
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function A05BulkEnrollmentPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1 State: Input method
  const [sourceMode, setSourceMode] = useState<'upload' | 'cohort'>('upload')
  const [rawText, setRawText] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsedItems, setParsedItems] = useState<BulkEnrollmentItem[]>([])

  // Cohort Mode State
  const [cohortProgramId, setCohortProgramId] = useState<string>('')
  const [cohortSemester, setCohortSemester] = useState<string>('1')
  const [cohortTermId, setCohortTermId] = useState<string>('')

  // Step 2 State: Validation
  const [validationResult, setValidationResult] = useState<BulkEnrollmentResponse | null>(null)
  const [showOnlyRejected, setShowOnlyRejected] = useState(false)

  // Step 3 State: Policy & Confirm
  const [policy, setPolicy] = useState<'ALL_OR_NOTHING' | 'SKIP_INVALID'>('SKIP_INVALID')
  const [isConfirmed, setIsConfirmed] = useState(false)

  // Step 4 State: Final result
  const [finalResult, setFinalResult] = useState<BulkEnrollmentResponse | null>(null)

  // Lookups
  const { data: programsData } = usePrograms()
  const programs = programsData || []

  const { data: termsData } = useTerms()
  const terms = termsData || []

  const { data: studentsData } = useStudents({ page_size: 200 })
  const students = studentsData?.items || []

  const { data: offeringsData } = useOfferings({ page_size: 200 })
  const offerings = offeringsData?.items || []

  const { data: curriculumData } = useCurriculum({
    program_id: cohortProgramId ? Number(cohortProgramId) : undefined,
    semester: cohortSemester ? Number(cohortSemester) : undefined,
    page_size: 100,
  })

  // Mutations
  const validateMutation = useBulkEnrollmentValidate()
  const runMutation = useBulkEnrollmentRun()

  // Sample CSV generator
  const handleDownloadSampleCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,student_id,offering_id\n1,1\n2,1\n3,2\n'
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'bulk_enrollment_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Parse Raw Input (CSV / JSON / XML)
  const parseRawInput = (text: string): BulkEnrollmentItem[] => {
    const trimmed = text.trim()
    if (!trimmed) throw new Error('Input data is empty.')

    // Try JSON
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed)
      const list = Array.isArray(parsed) ? parsed : (parsed.items || parsed.students || [])
      return list.map((item: any) => ({
        student_id: Number(item.student_id || item.studentId || item.id),
        offering_id: Number(item.offering_id || item.offeringId)
      })).filter((x: any) => x.student_id && x.offering_id)
    }

    // Try XML
    if (trimmed.startsWith('<')) {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(trimmed, 'text/xml')
      const rows = xmlDoc.getElementsByTagName('row')
      const items: BulkEnrollmentItem[] = []
      for (let i = 0; i < rows.length; i++) {
        const sid = rows[i].getElementsByTagName('student_id')[0]?.textContent
        const oid = rows[i].getElementsByTagName('offering_id')[0]?.textContent
        if (sid && oid) {
          items.push({ student_id: Number(sid), offering_id: Number(oid) })
        }
      }
      if (items.length > 0) return items
    }

    // CSV fallback
    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean)
    const items: BulkEnrollmentItem[] = []
    let startIndex = 0
    if (lines[0].toLowerCase().includes('student_id') || lines[0].toLowerCase().includes('student')) {
      startIndex = 1
    }
    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim())
      if (parts.length >= 2) {
        const s = Number(parts[0])
        const o = Number(parts[1])
        if (!isNaN(s) && !isNaN(o)) {
          items.push({ student_id: s, offering_id: o })
        }
      }
    }
    if (items.length === 0) throw new Error('No valid rows found. Please check format.')
    return items
  }

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError(null)
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setRawText(content)
      try {
        const items = parseRawInput(content)
        setParsedItems(items)
      } catch (err: any) {
        setParseError(err.message || 'Failed to parse file.')
      }
    }
    reader.readAsText(file)
  }

  // Generate Items from Cohort
  const handleGenerateCohort = () => {
    setParseError(null)
    if (!cohortProgramId || !cohortTermId) {
      setParseError('Please select both program and term for cohort enrollment.')
      return
    }

    // Students in this program
    const cohortStudents = students.filter(s => s.program_id === Number(cohortProgramId))
    if (cohortStudents.length === 0) {
      setParseError('No students found in this program.')
      return
    }

    // Course IDs in this curriculum
    const currCourseIds = (curriculumData?.items || []).map(c => c.course_id)
    // Offerings in this term matching those courses
    const matchedOfferings = offerings.filter(o =>
      o.term_id === Number(cohortTermId) && currCourseIds.includes(o.course_id)
    )

    if (matchedOfferings.length === 0) {
      setParseError('No course offerings found for this cohort in the selected term.')
      return
    }

    const items: BulkEnrollmentItem[] = []
    cohortStudents.forEach(stu => {
      matchedOfferings.forEach(off => {
        items.push({ student_id: stu.id, offering_id: off.id })
      })
    })

    setParsedItems(items)
    setRawText(`// Generated ${items.length} pairs for cohort`)
  }

  // Step 1 -> Step 2: Validate
  const handleGoToValidation = async () => {
    setParseError(null)
    let itemsToValidate = parsedItems
    if (itemsToValidate.length === 0 && rawText.trim()) {
      try {
        itemsToValidate = parseRawInput(rawText)
        setParsedItems(itemsToValidate)
      } catch (err: any) {
        setParseError(err.message)
        return
      }
    }

    if (itemsToValidate.length === 0) {
      setParseError('Please provide enrollment data before continuing.')
      return
    }

    try {
      const res = await validateMutation.mutateAsync({
        policy: 'SKIP_INVALID',
        dry_run: true,
        payload: itemsToValidate,
      })
      setValidationResult(res)
      setCurrentStep(2)
    } catch (err: any) {
      setParseError(err.message || 'Validation request failed.')
    }
  }

  // Step 3 -> Step 4: Run Bulk Enrollment
  const handleExecuteBulkRun = async () => {
    if (!isConfirmed) return
    try {
      const res = await runMutation.mutateAsync({
        policy,
        dry_run: false,
        payload: parsedItems,
      })
      setFinalResult(res)
      setCurrentStep(4)
    } catch (err: any) {
      setParseError(err.message || 'Bulk execution failed.')
    }
  }

  // Row results for Step 2
  const validationRows = validationResult?.row_results || []
  const displayedValidationRows = showOnlyRejected
    ? validationRows.filter(r => r.status.toUpperCase() !== 'VALID' && r.status.toUpperCase() !== 'SUCCESS')
    : validationRows

  const validationColumns = [
    {
      key: 'student_id',
      header: 'Student ID',
      render: (row: BulkEnrollmentRowResult) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>#{row.student_id}</span>
      )
    },
    {
      key: 'offering_id',
      header: 'Offering ID',
      render: (row: BulkEnrollmentRowResult) => (
        <span style={{ fontWeight: 600 }}>Offering #{row.offering_id}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: BulkEnrollmentRowResult) => {
        const isSuccess = row.status.toUpperCase() === 'VALID' || row.status.toUpperCase() === 'SUCCESS'
        return (
          <StatusPill
            label={row.status}
            status={isSuccess ? 'success' : 'error'}
          />
        )
      }
    },
    {
      key: 'message',
      header: 'Details / Reason',
      render: (row: BulkEnrollmentRowResult) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {row.message || (row.status.toUpperCase() === 'VALID' ? 'Ready to enroll' : 'Rejection')}
        </span>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            A-05
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Bulk Enrollment Wizard
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Enroll entire student cohorts or upload batches with validation, dry-run previews, and execution policies.
        </p>
      </div>

      {/* Wizard Step Indicator */}
      <Card padding={16}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {[
            { step: 1, label: '1. Source & Data' },
            { step: 2, label: '2. Validate & Preview' },
            { step: 3, label: '3. Options & Policy' },
            { step: 4, label: '4. Execution Result' },
          ].map(s => {
            const isActive = currentStep === s.step
            const isDone = currentStep > s.step
            return (
              <div
                key={s.step}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isActive || isDone ? 1 : 0.5,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isDone ? 'var(--color-success)' : isActive ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
                  color: isDone || isActive ? '#fff' : 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {isDone ? <Check size={14} /> : s.step}
                </div>
                <span style={{ fontSize: '14px' }}>{s.label}</span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Step 1: Source */}
      {currentStep === 1 && (
        <Card padding={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant={sourceMode === 'upload' ? 'primary' : 'secondary'}
                onClick={() => setSourceMode('upload')}
                size="sm"
                icon={<Upload size={14} />}
              >
                File Upload / Raw Data
              </Button>
              <Button
                variant={sourceMode === 'cohort' ? 'primary' : 'secondary'}
                onClick={() => setSourceMode('cohort')}
                size="sm"
                icon={<FileText size={14} />}
              >
                Program Cohort Select
              </Button>
            </div>
            {sourceMode === 'upload' && (
              <Button
                variant="subtle"
                size="sm"
                icon={<Download size={14} />}
                onClick={handleDownloadSampleCSV}
              >
                Download CSV Template
              </Button>
            )}
          </div>

          {parseError && (
            <div style={{ marginBottom: '16px' }}>
              <Alert variant="error" title="Input Error" message={parseError} />
            </div>
          )}

          {sourceMode === 'upload' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                border: '2px dashed var(--color-border)',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                background: 'var(--color-surface-subtle)'
              }}>
                <Upload size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Upload CSV, JSON, or XML file</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Format: student_id, offering_id per row
                </div>
                <input
                  type="file"
                  accept=".csv,.json,.xml,.txt"
                  onChange={handleFileUpload}
                  style={{ marginTop: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Or Paste Raw Content:
                </label>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value)
                    setParseError(null)
                  }}
                  placeholder="student_id,offering_id&#10;1,1&#10;2,1&#10;3,2"
                  style={{
                    width: '100%',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {parsedItems.length > 0 && (
                <div style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: 600 }}>
                  ✓ {parsedItems.length} student-offering records identified.
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Program *
                  </label>
                  <Select
                    value={cohortProgramId}
                    onChange={(e) => setCohortProgramId(e.target.value)}
                    options={[
                      { value: '', label: '-- Select Program --' },
                      ...programs.map(p => ({ value: String(p.id), label: `${p.code} - ${p.name}` }))
                    ]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Semester *
                  </label>
                  <Select
                    value={cohortSemester}
                    onChange={(e) => setCohortSemester(e.target.value)}
                    options={Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Term *
                  </label>
                  <Select
                    value={cohortTermId}
                    onChange={(e) => setCohortTermId(e.target.value)}
                    options={[
                      { value: '', label: '-- Select Term --' },
                      ...terms.map(t => ({ value: String(t.id), label: t.term_label || t.term_identifier }))
                    ]}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Button variant="secondary" onClick={handleGenerateCohort}>
                  Generate Cohort Pairs
                </Button>
              </div>

              {parsedItems.length > 0 && (
                <div style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: 600 }}>
                  ✓ {parsedItems.length} enrollment pairs generated for selected cohort.
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button
              variant="primary"
              onClick={handleGoToValidation}
              disabled={validateMutation.isPending}
              icon={<ArrowRight size={16} />}
            >
              {validateMutation.isPending ? 'Validating Batch...' : 'Proceed to Validation'}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Validate & Preview */}
      {currentStep === 2 && (
        <Card padding={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
              Batch Validation Preview
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button
                variant={showOnlyRejected ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setShowOnlyRejected(!showOnlyRejected)}
              >
                {showOnlyRejected ? 'Show All Records' : 'Show Only Rejections'}
              </Button>
            </div>
          </div>

          {/* KPI Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Total Records</div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{validationResult?.total_processed || 0}</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-success)' }}>Valid Rows</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-success)' }}>
                {validationResult?.total_success || 0}
              </div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-error)' }}>Rejected / Skipped</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-error)' }}>
                {validationResult?.total_failed || 0}
              </div>
            </div>
          </div>

          {/* Validation Table */}
          <Table
            columns={validationColumns}
            data={displayedValidationRows}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <Button variant="secondary" onClick={() => setCurrentStep(1)} icon={<ArrowLeft size={16} />}>
              Back to Source
            </Button>
            <Button variant="primary" onClick={() => setCurrentStep(3)} icon={<ArrowRight size={16} />}>
              Configure Policy
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Options & Confirmation */}
      {currentStep === 3 && (
        <Card padding={24}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginTop: 0, marginBottom: '16px' }}>
            Execution Policy & Final Confirmation
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>
                Select Transaction Execution Policy:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div
                  onClick={() => setPolicy('SKIP_INVALID')}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: policy === 'SKIP_INVALID' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: policy === 'SKIP_INVALID' ? 'rgba(59, 130, 246, 0.05)' : 'var(--color-surface)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-text-primary)' }}>
                    SKIP_INVALID (Best-effort enrollment)
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Successfully enrolls all valid student records. Any invalid, duplicate, or capacity-exceeded rows are recorded as failed and skipped without blocking the batch.
                  </p>
                </div>

                <div
                  onClick={() => setPolicy('ALL_OR_NOTHING')}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: policy === 'ALL_OR_NOTHING' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: policy === 'ALL_OR_NOTHING' ? 'rgba(59, 130, 246, 0.05)' : 'var(--color-surface)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-text-primary)' }}>
                    ALL_OR_NOTHING (Strict ACID transaction)
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    All rows must pass validation. If even one student enrollment fails or hits capacity limits, the entire batch transaction is completely rolled back.
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <input
                type="checkbox"
                id="bulk-confirm"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="bulk-confirm" style={{ fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                I confirm that I have reviewed the validation preview and wish to execute this bulk enrollment batch under the selected <strong>{policy}</strong> policy.
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setCurrentStep(2)} icon={<ArrowLeft size={16} />}>
                Back to Preview
              </Button>
              <Button
                variant="primary"
                onClick={handleExecuteBulkRun}
                disabled={!isConfirmed || runMutation.isPending}
              >
                {runMutation.isPending ? 'Executing Batch...' : 'Run Bulk Enrollment'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Execution Result */}
      {currentStep === 4 && (
        <Card padding={24}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--color-success)', margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
              Bulk Enrollment Execution Finished
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
              Batch ID: <code>{finalResult?.batch_id || 'N/A'}</code>
            </p>
          </div>

          {/* Results Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Total Processed</div>
              <div style={{ fontSize: '26px', fontWeight: 700 }}>{finalResult?.total_processed || 0}</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-success)' }}>Successfully Enrolled</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-success)' }}>{finalResult?.total_success || 0}</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-error)' }}>Failed / Skipped</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-error)' }}>{finalResult?.total_failed || 0}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Button
              variant="secondary"
              onClick={() => {
                setCurrentStep(1)
                setParsedItems([])
                setRawText('')
                setValidationResult(null)
                setFinalResult(null)
                setIsConfirmed(false)
              }}
            >
              Start New Batch
            </Button>
            <Button
              variant="primary"
              icon={<ArrowRight size={16} />}
              onClick={() => navigate('/admin/enrollments/records')}
            >
              View Enrollment Records
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
