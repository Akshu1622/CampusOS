import { describe, it, expect } from 'vitest'

// Helper parsing functions matching A05BulkEnrollmentPage parsing logic
export function parseEnrollmentCSV(content: string): Array<{ student_id: number; offering_id: number }> {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length <= 1) return []

  const rows: Array<{ student_id: number; offering_id: number }> = []
  // Header line
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
  const studentIdx = headers.indexOf('student_id')
  const offeringIdx = headers.indexOf('offering_id')

  if (studentIdx === -1 || offeringIdx === -1) {
    throw new Error('CSV must contain student_id and offering_id headers')
  }

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim())
    if (parts.length < 2) continue
    const student_id = parseInt(parts[studentIdx], 10)
    const offering_id = parseInt(parts[offeringIdx], 10)
    if (!isNaN(student_id) && !isNaN(offering_id)) {
      rows.push({ student_id, offering_id })
    }
  }
  return rows
}

export function parseEnrollmentJSON(content: string): Array<{ student_id: number; offering_id: number }> {
  const data = JSON.parse(content)
  if (!Array.isArray(data)) {
    throw new Error('JSON payload must be an array of enrollment items')
  }
  return data.map(item => ({
    student_id: Number(item.student_id),
    offering_id: Number(item.offering_id),
  })).filter(item => !isNaN(item.student_id) && !isNaN(item.offering_id))
}

export function parseEnrollmentXML(content: string): Array<{ student_id: number; offering_id: number }> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'application/xml')
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error('Invalid XML document format')
  }

  const items = Array.from(doc.querySelectorAll('enrollment, item, row'))
  return items.map(node => {
    const studentEl = node.querySelector('student_id, studentId')
    const offeringEl = node.querySelector('offering_id, offeringId')
    return {
      student_id: studentEl ? parseInt(studentEl.textContent || '', 10) : NaN,
      offering_id: offeringEl ? parseInt(offeringEl.textContent || '', 10) : NaN,
    }
  }).filter(item => !isNaN(item.student_id) && !isNaN(item.offering_id))
}

describe('M2 Bulk Enrollment Parsing Suite', () => {
  it('parses valid CSV with headers correctly', () => {
    const csv = `student_id,offering_id
101,1
102,1
103,2`
    const result = parseEnrollmentCSV(csv)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ student_id: 101, offering_id: 1 })
    expect(result[1]).toEqual({ student_id: 102, offering_id: 1 })
    expect(result[2]).toEqual({ student_id: 103, offering_id: 2 })
  })

  it('throws error for CSV missing required headers', () => {
    const invalidCsv = `id,name
101,John`
    expect(() => parseEnrollmentCSV(invalidCsv)).toThrow(/headers/)
  })

  it('parses valid JSON array correctly', () => {
    const json = JSON.stringify([
      { student_id: 201, offering_id: 5 },
      { student_id: 202, offering_id: 5 },
    ])
    const result = parseEnrollmentJSON(json)
    expect(result).toEqual([
      { student_id: 201, offering_id: 5 },
      { student_id: 202, offering_id: 5 },
    ])
  })

  it('rejects JSON non-array root', () => {
    const invalidJson = JSON.stringify({ student_id: 201, offering_id: 5 })
    expect(() => parseEnrollmentJSON(invalidJson)).toThrow(/array/)
  })

  it('parses valid XML documents into enrollment pairs', () => {
    const xml = `
      <enrollments>
        <item>
          <student_id>301</student_id>
          <offering_id>10</offering_id>
        </item>
        <item>
          <student_id>302</student_id>
          <offering_id>10</offering_id>
        </item>
      </enrollments>
    `
    const result = parseEnrollmentXML(xml)
    expect(result).toEqual([
      { student_id: 301, offering_id: 10 },
      { student_id: 302, offering_id: 10 },
    ])
  })
})
