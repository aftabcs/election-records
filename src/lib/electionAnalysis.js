/**
 * Booth-level election analysis: derive per-year winners + margins from raw
 * vote counts, and classify each booth as swing / consistent (safe) / leaning.
 */
import { PARTY_META, MAJOR_PARTIES } from '../data/electionData.js'

const MARGIN_THRESHOLD = 10 // % — below this, a "consistent" booth is "leaning"

export const partyLabel = (key) => PARTY_META[key]?.label || key
export const partyColor = (key) => PARTY_META[key]?.color || '#94a3b8'

/** Collapse a year's raw votes to major parties + a single "Others" bucket. */
export function normalizeVotes(votes) {
  const out = {}
  let others = 0
  for (const [p, v] of Object.entries(votes || {})) {
    const n = Number(v) || 0
    if (MAJOR_PARTIES.includes(p)) out[p] = (out[p] || 0) + n
    else others += n
  }
  if (others) out.Others = others
  return out
}

/** Columns to show: major parties present in the data (in canonical order) + Others. */
export function allParties(records) {
  const present = new Set()
  let hasOthers = false
  for (const b of records) {
    for (const y of Object.values(b.years || {})) {
      const n = normalizeVotes(y)
      Object.keys(n).forEach((p) => { if (p === 'Others') hasOthers = true; else present.add(p) })
    }
  }
  const majors = MAJOR_PARTIES.filter((k) => present.has(k))
  return hasOthers ? [...majors, 'Others'] : majors
}

/** Per-year ranking + winner + margin for one booth, plus its classification. */
export function analyzeBooth(booth) {
  const years = Object.keys(booth.years || {}).sort()
  const perYear = years.map((year) => {
    const votes = normalizeVotes(booth.years[year] || {})
    const ranking = Object.entries(votes)
      .map(([party, v]) => ({ party, votes: Number(v) || 0 }))
      .sort((a, b) => b.votes - a.votes)
    const total = ranking.reduce((s, r) => s + r.votes, 0)
    const winner = ranking[0] || { party: '—', votes: 0 }
    const runnerUp = ranking[1] || { party: '—', votes: 0 }
    const marginVotes = winner.votes - runnerUp.votes
    const marginPct = total ? (marginVotes / total) * 100 : 0
    return { year, votes, ranking, total, winner: winner.party, runnerUp: runnerUp.party, marginVotes, marginPct }
  })

  const winners = perYear.map((p) => p.winner)
  const flipped = new Set(winners).size > 1
  const minMarginPct = perYear.length ? Math.min(...perYear.map((p) => p.marginPct)) : 0

  const counts = {}
  winners.forEach((w) => { counts[w] = (counts[w] || 0) + 1 })
  const dominantParty = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  let tag = 'safe'
  if (flipped) tag = 'swing'
  else if (minMarginPct < MARGIN_THRESHOLD) tag = 'leaning'

  return { years, perYear, winners, flipped, minMarginPct, dominantParty, tag }
}

/** Colour the winner↔runner-up gap: knife-edge (<5%) → close (<10%) → comfortable. */
export function marginTone(pct) {
  if (pct < 5) return { bg: 'bg-rose-100', text: 'text-rose-700', dot: '#e11d48', level: 'tight' }
  if (pct < 10) return { bg: 'bg-amber-100', text: 'text-amber-700', dot: '#f5b70a', level: 'close' }
  return { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: '#2f9e44', level: 'safe' }
}

export const TAG_META = {
  swing: { color: '#f26a1b', bg: 'bg-orange-100', text: 'text-orange-700' },
  leaning: { color: '#f5b70a', bg: 'bg-amber-100', text: 'text-amber-700' },
  safe: { color: '#2f9e44', bg: 'bg-emerald-100', text: 'text-emerald-700' },
}

export function summarize(records) {
  const out = { total: records.length, swing: 0, leaning: 0, safe: 0 }
  for (const b of records) out[analyzeBooth(b).tag]++
  return out
}
