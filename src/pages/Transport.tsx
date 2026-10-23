import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Transport as T, type TransportType } from '../db/db'
import { fmtDateTime } from '../lib/format'
import { ExtLink, Field, Input, Modal, Page, TextArea } from '../components/ui'
import { FileEditor, FileList } from '../components/FileAttachments'

const TYPES: Record<TransportType, string> = { flight: '✈️ Letenka', train: '🚆 Vlak', bus: '🚌 Autobus', ferry: '⛴️ Loď', other: '🎫 Jiné' }

export function Transport() {
  const tripId = Number(useParams().id)
  const items = useLiveQuery(() => db.transports.where('tripId').equals(tripId).sortBy('departAt'), [tripId])
  const [form, setForm] = useState<T | null>(null)
  const blank = (): T => ({ tripId, type: 'flight', carrier: '', number: '', fromPlace: '', toPlace: '', departAt: '', arriveAt: '', seat: '', bookingRef: '', url: '', notes: '', fileIds: [] })

  return (
    <Page title="Letenky / jízdenky" back={`/trip/${tripId}`} actions={<button className="primary" onClick={() => setForm(blank())}>＋ Přidat</button>}>
      {items?.map((t) => (
        <article key={t.id} className="card" onClick={() => setForm(t)}>
          <h3>{TYPES[t.type]} · {t.fromPlace} → {t.toPlace}</h3>
          <p><b>{t.carrier} {t.number}</b></p>
          <p>Odjezd/odlet: {fmtDateTime(t.departAt)}<br />Příjezd/přílet: {fmtDateTime(t.arriveAt)}</p>
          <p className="muted">{[t.seat && `Místo: ${t.seat}`, t.bookingRef && `Rezervace: ${t.bookingRef}`].filter(Boolean).join(' · ')}</p>
          {t.notes && <p>{t.notes}</p>}
          <div onClick={(e) => e.stopPropagation()}><ExtLink href={t.url}>🔗 Web / odbavení</ExtLink></div>
          <div onClick={(e) => e.stopPropagation()}><FileList ids={t.fileIds} attachments={t.attachments} /></div>
        </article>
      ))}
      {items?.length === 0 && <p className="muted center">Zatím žádná letenka ani jízdenka.</p>}

      {form && (
        <Modal title={form.id ? 'Upravit' : 'Nová letenka / jízdenka'} onClose={() => setForm(null)}>
          <form onSubmit={async (e) => { e.preventDefault(); await db.transports.put(form); setForm(null) }}>
            <Field label="Typ">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TransportType })}>
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <div className="row">
              <Input label="Dopravce" form={form} set={setForm} k="carrier" />
              <Input label="Číslo spoje" form={form} set={setForm} k="number" />
            </div>
            <div className="row">
              <Input label="Odkud" form={form} set={setForm} k="fromPlace" required />
              <Input label="Kam" form={form} set={setForm} k="toPlace" required />
            </div>
            <div className="row">
              <Input label="Odjezd / odlet" type="datetime-local" form={form} set={setForm} k="departAt" />
              <Input label="Příjezd / přílet" type="datetime-local" form={form} set={setForm} k="arriveAt" />
            </div>
            <div className="row">
              <Input label="Sedadlo / vůz" form={form} set={setForm} k="seat" />
              <Input label="Číslo rezervace" form={form} set={setForm} k="bookingRef" />
            </div>
            <Input label="Odkaz (web, odbavení)" type="url" form={form} set={setForm} k="url" />
            <TextArea label="Poznámky" form={form} set={setForm} k="notes" />
            <FileEditor ids={form.fileIds} onChange={(fileIds) => setForm({ ...form, fileIds })} />
            <div className="actions">
              {form.id && <button type="button" className="danger" onClick={async () => { if (confirm('Smazat?')) { await db.files.bulkDelete(form.fileIds); await db.transports.delete(form.id!); setForm(null) } }}>Smazat</button>}
              <button type="submit" className="primary">Uložit</button>
            </div>
          </form>
        </Modal>
      )}
    </Page>
  )
}
