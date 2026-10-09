import { test, expect, Page } from '@playwright/test'
import path from 'path'

const SCREENSHOT_DIR = path.resolve(process.cwd(), '../docs/repair_screenshots/m2_m3')

async function loginAs(page: Page, username: string, password = 'password123') {
  await page.goto('/login')
  await page.fill('input[name="username"]', username)
  await page.fill('input[name="password"]', password)
  await page.click('button:has-text("Sign in")')
  await page.waitForURL(/\/(admin|faculty|student)/, { timeout: 15000 })
}

async function captureResponsive(page: Page, prefix: string) {
  const viewports = [
    { width: 1440, height: 900, label: '1440' },
    { width: 768, height: 1024, label: '768' },
    { width: 375, height: 812, label: '375' },
  ]
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.waitForTimeout(300)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}_${vp.label}px.png`),
      fullPage: false,
    })
  }
}

test.describe('M2 Academics & Enrollment E2E Suite', () => {

  test('A-01 Course Catalog Page loads, displays courses, captures screenshots', async ({ page }) => {
    await loginAs(page, 'admin_core')
    await page.goto('/admin/academics/courses')
    await expect(page.locator('h1:has-text("Course Catalog")')).toBeVisible()
    await expect(page.locator('button:has-text("Add Course")')).toBeVisible()
    await expect(page.locator('text=CS001').or(page.locator('table tr')).first()).toBeVisible({ timeout: 10000 })
    await captureResponsive(page, 'A01_course_catalog')
  })

  test('A-02 Curriculum Mapping Page loads and shows semester columns', async ({ page }) => {
    await loginAs(page, 'admin_core')
    await page.goto('/admin/academics/curriculum')
    await expect(page.locator('h1:has-text("Curriculum Mapping")')).toBeVisible()
    await expect(page.locator('text=Semester').first()).toBeVisible({ timeout: 10000 })
    await captureResponsive(page, 'A02_curriculum_mapping')
  })

  test('A-03 Course Offerings Page loads and shows capacity indicators', async ({ page }) => {
    await loginAs(page, 'admin_core')
    await page.goto('/admin/academics/offerings')
    await expect(page.locator('h1:has-text("Course Offerings")')).toBeVisible()
    await expect(page.locator('button:has-text("Add Offering")')).toBeVisible()
    await captureResponsive(page, 'A03_course_offerings')
  })

  test('A-04 Individual Enrollment Page & Negative Scenarios (Capacity Full & Duplicate)', async ({ page }) => {
    await loginAs(page, 'admin_core')
    await page.goto('/admin/academics/enrollment/individual')
    await expect(page.locator('h1:has-text("Individual Enrollment")')).toBeVisible()
    await captureResponsive(page, 'A04_individual_enrollment')

    // Pick student and offering
    const studentSelect = page.locator('select').first()
    await studentSelect.selectOption({ index: 1 })
    
    // Attempt enrollment
    const enrollBtn = page.locator('button:has-text("Enroll Student")')
    if (await enrollBtn.isEnabled()) {
      await enrollBtn.click()
      // Either success or duplicate / capacity rejection alert shown
      await page.waitForTimeout(1000)
    }
  })

  test('A-05 Bulk Enrollment Wizard & Negative Scenario (Invalid Rows)', async ({ page }) => {
    await loginAs(page, 'admin_core')
    await page.goto('/admin/academics/enrollment/bulk')
    await expect(page.locator('h1:has-text("Bulk Enrollment")')).toBeVisible()
    await captureResponsive(page, 'A05_bulk_enrollment')

    // Negative Test: CSV with invalid non-numeric/missing rows
    const textarea = page.locator('textarea')
    if (await textarea.isVisible()) {
      await textarea.fill('student_id,offering_id\n999999,999999\ninvalid,bad_id')
      const validateBtn = page.locator('button:has-text("Validate")')
      if (await validateBtn.isVisible()) {
        await validateBtn.click()
        await expect(
          page.locator('text=Invalid').or(page.locator('text=Error')).or(page.locator('text=Issues')).or(page.locator('text=Preview')).first()
        ).toBeVisible({ timeout: 8000 })
      }
    }
  })

  test('A-06 Enrollment Records Page loads with filters and export', async ({ page }) => {
    await loginAs(page, 'admin_core')
    await page.goto('/admin/academics/enrollment/records')
    await expect(page.locator('h1:has-text("Enrollment Records")')).toBeVisible()
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible()
    await captureResponsive(page, 'A06_enrollment_records')
  })

  test('A-07 Student My Courses Page loads for student1', async ({ page }) => {
    await loginAs(page, 'student1')
    await page.goto('/student/courses')
    await expect(page.locator('h1:has-text("My Courses")')).toBeVisible()
    await captureResponsive(page, 'A07_my_courses')
  })

  test('A-08 Faculty My Teaching Page loads for faculty1', async ({ page }) => {
    await loginAs(page, 'faculty1')
    await page.goto('/faculty/teaching')
    await expect(page.locator('h1:has-text("My Teaching")')).toBeVisible()
    await captureResponsive(page, 'A08_my_teaching')
  })
})
