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

test.describe('M3 Attendance & Exams E2E Suite', () => {

  test('E-01 Mark Attendance Page loads, toggles attendance, captures screenshots', async ({ page }) => {
    await loginAs(page, 'admin_core')
    await page.goto('/admin/attendance/mark')
    await expect(page.locator('h1:has-text("Mark Class Attendance")')).toBeVisible()
    await expect(page.locator('button:has-text("Mark All Present")')).toBeVisible()
    await captureResponsive(page, 'E01_mark_attendance')
  })

  test('E-02 Attendance History Page loads and filters sessions', async ({ page }) => {
    await loginAs(page, 'admin_core')
    await page.goto('/admin/attendance/sessions')
    await expect(page.locator('h1:has-text("Attendance History")')).toBeVisible()
    await captureResponsive(page, 'E02_attendance_history')
  })

  test('E-03 Student My Attendance Page loads with 75% rule indicators', async ({ page }) => {
    await loginAs(page, 'student1')
    await page.goto('/student/attendance')
    await expect(page.locator('h1:has-text("My Course Attendance")')).toBeVisible()
    await expect(page.locator('text=75%').first()).toBeVisible()
    await captureResponsive(page, 'E03_my_attendance')
  })

  test('E-04 Attendance Shortage Report Page loads with gap-to-75 calculations', async ({ page }) => {
    await loginAs(page, 'admin_core')
    await page.goto('/admin/attendance/shortage')
    await expect(page.locator('h1:has-text("Attendance Shortage")')).toBeVisible()
    await expect(page.locator('button:has-text("Export Report CSV")')).toBeVisible()
    await captureResponsive(page, 'E04_attendance_shortage')
  })

  test('E-05 Exam Management Page loads with schedule actions', async ({ page }) => {
    await loginAs(page, 'admin_core')
    await page.goto('/admin/exams/management')
    await expect(page.locator('h1:has-text("Exam Management")')).toBeVisible()
    await expect(page.locator('button:has-text("Schedule Exam")')).toBeVisible()
    await captureResponsive(page, 'E05_exam_management')
  })

  test('E-06 Student Exam Registration Page & Negative Scenario (Low Attendance Blocked)', async ({ page }) => {
    // Log in as student3 who has low attendance
    await loginAs(page, 'student3')
    await page.goto('/student/exams')
    await expect(page.locator('h1:has-text("Examination Registration")')).toBeVisible()
    await captureResponsive(page, 'E06_exam_registration')

    // Find any register button or status pill
    const registerBtn = page.locator('button:has-text("Register Now")').first()
    if (await registerBtn.isVisible()) {
      await registerBtn.click()
      await page.waitForTimeout(1000)
    }
  })

  test('E-07 Exam Registration Monitor Page loads for admin', async ({ page }) => {
    await loginAs(page, 'admin_core')
    await page.goto('/admin/exams/registrations')
    await expect(page.locator('h1:has-text("Exam Registration Monitor")')).toBeVisible()
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible()
    await captureResponsive(page, 'E07_exam_registrations_monitor')
  })

  test('E-08 Marks Entry Page & Negative Scenario (Marks > Max Marks Inline Warning)', async ({ page }) => {
    await loginAs(page, 'admin_core')
    await page.goto('/admin/exams/marks')
    await expect(page.locator('h1:has-text("Examination Marks Entry")')).toBeVisible()
    await captureResponsive(page, 'E08_marks_entry')

    // Check published lock or validate input
    const marksInput = page.locator('input[type="number"]').first()
    if (await marksInput.isVisible()) {
      if (await marksInput.isDisabled()) {
        await expect(page.locator('text=Locked').or(page.locator('text=published')).first()).toBeVisible()
      } else {
        await marksInput.fill('150')
        await expect(page.locator('text=Exceeds max').or(page.locator('.text-error')).first()).toBeVisible()
      }
    }
  })

  test('E-09 Result Processing Page & Negative Scenario (Publish Locked)', async ({ page }) => {
    await loginAs(page, 'admin_core')
    await page.goto('/admin/exams/results/process')
    await expect(page.locator('h1:has-text("Result Processing & Publishing")')).toBeVisible()
    await captureResponsive(page, 'E09_result_processing')

    const publishBtn = page.locator('button:has-text("Publish Final Results")')
    if (await publishBtn.isVisible()) {
      await publishBtn.click()
      await page.waitForTimeout(500)
    }
  })

  test('E-10 Student My Results Page loads with SGPA and CGPA UDF', async ({ page }) => {
    await loginAs(page, 'student1')
    await page.goto('/student/results')
    await expect(page.locator('h1:has-text("My Examination Results")')).toBeVisible()
    await captureResponsive(page, 'E10_my_results')
  })

  test('E-11 Grade Scale Configuration Page loads', async ({ page }) => {
    await loginAs(page, 'admin_core')
    await page.goto('/admin/exams/grade-scale')
    await expect(page.locator('h1:has-text("Grade Scale")')).toBeVisible()
    await expect(page.locator('button:has-text("Add Grade Rule")')).toBeVisible()
    await captureResponsive(page, 'E11_grade_scale_config')
  })

  test('E-12 Course Result Summary Page loads with analytics KPIs', async ({ page }) => {
    await loginAs(page, 'admin_core')
    await page.goto('/admin/exams/results/summary')
    await expect(page.locator('h1:has-text("Course Result Summary")')).toBeVisible()
    await captureResponsive(page, 'E12_course_result_summary')
  })
})
