import { test, expect } from '@playwright/test'

test.describe('M7 Analytics & Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Basic auth mocks
    await page.route('**/api/v1/auth/login', async route => {
      await route.fulfill({ json: { access_token: 'mocked-token', token_type: 'bearer' } })
    })
    
    // M7 endpoints
    await page.route('**/api/v1/analytics/dashboard/admin', async route => {
      await route.fulfill({ json: { 
        total_students: 100, 
        total_faculty: 20, 
        active_enrollments: 100,
        fees_collected_current: 100000,
        fees_due_current: 5000, 
        beds_available: 50,
        pending_leaves: 2,
        pending_hostel_requests: 3,
        students_low_attendance: 5 
      } })
    })
    await page.route('**/api/v1/analytics/dashboard/faculty', async route => {
      await route.fulfill({ json: { 
        assigned_offerings: 3, 
        pending_marks_entry: 1,
        total_leave_balance: 12,
        latest_payslip_net: 50000
      } })
    })
    await page.route('**/api/v1/analytics/dashboard/student', async route => {
      await route.fulfill({ json: { 
        total_enrolled_courses: 5, 
        low_attendance_courses: 0,
        current_cgpa: 8.5,
        total_outstanding_dues: 0,
        hostel_status: 'Allocated',
        pending_exams: 3
      } })
    })
    await page.route('**/api/v1/analytics/reports**', async route => {
      await route.fulfill({ json: { data: [{ id: 1 }], total: 1, page: 1, size: 10 } })
    })
    await page.route('**/api/v1/analytics/audit-logs**', async route => {
      await route.fulfill({ json: { data: [{ log_id: 1, source: 'FINANCE', entity_name: 'Invoice', entity_id: 'INV-1', action: 'CREATE', timestamp: new Date().toISOString() }], total: 1, page: 1, size: 10 } })
    })
    await page.route('**/api/v1/analytics/integrity/checks', async route => {
      await route.fulfill({ json: [{ module: 'finance', check_name: 'Orphan Invoices', status: 'PASS', affected_count: 0 }] })
    })
  })

  test('R-01 Admin Dashboard - load data and check role access', async ({ page }) => {
    await page.route('**/api/v1/me', async route => {
      await route.fulfill({ json: { id: 3, username: 'student1', roles: ['Student'], email: 's@x.com' } })
    })

    await page.goto('/login')
    await page.fill('input[name="username"]', 'student1')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/student')
    
    await page.goto('/admin')
    await page.waitForURL('/student')
    await expect(page.getByText('My Dashboard')).toBeVisible()

    // Logout via routing back to login and changing mock
    await page.route('**/api/v1/me', async route => {
      await route.fulfill({ json: { id: 1, username: 'admin_core', roles: ['Admin'], email: 'a@x.com' } })
    })
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin_core')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/admin')
    await expect(page.getByText('Admin Dashboard')).toBeVisible()
    await expect(page.getByText('Total Students')).toBeVisible()
  })

  test('R-01 Faculty Dashboard', async ({ page }) => {
    await page.route('**/api/v1/me', async route => {
      await route.fulfill({ json: { id: 2, username: 'faculty1', roles: ['Faculty'], email: 'f@x.com' } })
    })
    await page.goto('/login')
    await page.fill('input[name="username"]', 'faculty1')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/faculty')
    await expect(page.getByText('My Dashboard')).toBeVisible()
    await expect(page.getByText('Assigned Offerings')).toBeVisible()
  })

  test('R-01 Student Dashboard', async ({ page }) => {
    await page.route('**/api/v1/me', async route => {
      await route.fulfill({ json: { id: 3, username: 'student1', roles: ['Student'], email: 's@x.com' } })
    })
    await page.goto('/login')
    await page.fill('input[name="username"]', 'student1')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/student')
    await expect(page.getByText('My Dashboard')).toBeVisible()
    await expect(page.getByText('Current CGPA')).toBeVisible()
  })

  test('R-01 Reports Hub', async ({ page }) => {
    await page.route('**/api/v1/me', async route => {
      await route.fulfill({ json: { id: 1, username: 'admin_core', roles: ['Admin'], email: 'a@x.com' } })
    })
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin_core')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
    
    await page.click('text=Reports Hub')
    await page.waitForURL('/admin/analytics/reports')
    
    await expect(page.getByText('Department-wise CGPA Ranking')).toBeVisible()
    await page.fill('input[placeholder="Search reports..."]', 'Payroll')
    await expect(page.getByRole('heading', { name: 'Payroll Summary' })).toBeVisible()
    await expect(page.getByText('Department-wise CGPA Ranking')).not.toBeVisible()
  })

  test('R-02 Report Page', async ({ page }) => {
    await page.route('**/api/v1/me', async route => {
      await route.fulfill({ json: { id: 1, username: 'admin_core', roles: ['Admin'], email: 'a@x.com' } })
    })
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin_core')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.goto('/admin/analytics/reports/RP-1')
    await expect(page.getByText('Department-wise CGPA Ranking')).toBeVisible()
    await expect(page.getByText('Total Students')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible()
  })

  test('R-03 Audit Log Viewer', async ({ page }) => {
    await page.route('**/api/v1/me', async route => {
      await route.fulfill({ json: { id: 1, username: 'admin_core', roles: ['Admin'], email: 'a@x.com' } })
    })
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin_core')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.goto('/admin/analytics/audit-logs')
    await expect(page.getByText('System Audit Log')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })

  test('R-04 Data Integrity Status', async ({ page }) => {
    await page.route('**/api/v1/me', async route => {
      await route.fulfill({ json: { id: 1, username: 'admin_core', roles: ['Admin'], email: 'a@x.com' } })
    })
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin_core')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.goto('/admin/analytics/integrity-checks')
    await expect(page.getByText('Data Integrity Status')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Run Checks' })).toBeVisible()
  })
})
