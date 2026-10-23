import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { daysBetween, fmtDate } from '../lib/format'
import { Page, Tile } from '../components/ui'
import { imageBg } from './Home'

export function useTripDays(tripId: number) {
  return useLiveQuery(async () => {
    const trip = await db.trips.get(tripId)
    const [acts, rests] = await Promise.all([
      db.activities.where('tripId').equals(tripId).toArray(),
      db.restaurants.where('tripId').equals(tripId).toArray(),
    ])
    const set = new Set([
      ...daysBetween(trip?.from ?? '', trip?.to ?? ''),
      ...acts.map((a) => a.date),
      ...rests.filter((r) => r.reservationAt).map((r) => r.reservationAt.slice(0, 10)),
    ])
    const days = [...set].sort()
    return { trip, days, counts: Object.fromEntries(days.map((d) => [d, acts.filter((a) => a.date === d).length])) }
  }, [tripId])
}

export function Program() {
  const tripId = Number(useParams().id)
  const data = useTripDays(tripId)
  return (
    <Page title="Program" back={`/trip/${tripId}`}>
      {data?.days.length === 0 && <p className="muted center">Nastavte u dovolené termín od–do, nebo přidejte první aktivitu.</p>}
      <div className="grid">
        {data?.days.map((d, i) => (
          <Tile key={d} to={`/trip/${tripId}/program/${d}`} emoji={String(i + 1)}
            title={data.trip?.days?.[d]?.label ? `Den ${i + 1} · ${data.trip.days[d].label}` : `Den ${i + 1}`}
            sub={`${fmtDate(d)} · ${data.counts[d]} aktivit`}
            style={data.trip?.days?.[d]?.image ? imageBg(data.trip.days[d].image!) : undefined} />
        ))}
      </div>
    </Page>
  )
}
