import { useMemo, useRef, useState } from 'react'
import TricolourBar from './components/TricolourBar.jsx'
import { MountainMark, SearchIcon, UploadIcon, DownloadIcon } from './components/icons.jsx'
import { useLang, LanguageToggle } from './lib/i18n.jsx'
import { getElectionRecords, saveElectionRecords, resetElectionRecords, exportElectionRecordsJSON } from './lib/store.js'
import { analyzeBooth, summarize, allParties, partyLabel, partyColor, TAG_META } from './lib/electionAnalysis.js'
import { parseElectionFile, downloadElectionTemplate } from './lib/electionImport.js'

const TAG_LABEL_KEY = { swing: 'tagSwingLabel', leaning: 'tagLeaningLabel', safe: 'tagSafeLabel' }

function TagBadge({ tag, t }) {
  const m = TAG_META[tag]
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.bg} ${m.text}`}>{t(TAG_LABEL_KEY[tag])}</span>
}

export default function App() {
  const { t } = useLang()
  const [records, setRecords] = useState(() => getElectionRecords())
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('all')
  const [openBooth, setOpenBooth] = useState(null)
  const [msg, setMsg] = useState('')
  const uploadRef = useRef(null)

  const parties = useMemo(() => allParties(records), [records])
  const summary = useMemo(() => summarize(records), [records])
  const analyzed = useMemo(() => records.map((b) => ({ b, a: analyzeBooth(b) })), [records])
  const filtered = analyzed.filter(({ b, a }) => {
    const q = query.trim().toLowerCase()
    const matchesQ = !q || b.booth.toLowerCase().includes(q) || (b.village || '').toLowerCase().includes(q)
    return matchesQ && (tagFilter === 'all' || a.tag === tagFilter)
  })

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  async function onUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { records: parsed, rows, skipped } = await parseElectionFile(file)
      if (!parsed.length) { flash('No valid rows found. Check the columns.'); return }
      if (confirm(`Parsed ${rows} rows into ${parsed.length} booths (${skipped} skipped).\n\nOK = replace all records.`)) {
        setRecords(saveElectionRecords(parsed)); flash(`Imported ${parsed.length} booths.`)
      }
    } catch (err) { flash('Import failed: ' + err.message) } finally { e.target.value = '' }
  }

  function exportJson() {
    const blob = new Blob([exportElectionRecordsJSON()], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'election-records.json'
    document.body.appendChild(a); a.click(); a.remove()
  }

  const btn = 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50'
  const card = (id, label, count, color) => (
    <button
      onClick={() => setTagFilter(tagFilter === id ? 'all' : id)}
      className={`flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 shadow-sm transition ${tagFilter === id ? 'border-[#12306e] ring-1 ring-[#12306e]/20' : 'border-slate-200 hover:border-slate-300'}`}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-lg font-bold text-slate-900">{count}</span>
      <span className="text-sm text-slate-500">{label}</span>
    </button>
  )

  return (
    <div className="min-h-screen">
      <TricolourBar />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#12306e] text-white shadow-sm">
              <MountainMark className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#12306e]">{t('appTitle')}</h1>
              <p className="mt-0.5 text-sm text-slate-500">{t('appSubtitle')}</p>
            </div>
          </div>
          <LanguageToggle />
        </header>

        {/* Toolbar */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <button className="rounded-lg bg-[#12306e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0e2757]" onClick={() => uploadRef.current?.click()}>
            <span className="inline-flex items-center gap-1.5"><UploadIcon className="h-3.5 w-3.5" /> {t('uploadForm20')}</span>
          </button>
          <button className={btn} onClick={() => downloadElectionTemplate()}>{t('downloadTemplate')}</button>
          <button className={btn} onClick={exportJson}>{t('exportJson')}</button>
          <button className={btn} onClick={() => { if (confirm('Reset to sample records?')) setRecords(resetElectionRecords()) }}>{t('resetWord')}</button>
          <span className="text-xs text-emerald-600">{msg}</span>
          <input ref={uploadRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onUpload} />
        </div>

        {/* Summary */}
        <div className="mb-5 flex flex-wrap gap-3">
          {card('all', t('boothsWord'), summary.total, '#12306e')}
          {card('swing', t('tagSwingLabel'), summary.swing, TAG_META.swing.color)}
          {card('leaning', t('tagLeaningLabel'), summary.leaning, TAG_META.leaning.color)}
          {card('safe', t('tagSafeLabel'), summary.safe, TAG_META.safe.color)}
        </div>

        {/* Search */}
        <div className="relative mb-3 max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchBooth')}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#12306e]"
          />
        </div>

        {filtered.length === 0 && <p className="text-sm text-slate-400">{t('noElectionData')}</p>}

        {/* Booth list */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {filtered.map(({ b, a }) => {
            const open = openBooth === b.booth
            return (
              <div key={b.booth} className="border-b border-slate-100 last:border-0">
                <button onClick={() => setOpenBooth(open ? null : b.booth)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
                  <span className="w-24 shrink-0 font-medium text-slate-800">{b.booth}</span>
                  <span className="w-36 shrink-0 truncate text-sm text-slate-500">{b.village}</span>
                  <TagBadge tag={a.tag} t={t} />
                  <span className="flex flex-wrap items-center gap-1.5">
                    {a.perYear.map((p) => (
                      <span key={p.year} className="inline-flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-600">
                        {p.year} <span className="font-semibold" style={{ color: partyColor(p.winner) }}>{partyLabel(p.winner)}</span>
                      </span>
                    ))}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">{open ? '▲' : '▼'}</span>
                </button>

                {open && (
                  <div className="overflow-x-auto px-4 pb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-400">
                          <th className="py-1 pr-3">{t('yearWord')}</th>
                          {parties.map((p) => <th key={p} className="px-2 py-1 text-right">{partyLabel(p)}</th>)}
                          <th className="px-2 py-1 text-right">{t('turnoutWord')}</th>
                          <th className="px-2 py-1 text-right">{t('winnerWord')}</th>
                          <th className="px-2 py-1 text-right">{t('marginWord')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {a.perYear.map((p) => (
                          <tr key={p.year} className="border-t border-slate-100">
                            <td className="py-1.5 pr-3 font-medium text-slate-700">{p.year}</td>
                            {parties.map((party) => {
                              const isWin = party === p.winner
                              return (
                                <td key={party} className={`px-2 py-1.5 text-right tabular-nums ${isWin ? 'font-bold' : 'text-slate-600'}`} style={isWin ? { color: partyColor(party) } : undefined}>
                                  {p.votes[party] ?? '—'}
                                </td>
                              )
                            })}
                            <td className="px-2 py-1.5 text-right tabular-nums text-slate-500">{p.total}</td>
                            <td className="px-2 py-1.5 text-right font-semibold" style={{ color: partyColor(p.winner) }}>{partyLabel(p.winner)}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{p.marginVotes} ({p.marginPct.toFixed(1)}%)</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
