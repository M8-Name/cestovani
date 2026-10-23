import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function Tile({ to, onClick, emoji, title, sub, style }: {
  to?: string; onClick?: () => void; emoji: string; title: string; sub?: string; style?: React.CSSProperties
}) {
  const inner = (
    <>
      <span className="tile-emoji">{emoji}</span>
      <span className="tile-title">{title}</span>
      {sub && <span className="tile-sub">{sub}</span>}
    </>
  )
  return to ? (
    <Link to={to} className="tile" style={style}>{inner}</Link>
  ) : (
    <button type="button" className="tile" onClick={onClick} style={style}>{inner}</button>
  )
}

export function Page({ title, back, actions, children }: {
  title: string; back?: string; actions?: ReactNode; children: ReactNode
}) {
  return (
    <div className="page">
      <header className="bar">
        {back && <Link to={back} className="back" aria-label="Zpět">←</Link>}
        <h1>{title}</h1>
        <div className="bar-actions">{actions}</div>
      </header>
      <main>{children}</main>
    </div>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="ghost" onClick={onClose} aria-label="Zavřít">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

/** Textové/čas/číselné pole svázané se stavem formuláře. */
export function Input<T extends object, K extends keyof T>({ label, form, set, k, type = 'text', ...rest }: {
  label: string; form: T; set: (f: T) => void; k: K; type?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'form'>) {
  return (
    <Field label={label}>
      <input
        {...rest}
        type={type}
        value={String(form[k] ?? '')}
        onChange={(e) => set({ ...form, [k]: type === 'number' ? Number(e.target.value) : e.target.value })}
      />
    </Field>
  )
}

export function TextArea<T extends object, K extends keyof T>({ label, form, set, k }: {
  label: string; form: T; set: (f: T) => void; k: K
}) {
  return (
    <Field label={label}>
      <textarea rows={3} value={String(form[k] ?? '')} onChange={(e) => set({ ...form, [k]: e.target.value })} />
    </Field>
  )
}

export function useForm<T>(initial: T) {
  return useState<T>(initial)
}

export const ExtLink = ({ href, children }: { href: string; children: ReactNode }) =>
  href ? <a href={/^https?:\/\//.test(href) ? href : 'https://' + href} target="_blank" rel="noreferrer">{children}</a> : null
