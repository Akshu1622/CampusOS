import { test, expect } from '@playwright/test';

test.describe('M6 Hostel Smoke Tests', () => {
  // Use admin_core for Admin, student1 for Student
  // Wait for login redirect
  const login = async (page: any, role: 'Admin' | 'Student') => {
    await page.goto('/login');
    await page.fill('input[name="username"]', role === 'Admin' ? 'admin_core' : 'student1');
    await page.fill('input[type="password"]', 'password123');
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
    await expect(page.locator('button:has-text("Allocate Room")')).toBeVisible();
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

  test('Unauthorized access check for Admin page by Student', async ({ page }) => {
    await login(page, 'Student');
    await page.goto('/admin/hostel/management');
    await expect(page).toHaveURL(/\/student/);
  });
});
