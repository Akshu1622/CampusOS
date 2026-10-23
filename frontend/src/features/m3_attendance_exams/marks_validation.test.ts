import { describe, it, expect } from 'vitest'

import { validateMarksEntry, canModifyResult, type MarksValidationResult } from './utils'
export { validateMarksEntry, canModifyResult, type MarksValidationResult }

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
