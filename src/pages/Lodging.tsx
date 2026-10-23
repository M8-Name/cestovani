import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, emptyPlace, type Lodging as L } from '../db/db'
import { fmtDateTime } from '../lib/format'
import { ExtLink, Input, Modal, Page, TextArea } from '../components/ui'
import { FileEditor, FileList } from '../components/FileAttachments'
import { PlaceFields, MapButton } from '../components/PlaceFields'

export function Lodging() {
  const tripId = Number(useParams().id)
  const items = useLiveQuery(() => db.lodgings.where('tripId').equals(tripId).sortBy('checkIn'), [tripId])
  const [form, setForm] = useState<L | null>(null)
  const blank = (): L => ({ tripId, name: '', place: emptyPlace(), checkIn: '', checkOut: '', bookingRef: '', phone: '', url: '', notes: '', fileIds: [] })

  return (
    <Page title="Ubytování" back={`/trip/${tripId}`} actions={<button className="primary" onClick={() => setForm(blank())}>＋ Přidat</button>}>
      {items?.map((l) => (
        <article key={l.id} className="card" onClick={() => setForm(l)}>
          <h3>🏨 {l.name}</h3>
          <p>{l.place.address}</p>
          <p>Check-in: <b>{fmtDateTime(l.checkIn)}</b><br />Check-out: <b>{fmtDateTime(l.checkOut)}</b></p>
          <p className="muted">{[l.bookingRef && `Rezervace: ${l.bookingRef}`, l.phone && `Tel: ${l.phone}`].filter(Boolean).join(' · ')}</p>
          {l.notes && <p>{l.notes}</p>}
          <div onClick={(e) => e.stopPropagation()}>
            <span className="links"><ExtLink href={l.url}>🔗 Web</ExtLink><MapButton place={l.place} /></span>
            <FileList ids={l.fileIds} attachments={l.attachments} />
          </div>
        </article>
      ))}
      {items?.length === 0 && <p className="muted center">Zatím žádné ubytování.</p>}

      {form && (
        <Modal title={form.id ? 'Upravit ubytování' : 'Nové ubytování'} onClose={() => setForm(null)}>
          <form onSubmit={async (e) => { e.preventDefault(); await db.lodgings.put(form); setForm(null) }}>
            <Input label="Název" form={form} set={setForm} k="name" required />
            <PlaceFields place={form.place} onChange={(place) => setForm({ ...form, place })} />
            <div className="row">
              <Input label="Check-in" type="datetime-local" form={form} set={setForm} k="checkIn" />
              <Input label="Check-out" type="datetime-local" form={form} set={setForm} k="checkOut" />
            </div>
            <div className="row">
              <Input label="Číslo rezervace" form={form} set={setForm} k="bookingRef" />
              <Input label="Telefon" type="tel" form={form} set={setForm} k="phone" />
            </div>
            <Input label="Odkaz na web" type="url" form={form} set={setForm} k="url" />
            <TextArea label="Poznámky (kód od dveří, parkování…)" form={form} set={setForm} k="notes" />
            <FileEditor ids={form.fileIds} onChange={(fileIds) => setForm({ ...form, fileIds })} />
            <div className="actions">
              {form.id && <button type="button" className="danger" onClick={async () => { if (confirm('Smazat?')) { await db.files.bulkDelete(form.fileIds); await db.lodgings.delete(form.id!); setForm(null) } }}>Smazat</button>}
              <button type="submit" className="primary">Uložit</button>
            </div>
          </form>
        </Modal>
      )}
    </Page>
  )
}
