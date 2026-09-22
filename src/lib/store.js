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
