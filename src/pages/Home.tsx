import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteTrip, type Trip } from '../db/db'
import { COVERS } from '../lib/covers'
import { fmtDate } from '../lib/format'
import { exportAll, importAll } from '../lib/backup'
import { Input, Modal, Page, Tile } from '../components/ui'

const blank = (): Trip => ({ name: '', destination: '', from: '', to: '', cover: 'city' })

export function imageBg(src: string): React.CSSProperties {
  const url = /^(data|https?):/.test(src) ? src : new URL(src, document.baseURI).href
  return { backgroundImage: `linear-gradient(rgba(0,0,0,.15),rgba(0,0,0,.6)),url("${url}")`, backgroundSize: 'cover', backgroundPosition: 'center', color: '#fff' }
}

export function tripStyle(t: Trip): React.CSSProperties {
  return t.image ? imageBg(t.image) : { background: (COVERS[t.cover] ?? COVERS.city).bg, color: '#fff' }
}

const readImage = (f: File) =>
  new Promise<string>((res) => {
    const img = new Image()
    img.onload = () => {
      const s = Math.min(1, 640 / img.width)
      const c = document.createElement('canvas')
      c.width = img.width * s; c.height = img.height * s
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      res(c.toDataURL('image/jpeg', 0.8))
    }
    img.src = URL.createObjectURL(f)
  })

export function Home() {
  const trips = useLiveQuery(() => db.trips.orderBy('from').toArray(), [])
  const [form, setForm] = useState<Trip | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const save = async () => {
    if (!form || !form.name.trim()) return
    await db.trips.put(form)
    setForm(null)
  }
  const doExport = async () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(await exportAll())
    a.download = `cestovani-zaloha-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }
  const doImport = async (f?: File) => {
    if (!f || !confirm('Import nahradí všechna současná data. Pokračovat?')) return
    try { await importAll(await f.text()) } catch (e) { alert((e as Error).message) }
  }

  return (
    <Page
      title="🧭 Moje cesty"
      actions={
        <>
          <button className="ghost" onClick={doExport} title="Zálohovat do souboru">⬇ Záloha</button>
          <button className="ghost" onClick={() => importRef.current?.click()} title="Obnovit ze zálohy">⬆ Import</button>
          <input ref={importRef} type="file" accept="application/json" hidden onChange={(e) => { doImport(e.target.files?.[0]); e.target.value = '' }} />
        </>
      }
    >
      <div className="grid">
        {trips?.map((t) => (
          <Tile
            key={t.id}
            to={`/trip/${t.id}`}
            emoji={(COVERS[t.cover] ?? COVERS.city).emoji}
            title={t.name}
            sub={[t.destination, t.from && `${fmtDate(t.from)}${t.to ? ' – ' + fmtDate(t.to) : ''}`].filter(Boolean).join(' · ')}
            style={tripStyle(t)}
          />
        ))}
        <Tile onClick={() => setForm(blank())} emoji="＋" title="Nová dovolená" sub="Vyberte typ a zadejte termín" style={{ background: 'var(--surface)', border: '2px dashed var(--line)' }} />
      </div>
      {trips?.length === 0 && <p className="muted center">Zatím žádná dovolená – založte první dlaždicí „Nová dovolená".</p>}

      {form && (
        <Modal title={form.id ? 'Upravit dovolenou' : 'Nová dovolená'} onClose={() => setForm(null)}>
          <form onSubmit={(e) => { e.preventDefault(); save() }}>
            <div className="cover-picker">
              {Object.entries(COVERS).map(([k, c]) => (
                <button type="button" key={k} className={'cover' + (form.cover === k && !form.image ? ' sel' : '')} style={{ background: c.bg }}
                  onClick={() => setForm({ ...form, cover: k, image: undefined })}>
                  <span>{c.emoji}</span><small>{c.label}</small>
                </button>
              ))}
            </div>
            <label className="field"><span>…nebo vlastní obrázek</span>
              <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setForm({ ...form, image: await readImage(f) }) }} />
            </label>
            <Input label="Název" form={form} set={setForm} k="name" required autoFocus />
            <Input label="Destinace" form={form} set={setForm} k="destination" />
            <div className="row">
              <Input label="Od" type="date" form={form} set={setForm} k="from" />
              <Input label="Do" type="date" form={form} set={setForm} k="to" min={form.from} />
            </div>
            <div className="actions">
              {form.id && <button type="button" className="danger" onClick={async () => { if (confirm('Smazat dovolenou včetně všech dat?')) { await deleteTrip(form.id!); setForm(null) } }}>Smazat</button>}
              <button type="submit" className="primary">Uložit</button>
            </div>
          </form>
        </Modal>
      )}
    </Page>
  )
}
