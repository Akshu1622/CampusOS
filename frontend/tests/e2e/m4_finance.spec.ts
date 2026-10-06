import { test, expect } from '@playwright/test';

test.describe('M4 Finance Smoke Tests', () => {
  test('F-01 Fee Structure Management (Admin)', async ({ page }) => {
    // We are skipping the full login and mocking it if we only have the frozen frontend.
    // However, the instructions say "login with the right demo account...".
    // I will go to the login page, login as admin, then visit the page.
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@campusos.edu');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/admin');

    await page.goto('/admin/finance/fee-structures');
    await expect(page.locator('h1')).toContainText('Fee Structures');
    await expect(page.locator('table')).toBeVisible();
  });

  test('F-02 Fee Assignment (Admin)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@campusos.edu');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    
    await page.goto('/admin/finance/fee-assignment');
    await expect(page.locator('h1')).toContainText('Fee Assignment Wizard');
  });

  test('F-03 Late Fee Rule Config (Admin)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@campusos.edu');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    
    await page.goto('/admin/finance/late-fee-rules');
    await expect(page.locator('h1')).toContainText('Late Fee Rules');
  });

  test('F-04 My Fees and Dues (Student)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@campusos.edu');
    await page.fill('input[type="password"]', 'student123');
    await page.click('button:has-text("Sign in")');
    
    await page.goto('/student/fees');
    await expect(page.locator('h1')).toContainText('My Fees & Dues');
  });

  test('F-05 Pay Fee Wizard (Student)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@campusos.edu');
    await page.fill('input[type="password"]', 'student123');
    await page.click('button:has-text("Sign in")');
    
    await page.goto('/student/pay');
    await expect(page.locator('h1')).toContainText('Make Payment');
  });

  test('F-06 Payment Confirmation Receipt (Student)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@campusos.edu');
    await page.fill('input[type="password"]', 'student123');
    await page.click('button:has-text("Sign in")');
    
    await page.goto('/student/receipt/REC-001');
    await expect(page.locator('text=Payment Successful')).toBeVisible();
  });

  test('F-07 Receipt Payment History (Student)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@campusos.edu');
    await page.fill('input[type="password"]', 'student123');
    await page.click('button:has-text("Sign in")');
    
    await page.goto('/student/receipt-history');
    await expect(page.locator('h1')).toContainText('Payment History');
  });

  test('F-08 Payment Ledger (Admin)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@campusos.edu');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    
    await page.goto('/admin/finance/ledger');
    await expect(page.locator('h1')).toContainText('Payment Ledger');
  });

  test('F-09 Fee Defaulters (Admin)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@campusos.edu');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    
    await page.goto('/admin/finance/defaulters');
    await expect(page.locator('h1')).toContainText('Fee Defaulters');
  });

  test('F-10 Fee Change Audit Log (Admin)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@campusos.edu');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    
    await page.goto('/admin/finance/audit');
    await expect(page.locator('h1')).toContainText('Fee Change Audit Log');
  });
});
