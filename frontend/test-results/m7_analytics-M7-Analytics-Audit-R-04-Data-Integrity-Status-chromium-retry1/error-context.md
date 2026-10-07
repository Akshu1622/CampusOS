# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: m7_analytics.spec.ts >> M7 Analytics & Audit >> R-04 Data Integrity Status
- Location: tests\e2e\m7_analytics.spec.ts:159:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
  - navigating to "http://localhost:5173/login", waiting until "load"

```

# Test source

```ts
  63  |     
  64  |     await page.goto('/admin')
  65  |     await page.waitForURL('/student')
  66  |     await expect(page.getByText('My Dashboard')).toBeVisible()
  67  | 
  68  |     // Logout via routing back to login and changing mock
  69  |     await page.route('**/api/v1/me', async route => {
  70  |       await route.fulfill({ json: { id: 1, username: 'admin_core', roles: ['Admin'], email: 'a@x.com' } })
  71  |     })
  72  |     await page.goto('/login')
  73  |     await page.fill('input[name="username"]', 'admin_core')
  74  |     await page.fill('input[name="password"]', 'password123')
  75  |     await page.click('button[type="submit"]')
  76  |     
  77  |     await page.waitForURL('/admin')
  78  |     await expect(page.getByText('Admin Dashboard')).toBeVisible()
  79  |     await expect(page.getByText('Total Students')).toBeVisible()
  80  |   })
  81  | 
  82  |   test('R-01 Faculty Dashboard', async ({ page }) => {
  83  |     await page.route('**/api/v1/me', async route => {
  84  |       await route.fulfill({ json: { id: 2, username: 'faculty1', roles: ['Faculty'], email: 'f@x.com' } })
  85  |     })
  86  |     await page.goto('/login')
  87  |     await page.fill('input[name="username"]', 'faculty1')
  88  |     await page.fill('input[name="password"]', 'password123')
  89  |     await page.click('button[type="submit"]')
  90  |     
  91  |     await page.waitForURL('/faculty')
  92  |     await expect(page.getByText('My Dashboard')).toBeVisible()
  93  |     await expect(page.getByText('Assigned Offerings')).toBeVisible()
  94  |   })
  95  | 
  96  |   test('R-01 Student Dashboard', async ({ page }) => {
  97  |     await page.route('**/api/v1/me', async route => {
  98  |       await route.fulfill({ json: { id: 3, username: 'student1', roles: ['Student'], email: 's@x.com' } })
  99  |     })
  100 |     await page.goto('/login')
  101 |     await page.fill('input[name="username"]', 'student1')
  102 |     await page.fill('input[name="password"]', 'password123')
  103 |     await page.click('button[type="submit"]')
  104 |     
  105 |     await page.waitForURL('/student')
  106 |     await expect(page.getByText('My Dashboard')).toBeVisible()
  107 |     await expect(page.getByText('Current CGPA')).toBeVisible()
  108 |   })
  109 | 
  110 |   test('R-01 Reports Hub', async ({ page }) => {
  111 |     await page.route('**/api/v1/me', async route => {
  112 |       await route.fulfill({ json: { id: 1, username: 'admin_core', roles: ['Admin'], email: 'a@x.com' } })
  113 |     })
  114 |     await page.goto('/login')
  115 |     await page.fill('input[name="username"]', 'admin_core')
  116 |     await page.fill('input[name="password"]', 'password123')
  117 |     await page.click('button[type="submit"]')
  118 |     await page.waitForURL('/admin')
  119 |     
  120 |     await page.click('text=Reports Hub')
  121 |     await page.waitForURL('/admin/analytics/reports')
  122 |     
  123 |     await expect(page.getByText('Department-wise CGPA Ranking')).toBeVisible()
  124 |     await page.fill('input[placeholder="Search reports..."]', 'Payroll')
  125 |     await expect(page.getByRole('heading', { name: 'Payroll Summary' })).toBeVisible()
  126 |     await expect(page.getByText('Department-wise CGPA Ranking')).not.toBeVisible()
  127 |   })
  128 | 
  129 |   test('R-02 Report Page', async ({ page }) => {
  130 |     await page.route('**/api/v1/me', async route => {
  131 |       await route.fulfill({ json: { id: 1, username: 'admin_core', roles: ['Admin'], email: 'a@x.com' } })
  132 |     })
  133 |     await page.goto('/login')
  134 |     await page.fill('input[name="username"]', 'admin_core')
  135 |     await page.fill('input[name="password"]', 'password123')
  136 |     await page.click('button[type="submit"]')
  137 |     
  138 |     await page.goto('/admin/analytics/reports/RP-1')
  139 |     await expect(page.getByText('Department-wise CGPA Ranking')).toBeVisible()
  140 |     await expect(page.getByText('Total Students')).toBeVisible()
  141 |     await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible()
  142 |     await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible()
  143 |   })
  144 | 
  145 |   test('R-03 Audit Log Viewer', async ({ page }) => {
  146 |     await page.route('**/api/v1/me', async route => {
  147 |       await route.fulfill({ json: { id: 1, username: 'admin_core', roles: ['Admin'], email: 'a@x.com' } })
  148 |     })
  149 |     await page.goto('/login')
  150 |     await page.fill('input[name="username"]', 'admin_core')
  151 |     await page.fill('input[name="password"]', 'password123')
  152 |     await page.click('button[type="submit"]')
  153 |     
  154 |     await page.goto('/admin/analytics/audit-logs')
  155 |     await expect(page.getByText('System Audit Log')).toBeVisible()
  156 |     await expect(page.locator('table')).toBeVisible()
  157 |   })
  158 | 
  159 |   test('R-04 Data Integrity Status', async ({ page }) => {
  160 |     await page.route('**/api/v1/me', async route => {
  161 |       await route.fulfill({ json: { id: 1, username: 'admin_core', roles: ['Admin'], email: 'a@x.com' } })
  162 |     })
> 163 |     await page.goto('/login')
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
  164 |     await page.fill('input[name="username"]', 'admin_core')
  165 |     await page.fill('input[name="password"]', 'password123')
  166 |     await page.click('button[type="submit"]')
  167 |     
  168 |     await page.goto('/admin/analytics/integrity-checks')
  169 |     await expect(page.getByText('Data Integrity Status')).toBeVisible()
  170 |     await expect(page.getByRole('button', { name: 'Run Checks' })).toBeVisible()
  171 |   })
  172 | })
  173 | 
```