import { describe, it, expect } from 'vitest'

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

describe('M3 Marks Validation & Processing Rules', () => {
  const MAX_MARKS = 100

  it('allows valid marks within [0, maxMarks]', () => {
    expect(validateMarksEntry('0', MAX_MARKS)).toEqual({ isValid: true })
    expect(validateMarksEntry('50', MAX_MARKS)).toEqual({ isValid: true })
    expect(validateMarksEntry('100', MAX_MARKS)).toEqual({ isValid: true })
    expect(validateMarksEntry('85.5', MAX_MARKS)).toEqual({ isValid: true })
    expect(validateMarksEntry('', MAX_MARKS)).toEqual({ isValid: true })
  })

  it('rejects marks greater than max_marks', () => {
    const res = validateMarksEntry('101', MAX_MARKS)
    expect(res.isValid).toBe(false)
    expect(res.error).toContain('cannot exceed max marks')
  })

  it('rejects negative marks', () => {
    const res = validateMarksEntry('-5', MAX_MARKS)
    expect(res.isValid).toBe(false)
    expect(res.error).toContain('cannot be negative')
  })

  it('rejects non-numeric inputs', () => {
    const res = validateMarksEntry('abc', MAX_MARKS)
    expect(res.isValid).toBe(false)
    expect(res.error).toContain('valid numeric')
  })

  it('locks modifications once results are published', () => {
    expect(canModifyResult('DRAFT')).toBe(true)
    expect(canModifyResult('PROCESSED')).toBe(true)
    expect(canModifyResult('PUBLISHED')).toBe(false)
  })
})
