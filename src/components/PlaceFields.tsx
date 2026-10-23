import type { Place } from '../db/db'
import { mapLink } from '../lib/links'
import { Field } from './ui'

export function PlaceFields({ place, onChange, label = 'Adresa / název místa' }: {
  place: Place; onChange: (p: Place) => void; label?: string
}) {
  return (
    <>
      <Field label={label}>
        <input value={place.address} onChange={(e) => onChange({ ...place, address: e.target.value })} />
      </Field>
      <Field label="Odkaz z Google Maps (volitelné – sdílený odkaz na místo)">
        <input type="url" value={place.mapUrl ?? ''} onChange={(e) => onChange({ ...place, mapUrl: e.target.value })} />
      </Field>
    </>
  )
}

/** Tlačítko otevírající místo v Google Maps. */
export function MapButton({ place, label = '🗺️ Otevřít v Google Maps' }: { place: Place; label?: string }) {
  if (!place.address && !place.mapUrl) return null
  return <a className="btn" href={mapLink(place)} target="_blank" rel="noreferrer">{label}</a>
}
