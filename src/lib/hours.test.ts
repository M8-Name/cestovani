import { describe, expect, it } from 'vitest'
import { openState, weekdayIndex } from './hours'

const hours = ['9:00-17:00', '9:00-12:00,13:00-17:00', '', '', '', '10:00-14:00', '']

describe('openState', () => {
  it('weekdayIndex: pondělí = 0', () => {
    expect(weekdayIndex('2026-10-26')).toBe(0)
    expect(weekdayIndex('2026-11-01')).toBe(6)
  })
  it('otevřeno / zavřeno v rozmezí', () => {
    expect(openState(hours, '2026-10-26', '10:30')).toBe('open')
    expect(openState(hours, '2026-10-26', '17:30')).toBe('closed')
  })
  it('polední pauza', () => {
    expect(openState(hours, '2026-10-27', '12:30')).toBe('closed')
    expect(openState(hours, '2026-10-27', '13:30')).toBe('open')
  })
  it('zavřený den a neznámé hodiny', () => {
    expect(openState(hours, '2026-10-28', '12:00')).toBe('closed')
    expect(openState(Array(7).fill(''), '2026-10-28', '12:00')).toBe('unknown')
  })
})
