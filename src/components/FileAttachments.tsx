import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Attachment } from '../db/db'

const resolve = (path: string) => new URL(path, document.baseURI).href
const isImage = (type = '', name = '') => type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(name)

function openFile(id: number) {
  db.files.get(id).then((f) => {
    if (!f) return
    const url = URL.createObjectURL(f.blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  })
}

function Thumb({ id }: { id: number }) {
  const f = useLiveQuery(() => db.files.get(id), [id])
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!f || !f.type.startsWith('image/')) return
    const u = URL.createObjectURL(f.blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [f])
  if (!f) return null
  return (
    <button type="button" className="file" onClick={() => openFile(id)} title={f.name}>
      {url ? <img src={url} alt="" /> : <span>{f.type === 'application/pdf' ? '📄' : '📎'}</span>}
      <small>{f.name}</small>
    </button>
  )
}

function StaticFile({ a }: { a: Attachment }) {
  const href = resolve(a.path)
  return (
    <a className="file" href={href} target="_blank" rel="noreferrer" title={a.name}>
      {isImage(a.type, a.path) ? <img src={href} alt={a.name} loading="lazy" /> : <span>{/pdf$/i.test(a.path) ? '📄' : '📎'}</span>}
      <small>{a.name}</small>
    </a>
  )
}

/** Přílohy: soubory z repozitáře (offline v PWA cache) + soubory přidané v prohlížeči. */
export function FileList({ ids = [], attachments = [] }: { ids?: number[]; attachments?: Attachment[] }) {
  if (!ids.length && !attachments.length) return null
  return (
    <div className="files">
      {attachments.map((a) => <StaticFile key={a.path} a={a} />)}
      {ids.map((id) => <Thumb key={id} id={id} />)}
    </div>
  )
}

/** Editace příloh ve formuláři – soubory se ukládají hned do IndexedDB (jen v tomto zařízení). */
export function FileEditor({ ids, onChange }: { ids: number[]; onChange: (ids: number[]) => void }) {
  const add = async (list: FileList | null) => {
    if (!list) return
    const added: number[] = []
    for (const f of Array.from(list)) added.push(await db.files.add({ name: f.name, type: f.type, blob: f }))
    onChange([...ids, ...added])
  }
  const remove = async (id: number) => {
    await db.files.delete(id)
    onChange(ids.filter((x) => x !== id))
  }
  return (
    <div className="field">
      <span>Přidat přílohu jen v tomto zařízení (vstupenky, PDF, fotky) – do zálohy se zahrnou</span>
      <input type="file" multiple accept="image/*,application/pdf" onChange={(e) => { add(e.target.files); e.target.value = '' }} />
      <div className="files">
        {ids.map((id) => (
          <div key={id} className="file-edit">
            <Thumb id={id} />
            <button type="button" className="ghost" onClick={() => remove(id)} aria-label="Odebrat přílohu">🗑</button>
          </div>
        ))}
      </div>
    </div>
  )
}
