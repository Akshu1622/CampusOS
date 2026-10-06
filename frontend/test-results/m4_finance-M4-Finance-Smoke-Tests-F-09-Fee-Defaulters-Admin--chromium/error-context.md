# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: m4_finance.spec.ts >> M4 Finance Smoke Tests >> F-09 Fee Defaulters (Admin)
- Location: tests\e2e\m4_finance.spec.ts:89:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]')

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('M4 Finance Smoke Tests', () => {
  4   |   test('F-01 Fee Structure Management (Admin)', async ({ page }) => {
  5   |     // We are skipping the full login and mocking it if we only have the frozen frontend.
  6   |     // However, the instructions say "login with the right demo account...".
  7   |     // I will go to the login page, login as admin, then visit the page.
  8   |     await page.goto('/login');
  9   |     await page.fill('input[type="email"]', 'admin@campusos.edu');
  10  |     await page.fill('input[type="password"]', 'admin123');
  11  |     await page.click('button:has-text("Sign in")');
  12  |     await page.waitForURL('/admin');
  13  | 
  14  |     await page.goto('/admin/finance/fee-structures');
  15  |     await expect(page.locator('h1')).toContainText('Fee Structures');
  16  |     await expect(page.locator('table')).toBeVisible();
  17  |   });
  18  | 
  19  |   test('F-02 Fee Assignment (Admin)', async ({ page }) => {
  20  |     await page.goto('/login');
  21  |     await page.fill('input[type="email"]', 'admin@campusos.edu');
  22  |     await page.fill('input[type="password"]', 'admin123');
  23  |     await page.click('button:has-text("Sign in")');
  24  |     
  25  |     await page.goto('/admin/finance/fee-assignment');
  26  |     await expect(page.locator('h1')).toContainText('Fee Assignment Wizard');
  27  |   });
  28  | 
  29  |   test('F-03 Late Fee Rule Config (Admin)', async ({ page }) => {
  30  |     await page.goto('/login');
  31  |     await page.fill('input[type="email"]', 'admin@campusos.edu');
  32  |     await page.fill('input[type="password"]', 'admin123');
  33  |     await page.click('button:has-text("Sign in")');
  34  |     
  35  |     await page.goto('/admin/finance/late-fee-rules');
  36  |     await expect(page.locator('h1')).toContainText('Late Fee Rules');
  37  |   });
  38  | 
  39  |   test('F-04 My Fees and Dues (Student)', async ({ page }) => {
  40  |     await page.goto('/login');
  41  |     await page.fill('input[type="email"]', 'student@campusos.edu');
  42  |     await page.fill('input[type="password"]', 'student123');
  43  |     await page.click('button:has-text("Sign in")');
  44  |     
  45  |     await page.goto('/student/fees');
  46  |     await expect(page.locator('h1')).toContainText('My Fees & Dues');
  47  |   });
  48  | 
  49  |   test('F-05 Pay Fee Wizard (Student)', async ({ page }) => {
  50  |     await page.goto('/login');
  51  |     await page.fill('input[type="email"]', 'student@campusos.edu');
  52  |     await page.fill('input[type="password"]', 'student123');
  53  |     await page.click('button:has-text("Sign in")');
  54  |     
  55  |     await page.goto('/student/pay');
  56  |     await expect(page.locator('h1')).toContainText('Make Payment');
  57  |   });
  58  | 
  59  |   test('F-06 Payment Confirmation Receipt (Student)', async ({ page }) => {
  60  |     await page.goto('/login');
  61  |     await page.fill('input[type="email"]', 'student@campusos.edu');
  62  |     await page.fill('input[type="password"]', 'student123');
  63  |     await page.click('button:has-text("Sign in")');
  64  |     
  65  |     await page.goto('/student/receipt/REC-001');
  66  |     await expect(page.locator('text=Payment Successful')).toBeVisible();
  67  |   });
  68  | 
  69  |   test('F-07 Receipt Payment History (Student)', async ({ page }) => {
  70  |     await page.goto('/login');
  71  |     await page.fill('input[type="email"]', 'student@campusos.edu');
  72  |     await page.fill('input[type="password"]', 'student123');
  73  |     await page.click('button:has-text("Sign in")');
  74  |     
  75  |     await page.goto('/student/receipt-history');
  76  |     await expect(page.locator('h1')).toContainText('Payment History');
  77  |   });
  78  | 
  79  |   test('F-08 Payment Ledger (Admin)', async ({ page }) => {
  80  |     await page.goto('/login');
  81  |     await page.fill('input[type="email"]', 'admin@campusos.edu');
  82  |     await page.fill('input[type="password"]', 'admin123');
  83  |     await page.click('button:has-text("Sign in")');
  84  |     
  85  |     await page.goto('/admin/finance/ledger');
  86  |     await expect(page.locator('h1')).toContainText('Payment Ledger');
  87  |   });
  88  | 
  89  |   test('F-09 Fee Defaulters (Admin)', async ({ page }) => {
  90  |     await page.goto('/login');
> 91  |     await page.fill('input[type="email"]', 'admin@campusos.edu');
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  92  |     await page.fill('input[type="password"]', 'admin123');
  93  |     await page.click('button:has-text("Sign in")');
  94  |     
  95  |     await page.goto('/admin/finance/defaulters');
  96  |     await expect(page.locator('h1')).toContainText('Fee Defaulters');
  97  |   });
  98  | 
  99  |   test('F-10 Fee Change Audit Log (Admin)', async ({ page }) => {
  100 |     await page.goto('/login');
  101 |     await page.fill('input[type="email"]', 'admin@campusos.edu');
  102 |     await page.fill('input[type="password"]', 'admin123');
  103 |     await page.click('button:has-text("Sign in")');
  104 |     
  105 |     await page.goto('/admin/finance/audit');
  106 |     await expect(page.locator('h1')).toContainText('Fee Change Audit Log');
  107 |   });
  108 | });
  109 | 
```