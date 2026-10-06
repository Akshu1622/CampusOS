# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: m1_core.spec.ts >> M1 Core Pages Smoke Tests >> Roles & Permissions Page loads correctly
- Location: tests\e2e\m1_core.spec.ts:55:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h3:has-text("Admin Permission Sets")').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('h3:has-text("Admin Permission Sets")').first() with timeout 5000ms
  - waiting for locator('h3:has-text("Admin Permission Sets")').first()

```

```yaml
- complementary:
  - text: CampusOS Term 2025-26 Sem 5
  - navigation:
    - text: MAIN MENU
    - link "Dashboard":
      - /url: /admin
    - text: USERS & ACCESS
    - link "Users":
      - /url: /admin/users
    - link "Roles & Permissions":
      - /url: /admin/roles
    - text: MASTER DATA
    - link "Departments":
      - /url: /admin/departments
    - link "Programs":
      - /url: /admin/programs
    - link "Terms":
      - /url: /admin/terms
    - link "Students":
      - /url: /admin/students
    - text: ACADEMICS
    - link "Courses":
      - /url: /admin/courses
    - text: ATTENDANCE & EXAMS
    - link "Attendance":
      - /url: /admin/attendance
    - link "Exams":
      - /url: /admin/exams
- main:
  - button
  - textbox "Search students, courses..."
  - text: ⌘K
  - button
  - text: A
  - heading "Roles & Permissions" [level=1]
  - text: Manage system roles and administrator permissions Admin Institution administrators with configurable scopes. Faculty System Standard faculty access. Student System Standard student access. Configure which admin users hold specific permission sets. Super Admin has all sets.
  - table:
    - rowgroup:
      - row "Permission Set Description Active Users":
        - columnheader "Permission Set"
        - columnheader "Description"
        - columnheader "Active Users"
    - rowgroup:
      - row "Super Admin Full system access including role management 2":
        - cell "Super Admin"
        - cell "Full system access including role management"
        - cell "2"
      - row "Academic Admin Courses, curriculum, and enrollment 5":
        - cell "Academic Admin"
        - cell "Courses, curriculum, and enrollment"
        - cell "5"
      - row "Exam Admin Exam schedules and results processing 3":
        - cell "Exam Admin"
        - cell "Exam schedules and results processing"
        - cell "3"
      - row "Finance Admin Fee structures and payments 4":
        - cell "Finance Admin"
        - cell "Fee structures and payments"
        - cell "4"
      - row "HR Admin Employee records and payroll 2":
        - cell "HR Admin"
        - cell "Employee records and payroll"
        - cell "2"
      - row "Hostel Admin Hostel and room allocation 3":
        - cell "Hostel Admin"
        - cell "Hostel and room allocation"
        - cell "3"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('M1 Core Pages Smoke Tests', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Mock API for login
  6  |     await page.route('**/api/v1/auth/login', async route => {
  7  |       await route.fulfill({ json: { access_token: 'mocked-token', token_type: 'bearer' } });
  8  |     });
  9  |     // Mock API for /me
  10 |     await page.route('**/api/v1/me', async route => {
  11 |       await route.fulfill({ json: { id: 1, username: 'admin_core', roles: ['Admin'], email: 'admin@example.com' } });
  12 |     });
  13 |     // Mock other endpoints that pages might hit on mount
  14 |     await page.route('**/api/v1/users**', async route => {
  15 |       await route.fulfill({ json: { items: [], total: 0 } });
  16 |     });
  17 |     await page.route('**/api/v1/roles**', async route => {
  18 |       await route.fulfill({ json: [] });
  19 |     });
  20 |     await page.route('**/api/v1/departments**', async route => {
  21 |       await route.fulfill({ json: [] });
  22 |     });
  23 |     await page.route('**/api/v1/programs**', async route => {
  24 |       await route.fulfill({ json: [] });
  25 |     });
  26 |     await page.route('**/api/v1/terms**', async route => {
  27 |       await route.fulfill({ json: [] });
  28 |     });
  29 |     await page.route('**/api/v1/students**', async route => {
  30 |       await route.fulfill({ json: { items: [], total: 0 } });
  31 |     });
  32 | 
  33 |     // Login as admin
  34 |     await page.goto('/login');
  35 |     await page.fill('input[name="username"]', 'admin_core');
  36 |     await page.fill('input[name="password"]', 'password123');
  37 |     await page.click('button:has-text("Sign in")');
  38 |     await page.waitForURL('/admin');
  39 |   });
  40 | 
  41 |   test('Profile Page loads correctly', async ({ page }) => {
  42 |     await page.goto('/admin/profile');
  43 |     await expect(page.locator('h1:has-text("Profile")')).toBeVisible();
  44 |     await expect(page.locator('h2:has-text("admin_core")')).toBeVisible();
  45 |     await expect(page.locator('text=Overview').first()).toBeVisible();
  46 |     await expect(page.locator('text=Security').first()).toBeVisible();
  47 |   });
  48 | 
  49 |   test('User Management Page loads correctly', async ({ page }) => {
  50 |     await page.goto('/admin/users');
  51 |     await expect(page.locator('h1:has-text("Users")')).toBeVisible();
  52 |     await expect(page.locator('button:has-text("Add User")').first()).toBeVisible();
  53 |   });
  54 | 
  55 |   test('Roles & Permissions Page loads correctly', async ({ page }) => {
  56 |     await page.goto('/admin/roles');
  57 |     await expect(page.locator('h1:has-text("Roles & Permissions")')).toBeVisible();
> 58 |     await expect(page.locator('h3:has-text("Admin Permission Sets")').first()).toBeVisible();
     |                                                                                ^ Error: expect(locator).toBeVisible() failed
  59 |   });
  60 | 
  61 |   test('Department Management Page loads correctly', async ({ page }) => {
  62 |     await page.goto('/admin/departments');
  63 |     await expect(page.locator('h1:has-text("Departments")')).toBeVisible();
  64 |     await expect(page.locator('button:has-text("Add Department")').first()).toBeVisible();
  65 |   });
  66 | 
  67 |   test('Program Management Page loads correctly', async ({ page }) => {
  68 |     await page.goto('/admin/programs');
  69 |     await expect(page.locator('h1:has-text("Programs")')).toBeVisible();
  70 |     await expect(page.locator('button:has-text("Add Program")').first()).toBeVisible();
  71 |   });
  72 | 
  73 |   test('Academic Terms Page loads correctly', async ({ page }) => {
  74 |     await page.goto('/admin/terms');
  75 |     await expect(page.locator('h1:has-text("Academic Terms")')).toBeVisible();
  76 |     await expect(page.locator('button:has-text("Add Term")').first()).toBeVisible();
  77 |   });
  78 | 
  79 |   test('Student Master Page loads correctly', async ({ page }) => {
  80 |     await page.goto('/admin/students');
  81 |     await expect(page.locator('h1:has-text("Students")')).toBeVisible();
  82 |     await expect(page.locator('button:has-text("Add Student")').first()).toBeVisible();
  83 |   });
  84 | });
  85 | 
```