import 'fake-indexeddb/auto'
import { expect, it } from 'vitest'
import { db, emptyHours, emptyPlace } from '../db/db'
import { exportAll, importAll } from './backup'

it('export → smazání → import zachová data i soubory', async () => {
  const fileId = await db.files.add({ name: 'a.txt', type: 'text/plain', blob: new Blob(['ahoj'], { type: 'text/plain' }) })
  const tripId = await db.trips.add({ name: 'Řím', destination: 'Řím', from: '2026-05-01', to: '2026-05-05', cover: 'city' })
  await db.activities.add({
    tripId, date: '2026-05-02', title: 'Koloseum', startTime: '09:00', bookingTime: '09:30', place: emptyPlace(),
    hours: emptyHours(), url: '', transit: { line: 'B', boardAt: 'Termini', alightAt: 'Colosseo', note: '' }, notes: '', fileIds: [fileId],
  })
  const dump = await (await exportAll()).text()
  await Promise.all([db.trips, db.activities, db.files].map((t) => t.clear()))
  await importAll(dump)
  expect((await db.trips.toArray())[0].name).toBe('Řím')
  const act = (await db.activities.toArray())[0]
  expect(act.transit.line).toBe('B')
  const f = await db.files.get(act.fileIds[0])
  expect(await f!.blob.text()).toBe('ahoj')
})
