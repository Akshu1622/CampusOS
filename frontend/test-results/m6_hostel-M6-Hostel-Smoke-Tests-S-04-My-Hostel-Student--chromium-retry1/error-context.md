# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: m6_hostel.spec.ts >> M6 Hostel Smoke Tests >> S-04 My Hostel (Student)
- Location: tests\e2e\m6_hostel.spec.ts:55:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "My Hostel"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" locator('h1') with timeout 5000ms
  - waiting for locator('h1')
    - waiting for "http://localhost:5173/session-expired" navigation to finish...
    - navigated to "http://localhost:5173/session-expired"

```

```yaml
- heading "Session Expired" [level=2]
- paragraph: For your security, your session has timed out due to inactivity. Please sign in again to continue.
- button "Sign in"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('M6 Hostel Smoke Tests', () => {
  4  |   // Use admin_core for Admin, student1 for Student
  5  |   // Wait for login redirect
  6  |   const login = async (page: any, role: 'Admin' | 'Student') => {
  7  |     const mockUser = role === 'Admin'
  8  |       ? { id: 1, username: 'admin_core', roles: ['Admin'], email: 'admin@example.com' }
  9  |       : { id: 3, username: 'student1', roles: ['Student'], email: 'student@example.com' };
  10 | 
  11 |     await page.route('**/api/v1/auth/login', async (route: any) => {
  12 |       await route.fulfill({ json: { access_token: 'mocked-token', token_type: 'bearer' } });
  13 |     });
  14 |     await page.route('**/api/v1/me', async (route: any) => {
  15 |       await route.fulfill({ json: mockUser });
  16 |     });
  17 |     await page.route('**/api/v1/hostels**', async (route: any) => {
  18 |       await route.fulfill({ json: [] });
  19 |     });
  20 |     await page.route('**/api/v1/rooms**', async (route: any) => {
  21 |       await route.fulfill({ json: [] });
  22 |     });
  23 |     await page.route('**/api/v1/hostel-requests**', async (route: any) => {
  24 |       await route.fulfill({ json: [] });
  25 |     });
  26 |     await page.goto('/login');
  27 |     await page.fill('input[name="username"]', role === 'Admin' ? 'admin_core' : 'student1');
  28 |     await page.fill('input[name="password"]', 'password123');
  29 |     await page.click('button:has-text("Sign in")');
  30 |     await page.waitForURL(/admin|faculty|student/);
  31 |   };
  32 | 
  33 |   test('S-01 Hostel & Room Management (Admin)', async ({ page }) => {
  34 |     await login(page, 'Admin');
  35 |     await page.goto('/admin/hostel/management');
  36 |     await expect(page.locator('h1')).toContainText('Hostel & Room Management');
  37 |     await expect(page.locator('button:has-text("Add Hostel")')).toBeVisible();
  38 |     await expect(page.locator('table')).toBeVisible();
  39 |   });
  40 | 
  41 |   test('S-02 Room Allocation (Admin)', async ({ page }) => {
  42 |     await login(page, 'Admin');
  43 |     await page.goto('/admin/hostel/room-allocation');
  44 |     await expect(page.locator('h1')).toContainText('Room Allocation');
  45 |     await expect(page.locator('button:has-text("Allocate Room")')).toBeVisible();
  46 |   });
  47 | 
  48 |   test('S-03 Hostel Occupancy Dashboard (Admin)', async ({ page }) => {
  49 |     await login(page, 'Admin');
  50 |     await page.goto('/admin/hostel/occupancy-dashboard');
  51 |     await expect(page.locator('h1')).toContainText('Hostel Occupancy');
  52 |     await expect(page.locator('table')).toBeVisible();
  53 |   });
  54 | 
  55 |   test('S-04 My Hostel (Student)', async ({ page }) => {
  56 |     await login(page, 'Student');
  57 |     await page.goto('/student/hostel');
> 58 |     await expect(page.locator('h1')).toContainText('My Hostel');
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  59 |   });
  60 | 
  61 |   test('S-05 New Hostel Request (Student)', async ({ page }) => {
  62 |     await login(page, 'Student');
  63 |     await page.goto('/student/hostel/new-request');
  64 |     await expect(page.locator('h1')).toContainText('New Hostel Request');
  65 |     await expect(page.locator('button:has-text("Submit Request")')).toBeVisible();
  66 |   });
  67 | 
  68 |   test('S-06 My Hostel Requests (Student)', async ({ page }) => {
  69 |     await login(page, 'Student');
  70 |     await page.goto('/student/hostel/requests');
  71 |     await expect(page.locator('h1')).toContainText('My Hostel Requests');
  72 |   });
  73 | 
  74 |   test('S-07 Hostel Request Review (Admin)', async ({ page }) => {
  75 |     await login(page, 'Admin');
  76 |     await page.goto('/admin/hostel/requests');
  77 |     await expect(page.locator('h1')).toContainText('Hostel Request Review');
  78 |     await expect(page.locator('table')).toBeVisible();
  79 |   });
  80 | 
  81 |   test('Unauthorized access check for Admin page by Student', async ({ page }) => {
  82 |     await login(page, 'Student');
  83 |     await page.goto('/admin/hostel/management');
  84 |     await expect(page).toHaveURL(/\/student/);
  85 |   });
  86 | });
  87 | 
```