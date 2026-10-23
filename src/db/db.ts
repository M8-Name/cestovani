import Dexie, { type Table } from 'dexie'

export interface Place {
  address: string
  /** Volitelný vlastní odkaz z Google Maps (např. sdílený odkaz na místo); jinak se hledá podle adresy. */
  mapUrl?: string
}

/** Příloha uložená v repozitáři (vstupenka, fotka…), cesta relativně ke kořeni aplikace. */
export interface Attachment {
  name: string
  path: string
  type?: string
}

export interface DayMeta {
  label?: string
  image?: string // cesta v repozitáři, např. trips/<slug>/files/den1.jpg
  credit?: string // autor + licence fotky
}

export interface Trip {
  id?: number
  name: string
  destination: string
  from: string // YYYY-MM-DD
  to: string
  cover: string // klíč z COVERS
  image?: string // data URL nebo cesta k obrázku obálky
  /** Volitelný štítek, fotka a atribuce pro dlaždici dne (klíč = YYYY-MM-DD). */
  days?: Record<string, DayMeta>
  slug?: string // jen u cest nasazených z repozitáře (public/trips/<slug>)
  seedVersion?: number
}

export type TransportType = 'flight' | 'train' | 'bus' | 'ferry' | 'other'

export interface Transport {
  id?: number
  tripId: number
  type: TransportType
  carrier: string
  number: string
  fromPlace: string
  toPlace: string
  departAt: string // YYYY-MM-DDTHH:mm
  arriveAt: string
  seat: string
  bookingRef: string
  url: string
  notes: string
  fileIds: number[]
  attachments?: Attachment[]
}

export interface Lodging {
  id?: number
  tripId: number
  name: string
  place: Place
  checkIn: string
  checkOut: string
  bookingRef: string
  phone: string
  url: string
  notes: string
  fileIds: number[]
  attachments?: Attachment[]
}

/** Otevírací doba: index 0 = pondělí … 6 = neděle; "9:00-17:00" nebo "9:00-12:00,13:00-17:00"; prázdné = zavřeno/neznámo */
export type OpeningHours = string[]

export interface Activity {
  id?: number
  tripId: number
  date: string // YYYY-MM-DD
  title: string
  startTime: string // HH:mm
  bookingTime: string // HH:mm – čas na vstupence / rezervaci
  place: Place
  hours: OpeningHours
  url: string
  transit: { line: string; boardAt: string; alightAt: string; note: string }
  notes: string
  fileIds: number[]
  attachments?: Attachment[]
}

export interface Restaurant {
  id?: number
  tripId: number
  name: string
  reservationAt: string // YYYY-MM-DDTHH:mm
  people: number
  bookingRef: string
  place: Place
  phone: string
  url: string
  notes: string
  fileIds: number[]
  attachments?: Attachment[]
}

export interface FileBlob {
  id?: number
  name: string
  type: string
  blob: Blob
}

class TravelDB extends Dexie {
  trips!: Table<Trip, number>
  transports!: Table<Transport, number>
  lodgings!: Table<Lodging, number>
  activities!: Table<Activity, number>
  restaurants!: Table<Restaurant, number>
  files!: Table<FileBlob, number>

  constructor(name = 'cestovani') {
    super(name)
    this.version(1).stores({
      trips: '++id, from',
      transports: '++id, tripId, departAt',
      lodgings: '++id, tripId, checkIn',
      activities: '++id, tripId, date',
      restaurants: '++id, tripId, reservationAt',
      files: '++id',
    })
  }
}

export const db = new TravelDB()

export const emptyPlace = (): Place => ({ address: '' })
export const emptyHours = (): OpeningHours => Array(7).fill('')

export async function deleteTrip(tripId: number) {
  const tables = [db.transports, db.lodgings, db.activities, db.restaurants] as const
  await db.transaction('rw', [db.trips, db.files, ...tables], async () => {
    const fileIds: number[] = []
    for (const t of tables) {
      const rows = await (t as Table<{ fileIds: number[]; tripId: number }, number>)
        .where('tripId').equals(tripId).toArray()
      rows.forEach((r) => fileIds.push(...r.fileIds))
      await (t as Table<unknown, number>).where('tripId').equals(tripId).delete()
    }
    await db.files.bulkDelete(fileIds)
    await db.trips.delete(tripId)
  })
}
