import { describe, it, expect } from 'vitest'

export function calculateAttendancePercentage(present: number, total: number): number {
  if (total <= 0) return 100.0
  return Math.round((present / total) * 10000) / 100
}

export function isEligibleForExam(percentage: number, threshold = 75.0): boolean {
  return percentage >= threshold
}

export function calculateGapTo75(present: number, total: number, targetPct = 75.0): number {
  if (total <= 0) return 0
  const currentPct = (present / total) * 100
  if (currentPct >= targetPct) return 0
  // Target: (present + x) / (total + x) >= 0.75
  // present + x >= 0.75 * total + 0.75 * x
  // 0.25 * x >= 0.75 * total - present
  // x >= 3 * total - 4 * present
  const needed = 3 * total - 4 * present
  return Math.max(0, Math.ceil(needed))
}

describe('M3 Attendance Math & Eligibility Rules', () => {
  it('calculates attendance percentage rounded to two decimals', () => {
    expect(calculateAttendancePercentage(15, 20)).toBe(75.0)
    expect(calculateAttendancePercentage(10, 20)).toBe(50.0)
    expect(calculateAttendancePercentage(14, 20)).toBe(70.0)
    expect(calculateAttendancePercentage(1, 3)).toBe(33.33)
  })

  it('correctly assesses exam eligibility against 75% rule', () => {
    expect(isEligibleForExam(75.0)).toBe(true)
    expect(isEligibleForExam(75.01)).toBe(true)
    expect(isEligibleForExam(90.0)).toBe(true)
    expect(isEligibleForExam(74.99)).toBe(false)
    expect(isEligibleForExam(68.0)).toBe(false)
    expect(isEligibleForExam(50.0)).toBe(false)
  })

  it('calculates the exact gap-to-75 classes needed', () => {
    // 10 out of 20 = 50%, needs 20 consecutive classes to reach 30/40 = 75%
    expect(calculateGapTo75(10, 20)).toBe(20)

    // 14 out of 20 = 70%, needs 4 classes to reach 18/24 = 75%
    expect(calculateGapTo75(14, 20)).toBe(4)

    // Already at or above 75%, gap is 0
    expect(calculateGapTo75(15, 20)).toBe(0)
    expect(calculateGapTo75(18, 20)).toBe(0)

    // 0 out of 10 = 0%, needs 30 classes to reach 30/40 = 75%
    expect(calculateGapTo75(0, 10)).toBe(30)
  })
})
