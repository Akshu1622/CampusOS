import { test, expect } from '@playwright/test';

test.describe('M5 HR & Payroll Smoke Tests', () => {
  // Use a beforeEach to set up authentication state or just login inside each test
  // To avoid timeouts, we can reuse auth state, but doing it per test is simpler and matches previous patterns

  test('H-01 Employee Master (Admin)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin_core');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/admin|faculty|student/);
    await page.goto('/admin/hr/employees');
    await expect(page.locator('h1')).toContainText('Employee Master');
    await expect(page.locator('table')).toBeVisible();
  });

  test('H-02 Designation Management (Admin)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin_core');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/admin|faculty|student/);
    
    await page.goto('/admin/hr/designations');
    await expect(page.locator('h1')).toContainText('Designation Management');
    await expect(page.locator('table')).toBeVisible();
  });

  test('H-03 Leave Type Policy (Admin)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin_core');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/admin|faculty|student/);
    
    await page.goto('/admin/hr/leave-types');
    await expect(page.locator('h1')).toContainText('Leave Types & Policy');
    await expect(page.locator('table')).toBeVisible();
  });

  test('H-04 Apply for Leave (Faculty)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'faculty1');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/admin|faculty|student/);
    
    await page.goto('/faculty/hr/apply-leave');
    await expect(page.locator('h1')).toContainText('Apply for Leave');
  });

  test('H-05 My Leave (Faculty)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'faculty1');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/admin|faculty|student/);
    
    await page.goto('/faculty/hr/my-leave');
    await expect(page.locator('h1')).toContainText('My Leave');
    await expect(page.locator('table')).toBeVisible();
  });

  test('H-06 Leave Approvals (Admin)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin_core');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/admin|faculty|student/);
    
    await page.goto('/admin/hr/leave-approvals');
    await expect(page.locator('h1')).toContainText('Leave Approvals');
    await expect(page.locator('table')).toBeVisible();
  });

  test('H-07 Salary Structure Management (Admin)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin_core');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/admin|faculty|student/);
    
    await page.goto('/admin/hr/salary-structures');
    await expect(page.locator('h1')).toContainText('Salary Structure Management');
    await expect(page.locator('table')).toBeVisible();
  });

  test('H-08 Payroll Run (Admin)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin_core');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/admin|faculty|student/);
    
    await page.goto('/admin/hr/payroll-run');
    await expect(page.locator('h1')).toContainText('Payroll Run');
  });

  test('H-09 Payroll Register (Admin)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin_core');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/admin|faculty|student/);
    
    await page.goto('/admin/hr/payroll-register');
    await expect(page.locator('h1')).toContainText('Payroll Register');
    await expect(page.locator('table')).toBeVisible();
  });

  test('H-10 My Payslips (Faculty)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'faculty1');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/admin|faculty|student/);
    
    await page.goto('/faculty/hr/payslips');
    await expect(page.locator('h1')).toContainText('My Payslips');
  });
});
