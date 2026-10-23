import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, emptyPlace, type Restaurant as R } from '../db/db'
import { fmtDateTime } from '../lib/format'
import { ExtLink, Input, Modal, Page, TextArea } from '../components/ui'
import { FileEditor, FileList } from '../components/FileAttachments'
import { PlaceFields, MapButton } from '../components/PlaceFields'

export function Restaurants() {
  const tripId = Number(useParams().id)
  const items = useLiveQuery(() => db.restaurants.where('tripId').equals(tripId).sortBy('reservationAt'), [tripId])
  const [form, setForm] = useState<R | null>(null)
  const blank = (): R => ({ tripId, name: '', reservationAt: '', people: 2, bookingRef: '', place: emptyPlace(), phone: '', url: '', notes: '', fileIds: [] })

  return (
    <Page title="Restaurace" back={`/trip/${tripId}`} actions={<button className="primary" onClick={() => setForm(blank())}>＋ Přidat</button>}>
      {items?.map((r) => (
        <article key={r.id} className="card" onClick={() => setForm(r)}>
          <h3>🍽️ {r.name}</h3>
          <p>{r.reservationAt ? <>Rezervace: <b>{fmtDateTime(r.reservationAt)}</b> · {r.people} os.</> : 'Bez rezervace'}</p>
          <p>{r.place.address}</p>
          <p className="muted">{[r.bookingRef && `Č. rezervace: ${r.bookingRef}`, r.phone && `Tel: ${r.phone}`].filter(Boolean).join(' · ')}</p>
          {r.notes && <p>{r.notes}</p>}
          <div onClick={(e) => e.stopPropagation()}>
            <span className="links"><ExtLink href={r.url}>🔗 Web</ExtLink><MapButton place={r.place} /></span>
            <FileList ids={r.fileIds} attachments={r.attachments} />
          </div>
        </article>
      ))}
      {items?.length === 0 && <p className="muted center">Zatím žádné restaurace.</p>}

      {form && (
        <Modal title={form.id ? 'Upravit restauraci' : 'Nová restaurace'} onClose={() => setForm(null)}>
          <form onSubmit={async (e) => { e.preventDefault(); await db.restaurants.put(form); setForm(null) }}>
            <Input label="Název" form={form} set={setForm} k="name" required />
            <PlaceFields place={form.place} onChange={(place) => setForm({ ...form, place })} />
            <div className="row">
              <Input label="Datum a čas rezervace" type="datetime-local" form={form} set={setForm} k="reservationAt" />
              <Input label="Počet osob" type="number" min={1} form={form} set={setForm} k="people" />
            </div>
            <div className="row">
              <Input label="Číslo rezervace" form={form} set={setForm} k="bookingRef" />
              <Input label="Telefon" type="tel" form={form} set={setForm} k="phone" />
            </div>
            <Input label="Odkaz na web" type="url" form={form} set={setForm} k="url" />
            <TextArea label="Poznámky" form={form} set={setForm} k="notes" />
            <FileEditor ids={form.fileIds} onChange={(fileIds) => setForm({ ...form, fileIds })} />
            <div className="actions">
              {form.id && <button type="button" className="danger" onClick={async () => { if (confirm('Smazat?')) { await db.files.bulkDelete(form.fileIds); await db.restaurants.delete(form.id!); setForm(null) } }}>Smazat</button>}
              <button type="submit" className="primary">Uložit</button>
            </div>
          </form>
        </Modal>
      )}
    </Page>
  )
}
