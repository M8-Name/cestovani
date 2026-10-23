const dtf = new Intl.DateTimeFormat('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' })
const tf = new Intl.DateTimeFormat('cs-CZ', { hour: '2-digit', minute: '2-digit' })

export const fmtDate = (d: string) => (d ? dtf.format(new Date(d + 'T12:00:00')) : '')
export const fmtDateTime = (dt: string) => (dt ? `${dtf.format(new Date(dt))} ${tf.format(new Date(dt))}` : '')

export function daysBetween(from: string, to: string): string[] {
  const out: string[] = []
  if (!from || !to) return out
  const d = new Date(from + 'T12:00:00')
  const end = new Date(to + 'T12:00:00')
  while (d <= end && out.length < 120) {
    out.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  return out
}

export function daysUntil(date: string): number {
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T12:00:00')
  return Math.round((new Date(date + 'T12:00:00').getTime() - today.getTime()) / 86400000)
}
