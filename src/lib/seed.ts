import { db, deleteTrip, type Activity, type Lodging, type Restaurant, type Transport, type Trip } from '../db/db'

interface TripFile {
  version: number
  trip: Omit<Trip, 'id' | 'slug' | 'seedVersion'>
  transports?: Omit<Transport, 'id' | 'tripId' | 'fileIds'>[]
  lodgings?: Omit<Lodging, 'id' | 'tripId' | 'fileIds'>[]
  activities?: Omit<Activity, 'id' | 'tripId' | 'fileIds'>[]
  restaurants?: Omit<Restaurant, 'id' | 'tripId' | 'fileIds'>[]
}

const get = async <T,>(path: string): Promise<T> => {
  const r = await fetch(new URL(path, document.baseURI).href, { cache: 'no-cache' })
  if (!r.ok) throw new Error(path)
  return r.json()
}

/**
 * Načte cesty připravené v repozitáři (public/trips/<slug>/trip.json).
 * Při vyšší `version` v souboru se cesta v zařízení přepíše novou verzí.
 */
export async function seedTrips() {
  let slugs: string[]
  try { slugs = await get<string[]>('trips/index.json') } catch { return }
  for (const slug of slugs) {
    try {
      const f = await get<TripFile>(`trips/${slug}/trip.json`)
      const existing = (await db.trips.toArray()).find((t) => t.slug === slug)
      if (existing && (existing.seedVersion ?? 0) >= f.version) continue
      if (existing) await deleteTrip(existing.id!)
      const tripId = await db.trips.add({ ...f.trip, slug, seedVersion: f.version })
      const withIds = <R,>(rows: R[] = []) => rows.map((r) => ({ ...r, tripId, fileIds: [] as number[] }))
      await db.transports.bulkAdd(withIds(f.transports) as Transport[])
      await db.lodgings.bulkAdd(withIds(f.lodgings) as Lodging[])
      await db.activities.bulkAdd(withIds(f.activities) as Activity[])
      await db.restaurants.bulkAdd(withIds(f.restaurants) as Restaurant[])
    } catch (e) {
      console.warn('Seed selhal pro', slug, e)
    }
  }
}
