import React, { useState } from 'react'
import {
  Button, IconButton, Input, Select, MultiSelect, SearchField, DatePicker, DateRangePicker,
  Dropdown, Tabs, Card, StatCard, Table, Pagination, Filters, StatusPill, Badge,
  Tooltip, Alert, Modal, Drawer, ConfirmationDialog, Avatar, Breadcrumbs,
  LinearProgress, CircularProgress, Spinner, Stepper, EmptyState, ErrorState, LoadingSkeleton,
  CalendarWidget, TrendChart, GroupedBarChart, DonutChart
} from '@/components/ui'
import { Users, FileText, Settings, Trash2, Calendar, Mail, Bell } from 'lucide-react'

export function StyleguidePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [date, setDate] = useState<Date | null>(new Date())
  const [multiSelect, setMultiSelect] = useState<string[]>(['1'])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  return (
    <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>CampusOS Styleguide</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>A comprehensive catalog of all 30 shared UI components.</p>
      </div>

      <section>
        <h2>1 & 2. Buttons & Icon Buttons</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary">Tertiary →</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="subtle">Subtle</Button>
          <Button isLoading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <IconButton icon={<Settings size={20} />} label="Settings" />
          <IconButton icon={<Trash2 size={20} />} label="Delete" variant="borderless" />
        </div>
      </section>

      <section>
        <h2>3, 4, 5 & 6. Inputs & Selects</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <Input label="Standard Input" placeholder="Placeholder" />
          <Input label="With Icon" leftIcon={<Mail size={16} />} placeholder="Email address" />
          <Input label="With Error" error="This field is required" />
          <Select label="Select" options={[{ label: 'Option 1', value: '1' }, { label: 'Option 2', value: '2' }]} />
          <MultiSelect 
            label="Multi-select" 
            options={[{ label: 'Option 1', value: '1' }, { label: 'Option 2', value: '2' }]} 
            value={multiSelect}
            onChange={setMultiSelect}
          />
          <SearchField value={search} onChange={e => setSearch(e.target.value)} onClear={() => setSearch('')} showHint />
        </div>
      </section>

      <section>
        <h2>7, 8 & 27. Dates & Calendar</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <DatePicker label="Date Picker" value={date} onChange={setDate} />
          <DateRangePicker label="Date Range Picker" onChange={() => {}} />
          <div style={{ maxWidth: '300px' }}>
            <CalendarWidget />
          </div>
        </div>
      </section>

      <section>
        <h2>9. Dropdown & Action Menu</h2>
        <Dropdown
          trigger={<Button variant="secondary">Open Menu</Button>}
          items={[
            { id: '1', label: 'Edit profile', icon: <Users size={16} />, onClick: () => {} },
            { id: '2', label: 'Billing', icon: <FileText size={16} />, onClick: () => {} },
            { id: '3', label: 'Delete account', icon: <Trash2 size={16} />, danger: true, dividerBefore: true, onClick: () => {} }
          ]}
        />
      </section>

      <section>
        <h2>10. Tabs</h2>
        <Tabs
          tabs={[
            { id: '1', label: 'General', content: <div style={{ padding: '16px' }}>General settings</div> },
            { id: '2', label: 'Security', count: 2, content: <div style={{ padding: '16px' }}>Security settings</div> }
          ]}
        />
      </section>

      <section>
        <h2>11 & 12. Cards & Stat Cards</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          <StatCard label="Total Students" value="2,400" icon={<Users size={20} />} trend="up" trendValue="12%" />
          <StatCard label="Attendance" value="84%" icon={<Calendar size={20} />} moduleColor="exams" supportText="This semester" supportColor="success" />
          <Card variant="banner">
            <h3>Banner Card</h3>
            <p>Used for dashboard greetings.</p>
          </Card>
        </div>
      </section>

      <section>
        <h2>16 & 17. Badges, Pills & Tooltips</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <StatusPill label="Active" status="success" />
          <StatusPill label="Pending" status="warning" />
          <StatusPill label="Failed" status="error" />
          <Badge count={5} />
          <Badge count={12} variant="primary" />
          <Tooltip content="This is a tooltip">
            <span style={{ textDecoration: 'underline', cursor: 'help' }}>Hover me</span>
          </Tooltip>
        </div>
      </section>

      <section>
        <h2>18 & 19. Alerts & Toasts</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Alert variant="info" title="Information" message="This is an informational alert." />
          <Alert variant="warning" title="Warning" message="Please check your attendance shortage." />
          <Alert variant="error" title="Error" message="Action could not be completed." />
          <Alert variant="success" title="Success" message="Record saved successfully." />
        </div>
      </section>

      <section>
        <h2>20, 21 & 22. Overlays (Modal, Drawer, Dialog)</h2>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
          <Button onClick={() => setConfirmOpen(true)}>Open Dialog</Button>
        </div>
        
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Sample Modal" footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={() => setModalOpen(false)}>Save</Button></>}>
          <p>Modal content goes here.</p>
        </Modal>
        
        <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Sample Drawer" footer={<Button onClick={() => setDrawerOpen(false)}>Close</Button>}>
          <p>Drawer content goes here.</p>
        </Drawer>

        <ConfirmationDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => setConfirmOpen(false)}
          title="Delete record?"
          message="This action cannot be undone."
          isDestructive
          confirmText="Delete"
        />
      </section>

      <section>
        <h2>23 & 24. Avatars & Breadcrumbs</h2>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '16px' }}>
          <Avatar name="Aarav Mehta" size="sm" />
          <Avatar name="Sneha Patel" size="md" showStatus status="online" />
          <Avatar name="Rahul Kumar" size="lg" showStatus status="busy" />
        </div>
        <Breadcrumbs items={[{ label: 'Academics' }, { label: 'Students', href: '#' }, { label: 'Aarav Mehta' }]} />
      </section>

      <section>
        <h2>25. Progress Indicators</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
          <LinearProgress value={75} />
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <CircularProgress value={68} color="var(--color-warning)" />
            <Spinner />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Stepper steps={['Details', 'Review', 'Complete']} currentStep={1} />
          </div>
        </div>
      </section>

      <section>
        <h2>28, 29 & 30. States (Empty, Error, Skeleton)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <Card style={{ height: '300px' }}><EmptyState icon={<Users size={24} />} title="No students found" description="Try adjusting your filters or search query." /></Card>
          <Card style={{ height: '300px' }}><ErrorState title="Connection failed" message="We couldn't load this data." onRetry={() => {}} /></Card>
          <Card style={{ height: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <LoadingSkeleton type="circular" />
            <LoadingSkeleton type="text" width="60%" height="24px" />
            <LoadingSkeleton type="text" />
            <LoadingSkeleton type="text" width="80%" />
            <LoadingSkeleton type="rectangular" height="120px" />
          </Card>
        </div>
      </section>

      <section>
        <h2>13, 14 & 15. Table, Pagination & Filters</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Filters 
            filters={[{ id: 'status', label: 'Status', type: 'select', options: [{ label: 'Active', value: 'active' }] }]}
            values={{ status: 'active' }}
            onChange={() => {}}
          />
          <Table 
            data={[{ id: '1', name: 'Aarav', role: 'Student' }]}
            keyExtractor={d => d.id}
            columns={[
              { key: 'name', header: 'Name', cell: d => d.name },
              { key: 'role', header: 'Role', cell: d => d.role }
            ]}
            selectedIds={[]}
            onSelect={() => {}}
            pagination={{ currentPage: page, totalItems: 42, pageSize: 10, onPageChange: setPage, onPageSizeChange: () => {} }}
          />
        </div>
      </section>
      
      <section>
        <h2>26. Charts</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <Card>
            <h3 style={{ marginBottom: '16px' }}>Trend</h3>
            <TrendChart 
              data={[{ name: 'Jan', val: 400 }, { name: 'Feb', val: 300 }, { name: 'Mar', val: 500 }]}
              xAxisKey="name"
              lines={[{ key: 'val', name: 'Value' }]}
              height={200}
            />
          </Card>
          <Card>
            <h3 style={{ marginBottom: '16px' }}>Distribution</h3>
            <GroupedBarChart 
              data={[{ name: 'A', v1: 40, v2: 24 }, { name: 'B', v1: 30, v2: 13 }]}
              xAxisKey="name"
              bars={[{ key: 'v1', name: 'Group 1' }, { key: 'v2', name: 'Group 2' }]}
              height={200}
            />
          </Card>
          <Card>
            <h3 style={{ marginBottom: '16px' }}>Proportion</h3>
            <DonutChart 
              data={[{ name: 'Paid', val: 400 }, { name: 'Due', val: 300 }]}
              dataKey="val"
              nameKey="name"
              height={200}
            />
          </Card>
        </div>
      </section>
    </div>
  )
}
