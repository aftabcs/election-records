/** localStorage-backed store for the election records (swap for a real API later). */
import { ELECTION_SEED } from '../data/electionData.js'

const KEY = 'er.records.v1'

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}
function write(v) { localStorage.setItem(KEY, JSON.stringify(v)) }

export function getElectionRecords() {
  const saved = read()
  if (Array.isArray(saved) && saved.length) return saved
  const seed = structuredClone(ELECTION_SEED)
  write(seed)
  return seed
}
export function saveElectionRecords(records) { write(records); return records }
export function resetElectionRecords() { const seed = structuredClone(ELECTION_SEED); write(seed); return seed }
export function exportElectionRecordsJSON() { return JSON.stringify(getElectionRecords(), null, 2) }

// --- Admin: add / edit / delete a booth --------------------------------------
export function upsertBooth(record, prevBooth) {
  const list = getElectionRecords()
  const key = prevBooth ?? record.booth
  const i = list.findIndex((b) => b.booth === key)
  if (i >= 0) list[i] = record
  else list.push(record)
  return saveElectionRecords(list)
}
export function deleteBooth(booth) {
  return saveElectionRecords(getElectionRecords().filter((b) => b.booth !== booth))
}

/**
 * Merge imported records into the existing set (add a new election without losing
 * the others): matched by booth, incoming years are added/updated, name/village
 * filled if missing; unseen booths are appended.
 */
export function mergeElectionRecords(incoming) {
  const byBooth = new Map(getElectionRecords().map((b) => [b.booth, b]))
  for (const inc of incoming) {
    const cur = byBooth.get(inc.booth)
    if (cur) {
      cur.years = { ...cur.years, ...inc.years }
      if (inc.name && !cur.name) cur.name = inc.name
      if (inc.village && !cur.village) cur.village = inc.village
    } else {
      byBooth.set(inc.booth, inc)
    }
  }
  return saveElectionRecords([...byBooth.values()])
}

// --- Admin: election-year labels (e.g. 2022 → "2022 Vidhan Sabha") ------------
const META_KEY = 'er.meta.v1'
export function getElectionLabels() {
  try { return JSON.parse(localStorage.getItem(META_KEY)) || {} } catch { return {} }
}
export function saveElectionLabels(map) { localStorage.setItem(META_KEY, JSON.stringify(map)); return { ...map } }

// --- Karyakarta's own booth ("login" = the booth they've chosen) --------------
const MY_BOOTH_KEY = 'er.myBooth.v1'
export function getMyBooth() { return localStorage.getItem(MY_BOOTH_KEY) || null }
export function saveMyBooth(booth) { localStorage.setItem(MY_BOOTH_KEY, booth); return booth }
export function clearMyBooth() { localStorage.removeItem(MY_BOOTH_KEY) }
