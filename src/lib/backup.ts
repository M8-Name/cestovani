import { db } from '../db/db'

async function blobToB64(b: Blob) {
  const bytes = new Uint8Array(await b.arrayBuffer())
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return `data:${b.type || 'application/octet-stream'};base64,${btoa(bin)}`
}

export async function exportAll(): Promise<Blob> {
  const files = await Promise.all(
    (await db.files.toArray()).map(async (f) => ({ id: f.id, name: f.name, type: f.type, data: await blobToB64(f.blob) })),
  )
  const data = {
    app: 'cestovani',
    version: 1,
    trips: await db.trips.toArray(),
    transports: await db.transports.toArray(),
    lodgings: await db.lodgings.toArray(),
    activities: await db.activities.toArray(),
    restaurants: await db.restaurants.toArray(),
    files,
  }
  return new Blob([JSON.stringify(data)], { type: 'application/json' })
}

export async function importAll(text: string) {
  const d = JSON.parse(text)
  if (d.app !== 'cestovani') throw new Error('Soubor není záloha aplikace')
  const files = await Promise.all(
    (d.files as { id: number; name: string; type: string; data: string }[]).map(async (f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      blob: await (await fetch(f.data)).blob(),
    })),
  )
  await db.transaction('rw', [db.trips, db.transports, db.lodgings, db.activities, db.restaurants, db.files], async () => {
    await Promise.all([db.trips, db.transports, db.lodgings, db.activities, db.restaurants, db.files].map((t) => t.clear()))
    await db.trips.bulkPut(d.trips)
    await db.transports.bulkPut(d.transports)
    await db.lodgings.bulkPut(d.lodgings)
    await db.activities.bulkPut(d.activities)
    await db.restaurants.bulkPut(d.restaurants)
    await db.files.bulkPut(files)
  })
}
