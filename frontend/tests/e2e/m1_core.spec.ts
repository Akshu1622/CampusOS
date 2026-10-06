import { test, expect } from '@playwright/test';

test.describe('M1 Core Pages Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API for login
    await page.route('**/api/v1/auth/login', async route => {
      await route.fulfill({ json: { access_token: 'mocked-token', token_type: 'bearer' } });
    });
    // Mock API for /me
    await page.route('**/api/v1/me', async route => {
      await route.fulfill({ json: { id: 1, username: 'admin_core', roles: ['Admin'], email: 'admin@example.com' } });
    });
    // Mock other endpoints that pages might hit on mount
    await page.route('**/api/v1/users**', async route => {
      await route.fulfill({ json: { items: [], total: 0 } });
    });
    await page.route('**/api/v1/roles**', async route => {
      await route.fulfill({ json: [] });
    });
    await page.route('**/api/v1/departments**', async route => {
      await route.fulfill({ json: [] });
    });
    await page.route('**/api/v1/programs**', async route => {
      await route.fulfill({ json: [] });
    });
    await page.route('**/api/v1/terms**', async route => {
      await route.fulfill({ json: [] });
    });
    await page.route('**/api/v1/students**', async route => {
      await route.fulfill({ json: { items: [], total: 0 } });
    });

    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin_core');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/admin');
  });

  test('Profile Page loads correctly', async ({ page }) => {
    await page.goto('/admin/profile');
    await expect(page.locator('h1:has-text("Profile")')).toBeVisible();
    await expect(page.locator('h2:has-text("admin_core")')).toBeVisible();
    await expect(page.locator('text=Overview').first()).toBeVisible();
    await expect(page.locator('text=Security').first()).toBeVisible();
  });

  test('User Management Page loads correctly', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('h1:has-text("Users")')).toBeVisible();
    await expect(page.locator('button:has-text("Add User")').first()).toBeVisible();
  });

  test('Roles & Permissions Page loads correctly', async ({ page }) => {
    await page.goto('/admin/roles');
    await expect(page.locator('h1:has-text("Roles & Permissions")')).toBeVisible();
    await expect(page.locator('text=Configure which admin users hold specific permission sets').first()).toBeVisible();
  });

  test('Department Management Page loads correctly', async ({ page }) => {
    await page.goto('/admin/departments');
    await expect(page.locator('h1:has-text("Departments")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Department")').first()).toBeVisible();
  });

  test('Program Management Page loads correctly', async ({ page }) => {
    await page.goto('/admin/programs');
    await expect(page.locator('h1:has-text("Programs")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Program")').first()).toBeVisible();
  });

  test('Academic Terms Page loads correctly', async ({ page }) => {
    await page.goto('/admin/terms');
    await expect(page.locator('h1:has-text("Academic Terms")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Term")').first()).toBeVisible();
  });

  test('Student Master Page loads correctly', async ({ page }) => {
    await page.goto('/admin/students');
    await expect(page.locator('h1:has-text("Students")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Student")').first()).toBeVisible();
  });
});
