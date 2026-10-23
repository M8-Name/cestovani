import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { COVERS } from '../lib/covers'
import { daysUntil, fmtDate, fmtDateTime } from '../lib/format'
import { Page, Tile } from '../components/ui'
import { tripStyle } from './Home'

export function TripHome() {
  const id = Number(useParams().id)
  const trip = useLiveQuery(() => db.trips.get(id), [id])
  const counts = useLiveQuery(async () => ({
    t: await db.transports.where('tripId').equals(id).count(),
    l: await db.lodgings.where('tripId').equals(id).count(),
    a: await db.activities.where('tripId').equals(id).count(),
    r: await db.restaurants.where('tripId').equals(id).count(),
  }), [id])
  const next = useLiveQuery(async () => {
    const now = new Date().toISOString().slice(0, 16)
    const [t, r, a] = await Promise.all([
      db.transports.where('tripId').equals(id).toArray(),
      db.restaurants.where('tripId').equals(id).toArray(),
      db.activities.where('tripId').equals(id).toArray(),
    ])
    return [
      ...t.map((x) => ({ at: x.departAt, label: `${x.type === 'flight' ? '✈' : '🚆'} ${x.carrier} ${x.number} ${x.fromPlace} → ${x.toPlace}` })),
      ...r.map((x) => ({ at: x.reservationAt, label: `🍽 ${x.name}` })),
      ...a.filter((x) => x.bookingTime).map((x) => ({ at: `${x.date}T${x.bookingTime}`, label: `🎫 ${x.title} (booking)` })),
    ].filter((e) => e.at >= now).sort((x, y) => x.at.localeCompare(y.at)).slice(0, 3)
  }, [id])

  if (!trip) return <Page title="…" back="/">{trip === undefined ? null : <p>Dovolená nenalezena.</p>}</Page>
  const left = trip.from ? daysUntil(trip.from) : null
  const base = `/trip/${id}`
  return (
    <Page title={`${(COVERS[trip.cover] ?? COVERS.city).emoji} ${trip.name}`} back="/">
      <section className="hero" style={tripStyle(trip)}>
        <div>{trip.destination}</div>
        <div>{fmtDate(trip.from)}{trip.to && ' – ' + fmtDate(trip.to)}</div>
        {left != null && left > 0 && <strong>Za {left} dní</strong>}
        {left != null && left <= 0 && trip.to && daysUntil(trip.to) >= 0 && <strong>Právě probíhá 🎉</strong>}
      </section>
      <div className="grid">
        <Tile to={`${base}/transport`} emoji="✈️" title="Letenky / jízdenky" sub={`${counts?.t ?? 0} položek`} />
        <Tile to={`${base}/lodging`} emoji="🏨" title="Ubytování" sub={`${counts?.l ?? 0} položek`} />
        <Tile to={`${base}/program`} emoji="📅" title="Program" sub={`${counts?.a ?? 0} aktivit`} />
        <Tile to={`${base}/restaurants`} emoji="🍽️" title="Restaurace" sub={`${counts?.r ?? 0} rezervací`} />
      </div>
      {!!next?.length && (
        <section className="card">
          <h3>Nejbližší</h3>
          <ul className="plain">{next.map((e, i) => <li key={i}><b>{fmtDateTime(e.at)}</b> – {e.label}</li>)}</ul>
        </section>
      )}
    </Page>
  )
}
