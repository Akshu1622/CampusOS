import { test, expect } from '@playwright/test';

test.describe('M6 Hostel Smoke Tests', () => {
  // Use admin_core for Admin, student1 for Student
  // Wait for login redirect
  const login = async (page: any, role: 'Admin' | 'Student') => {
    const mockUser = role === 'Admin'
      ? { id: 1, username: 'admin_core', roles: ['Admin'], email: 'admin@example.com' }
      : { id: 3, username: 'student1', roles: ['Student'], email: 'student@example.com' };

    await page.route('**/api/v1/auth/login', async (route: any) => {
      await route.fulfill({ json: { access_token: 'mocked-token', token_type: 'bearer' } });
    });
    await page.route('**/api/v1/me', async (route: any) => {
      await route.fulfill({ json: mockUser });
    });
    await page.route('**/api/v1/hostels**', async (route: any) => {
      await route.fulfill({ json: [] });
    });
    await page.route('**/api/v1/rooms**', async (route: any) => {
      await route.fulfill({ json: [] });
    });
    await page.route('**/api/v1/hostel-requests**', async (route: any) => {
      await route.fulfill({ json: [] });
    });
    await page.goto('/login');
    await page.fill('input[name="username"]', role === 'Admin' ? 'admin_core' : 'student1');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/admin|faculty|student/);
  };

  test('S-01 Hostel & Room Management (Admin)', async ({ page }) => {
    await login(page, 'Admin');
    await page.goto('/admin/hostel/management');
    await expect(page.locator('h1')).toContainText('Hostel & Room Management');
    await expect(page.locator('button:has-text("Add Hostel")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('S-02 Room Allocation (Admin)', async ({ page }) => {
    await login(page, 'Admin');
    await page.goto('/admin/hostel/room-allocation');
    await expect(page.locator('h1')).toContainText('Room Allocation');
    await expect(page.locator('button:has-text("Confirm Allocation")')).toBeVisible();
  });

  test('S-03 Hostel Occupancy Dashboard (Admin)', async ({ page }) => {
    await login(page, 'Admin');
    await page.goto('/admin/hostel/occupancy-dashboard');
    await expect(page.locator('h1')).toContainText('Hostel Occupancy');
    await expect(page.locator('table')).toBeVisible();
  });

  test('S-04 My Hostel (Student)', async ({ page }) => {
    await login(page, 'Student');
    await page.goto('/student/hostel');
    await expect(page.locator('h1')).toContainText('My Hostel');
  });

  test('S-05 New Hostel Request (Student)', async ({ page }) => {
    await login(page, 'Student');
    await page.goto('/student/hostel/new-request');
    await expect(page.locator('h1')).toContainText('New Hostel Request');
    await expect(page.locator('button:has-text("Submit Request")')).toBeVisible();
  });

  test('S-06 My Hostel Requests (Student)', async ({ page }) => {
    await login(page, 'Student');
    await page.goto('/student/hostel/requests');
    await expect(page.locator('h1')).toContainText('My Hostel Requests');
  });

  test('S-07 Hostel Request Review (Admin)', async ({ page }) => {
    await login(page, 'Admin');
    await page.goto('/admin/hostel/requests');
    await expect(page.locator('h1')).toContainText('Hostel Request Review');
    await expect(page.locator('table')).toBeVisible();
  });


  test('S-08 Hostel Integrity Guardian (Admin)', async ({ page }) => {
    await login(page, 'Admin');
    await page.goto('/admin/hostel/guardian');
    await expect(page.locator('h1')).toContainText('Hostel Data Integrity Guardian');
  });

  test('S-09 Smart Allocation Lab (Admin)', async ({ page }) => {
    await login(page, 'Admin');
    await page.goto('/admin/hostel/smart-allocation');
    await expect(page.locator('h1')).toContainText('Smart Allocation Lab');
  });

  test('S-10 Capacity Simulator (Admin)', async ({ page }) => {
    await login(page, 'Admin');
    await page.goto('/admin/hostel/simulator');
    await expect(page.locator('h1')).toContainText('Capacity What-If');
  });

  test('S-11 Change Impact Radar (Admin)', async ({ page }) => {
    await login(page, 'Admin');
    await page.goto('/admin/hostel/radar');
    await expect(page.locator('h1')).toContainText('Hostel Change Impact Radar');
  });

  test('Unauthorized access check for Admin page by Student', async ({ page }) => {
    await login(page, 'Student');
    await page.goto('/admin/hostel/management');
    await expect(page).toHaveURL(/\/student/);
  });
});
