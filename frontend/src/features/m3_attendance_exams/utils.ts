// Math and validation utility functions for M3 Attendance & Exams

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

export interface MarksValidationResult {
  isValid: boolean
  error?: string
}

export function validateMarksEntry(rawVal: string, maxMarks: number): MarksValidationResult {
  if (rawVal.trim() === '') {
    return { isValid: true } // Empty is treated as un-entered / draft
  }
  const num = Number(rawVal)
  if (isNaN(num)) {
    return { isValid: false, error: 'Must be a valid numeric mark' }
  }
  if (num < 0) {
    return { isValid: false, error: 'Marks cannot be negative' }
  }
  if (num > maxMarks) {
    return { isValid: false, error: `Marks cannot exceed max marks (${maxMarks})` }
  }
  return { isValid: true }
}

export function canModifyResult(status: 'DRAFT' | 'PROCESSED' | 'PUBLISHED'): boolean {
  return status !== 'PUBLISHED'
}

