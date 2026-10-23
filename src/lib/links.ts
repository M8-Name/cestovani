import type { Place } from '../db/db'

const enc = encodeURIComponent

/** Odkaz otevře místo v Google Maps (aplikace / web). */
export const mapLink = (p: Place) =>
  p.mapUrl || `https://www.google.com/maps/search/?api=1&query=${enc(p.address)}`

/** Trasa MHD z bodu A do B v Google Maps (spojení, nástup/výstup, časy). */
export const transitLink = (from: string, to: string) =>
  `https://www.google.com/maps/dir/?api=1&origin=${enc(from)}&destination=${enc(to)}&travelmode=transit`

/** Celý den v mapě: první bod → poslední, mezi tím zastávky. */
export const dayRouteLink = (addresses: string[], mode: 'transit' | 'walking' | 'driving' = 'transit') => {
  const a = addresses.filter(Boolean)
  if (a.length < 2) return ''
  const mid = a.slice(1, -1)
  return `https://www.google.com/maps/dir/?api=1&origin=${enc(a[0])}&destination=${enc(a[a.length - 1])}` +
    (mid.length ? `&waypoints=${mid.map(enc).join('%7C')}` : '') + `&travelmode=${mode}`
}
