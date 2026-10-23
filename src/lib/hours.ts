import type { OpeningHours } from '../db/db'

export type OpenState = 'open' | 'closed' | 'unknown'

const toMin = (s: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim())
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN
}

/** Index dne v týdnu, pondělí = 0 (vstup YYYY-MM-DD). */
export function weekdayIndex(date: string): number {
  const d = new Date(date + 'T12:00:00')
  return (d.getDay() + 6) % 7
}

export function parseRanges(text: string): [number, number][] {
  return text
    .split(',')
    .map((r) => r.split('-').map(toMin))
    .filter((p): p is [number, number] => p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]))
}

export function openState(hours: OpeningHours, date: string, time: string): OpenState {
  if (!hours.some((h) => h.trim())) return 'unknown'
  const t = toMin(time)
  if (isNaN(t)) return 'unknown'
  const ranges = parseRanges(hours[weekdayIndex(date)] ?? '')
  return ranges.some(([a, b]) => t >= a && t <= b) ? 'open' : 'closed'
}
