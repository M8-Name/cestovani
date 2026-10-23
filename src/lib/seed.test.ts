import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const trip = JSON.parse(readFileSync('public/trips/roadtrip-2027/trip.json', 'utf8'))

describe('roadtrip-2027 seed', () => {
  it('má 7 dní a aktivity každý den', () => {
    const dates = new Set(trip.activities.map((a: { date: string }) => a.date))
    expect(dates.size).toBe(7)
  })
  it('každá aktivita má hours (7) a transit', () => {
    for (const a of trip.activities) {
      expect(a.hours).toHaveLength(7)
      expect(a.transit).toBeDefined()
    }
  })
  it('5 kempů', () => expect(trip.lodgings).toHaveLength(5))
})
