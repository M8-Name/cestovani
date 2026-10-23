import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, emptyHours, emptyPlace, type Activity } from '../db/db'
import { fmtDate, fmtDateTime } from '../lib/format'
import { openState } from '../lib/hours'
import { dayRouteLink, transitLink } from '../lib/links'
import { ExtLink, Input, Modal, Page, TextArea } from '../components/ui'
import { FileEditor, FileList } from '../components/FileAttachments'
import { MapButton, PlaceFields } from '../components/PlaceFields'
import { useTripDays } from './Program'
import { imageBg } from './Home'

const WD = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

interface Item { key: string; time: string; icon: string; title: string; address: string; body: ReactNode }

export function Day() {
  const { id, date = '' } = useParams()
  const tripId = Number(id)
  const info = useTripDays(tripId)
  const acts = useLiveQuery(() => db.activities.where({ tripId, date }).toArray(), [tripId, date])
  const rests = useLiveQuery(() => db.restaurants.where('tripId').equals(tripId).filter((r) => r.reservationAt.startsWith(date)).toArray(), [tripId, date])
  const trans = useLiveQuery(() => db.transports.where('tripId').equals(tripId).filter((t) => t.departAt.startsWith(date)).toArray(), [tripId, date])
  const [form, setForm] = useState<Activity | null>(null)
  const dayNo = (info?.days.indexOf(date) ?? -1) + 1

  const items: Item[] = [
    ...(trans ?? []).map((t): Item => ({
      key: 't' + t.id, time: t.departAt.slice(11, 16), icon: t.type === 'flight' ? '✈️' : '🚆',
      title: `${t.carrier} ${t.number}: ${t.fromPlace} → ${t.toPlace}`, address: t.fromPlace,
      body: (
        <>
          <p>Odjezd {fmtDateTime(t.departAt)}, příjezd {fmtDateTime(t.arriveAt)}</p>
          {t.seat && <p>Místo: {t.seat}</p>}{t.bookingRef && <p>Rezervace: <b>{t.bookingRef}</b></p>}
          <FileList ids={t.fileIds} attachments={t.attachments} />
          <Link to={`/trip/${tripId}/transport`}>Detail v sekci Letenky / jízdenky →</Link>
        </>
      ),
    })),
    ...(rests ?? []).map((r): Item => ({
      key: 'r' + r.id, time: r.reservationAt.slice(11, 16), icon: '🍽️', title: `Rezervace: ${r.name}`, address: r.place.address,
      body: (
        <>
          <p>{r.people} os.{r.bookingRef && <> · č. rezervace <b>{r.bookingRef}</b></>}{r.phone && <> · tel. {r.phone}</>}</p>
          {r.notes && <p>{r.notes}</p>}
          <p className="links"><MapButton place={r.place} /><ExtLink href={r.url}>🔗 Web</ExtLink></p>
          <FileList ids={r.fileIds} attachments={r.attachments} />
        </>
      ),
    })),
    ...(acts ?? []).map((a): Item => ({ key: 'a' + a.id, time: a.startTime, icon: '📍', title: a.title, address: a.place.address, body: null })),
  ].sort((x, y) => (x.time || '99').localeCompare(y.time || '99'))

  const route = dayRouteLink(items.map((i) => i.address))
  const blank = (): Activity => ({
    tripId, date, title: '', startTime: '', bookingTime: '', place: emptyPlace(), hours: emptyHours(), url: '',
    transit: { line: '', boardAt: '', alightAt: '', note: '' }, notes: '', fileIds: [],
  })

  return (
    <Page
      title={`Den ${dayNo || ''} · ${fmtDate(date)}`}
      back={`/trip/${tripId}/program`}
      actions={<button className="primary" onClick={() => setForm(blank())}>＋ Aktivita</button>}
    >
      {info?.trip?.days?.[date]?.image && (
        <section className="hero" style={imageBg(info.trip.days[date].image!)}>
          <strong>{info.trip.days[date].label}</strong>
        </section>
      )}
      {route && <p><a className="btn" href={route} target="_blank" rel="noreferrer">🗺️ Trasa celého dne v Google Maps</a></p>}
      {items.length === 0 && <p className="muted center">Na tento den zatím nic není.</p>}
      <ol className="timeline">
        {items.map((it, idx) => {
          const a = it.key.startsWith('a') ? acts?.find((x) => 'a' + x.id === it.key) : undefined
          const prev = items.slice(0, idx).reverse().find((p) => p.address)
          return (
            <li key={it.key}>
              <details>
                <summary>
                  <span className="time">{it.time || '—'}</span> <span>{it.icon} {it.title}</span>
                </summary>
                <div className="detail">
                  {a ? <ActivityDetail a={a} from={prev?.address} onEdit={() => setForm(a)} /> : it.body}
                </div>
              </details>
            </li>
          )
        })}
      </ol>

      {info?.trip?.days?.[date]?.credit && <p className="muted"><small>Foto: {info.trip.days[date].credit}</small></p>}

      {form && (
        <Modal title={form.id ? 'Upravit aktivitu' : 'Nová aktivita'} onClose={() => setForm(null)}>
          <form onSubmit={async (e) => { e.preventDefault(); await db.activities.put(form); setForm(null) }}>
            <Input label="Název" form={form} set={setForm} k="title" required autoFocus />
            <div className="row">
              <Input label="Den" type="date" form={form} set={setForm} k="date" required />
              <Input label="Čas" type="time" form={form} set={setForm} k="startTime" />
              <Input label="Booking na" type="time" form={form} set={setForm} k="bookingTime" />
            </div>
            <PlaceFields place={form.place} onChange={(place) => setForm({ ...form, place })} />
            <Input label="Odkaz na web" type="url" form={form} set={setForm} k="url" />
            <fieldset>
              <legend>Otevírací doba (např. 9:00-17:00 nebo 9:00-12:00,13:00-17:00)</legend>
              <button type="button" className="ghost" onClick={() => setForm({ ...form, hours: Array(7).fill(form.hours[0]) })}>Po → zkopírovat na všechny dny</button>
              {WD.map((d, i) => (
                <label key={d} className="hrow"><b>{d}</b>
                  <input value={form.hours[i] ?? ''} placeholder="zavřeno / neuvedeno" onChange={(e) => setForm({ ...form, hours: form.hours.map((h, j) => (j === i ? e.target.value : h)) })} />
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>MHD</legend>
              <Input label="Linka" form={form.transit} set={(transit) => setForm({ ...form, transit })} k="line" />
              <Input label="Kde nastoupit (zastávka)" form={form.transit} set={(transit) => setForm({ ...form, transit })} k="boardAt" />
              <Input label="Kde vystoupit (zastávka)" form={form.transit} set={(transit) => setForm({ ...form, transit })} k="alightAt" />
              <TextArea label="Poznámka (přestup, výstup, jízdenka…)" form={form.transit} set={(transit) => setForm({ ...form, transit })} k="note" />
            </fieldset>
            <TextArea label="Poznámky" form={form} set={setForm} k="notes" />
            <FileEditor ids={form.fileIds} onChange={(fileIds) => setForm({ ...form, fileIds })} />
            <div className="actions">
              {form.id && <button type="button" className="danger" onClick={async () => { if (confirm('Smazat?')) { await db.files.bulkDelete(form.fileIds); await db.activities.delete(form.id!); setForm(null) } }}>Smazat</button>}
              <button type="submit" className="primary">Uložit</button>
            </div>
          </form>
        </Modal>
      )}
    </Page>
  )
}

function ActivityDetail({ a, from, onEdit }: { a: Activity; from?: string; onEdit: () => void }) {
  const st = a.startTime ? openState(a.hours, a.date, a.startTime) : 'unknown'
  const bk = a.bookingTime ? openState(a.hours, a.date, a.bookingTime) : 'unknown'
  const t = a.transit
  const hasHours = a.hours.some((h) => h)
  return (
    <>
      {a.place.address && <p>{a.place.address}</p>}
      <p className="links">
        <MapButton place={a.place} />
        {(t.boardAt && t.alightAt)
          ? <a className="btn" href={transitLink(t.boardAt, t.alightAt)} target="_blank" rel="noreferrer">🚇 MHD v Google Maps</a>
          : from && a.place.address && <a className="btn" href={transitLink(from, a.place.address)} target="_blank" rel="noreferrer">🚇 MHD z předchozího bodu</a>}
        <ExtLink href={a.url}>🔗 Web</ExtLink>
      </p>
      {a.bookingTime && <p>🎫 Booking na <b>{a.bookingTime}</b></p>}
      {bk === 'closed' && <p className="badge closed">⚠ Čas bookingu je mimo otevírací dobu</p>}
      {st !== 'unknown' && <p className={'badge ' + st}>{st === 'open' ? 'V čase návštěvy otevřeno' : 'V čase návštěvy zavřeno!'}</p>}
      {hasHours && (
        <div><b>Otevírací doba</b>
          <ul className="plain">{a.hours.map((h, i) => <li key={i}><b>{WD[i]}</b> {h || 'zavřeno / neuvedeno'}</li>)}</ul>
        </div>
      )}
      {(t.line || t.boardAt || t.alightAt || t.note) && (
        <div className="transit">
          <b>🚇 MHD{t.line && ` – linka ${t.line}`}</b>
          {t.boardAt && <div>Nastoupit: {t.boardAt}</div>}
          {t.alightAt && <div>Vystoupit: {t.alightAt}</div>}
          {t.note && <div className="muted">{t.note}</div>}
        </div>
      )}
      {a.notes && <p>{a.notes}</p>}
      <FileList ids={a.fileIds} attachments={a.attachments} />
      <p><button type="button" onClick={onEdit}>✏️ Upravit</button></p>
    </>
  )
}
