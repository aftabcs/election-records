import { useMemo, useRef, useState } from 'react'
import TricolourBar from './components/TricolourBar.jsx'
import { MountainMark, SearchIcon, UploadIcon, DownloadIcon } from './components/icons.jsx'
import { useLang, LanguageToggle } from './lib/i18n.jsx'
import { getElectionRecords, saveElectionRecords, resetElectionRecords, exportElectionRecordsJSON, upsertBooth, deleteBooth, mergeElectionRecords, getElectionLabels, saveElectionLabels } from './lib/store.js'
import { analyzeBooth, summarize, allParties, partyLabel, partyColor, TAG_META, marginTone } from './lib/electionAnalysis.js'
import { parseElectionFile, downloadElectionTemplate } from './lib/electionImport.js'
import KaryakartaFlow from './components/KaryakartaFlow.jsx'
import BoothEditor from './components/BoothEditor.jsx'
import ElectionsManager from './components/ElectionsManager.jsx'
import CompareBooths from './components/CompareBooths.jsx'

const TAG_LABEL_KEY = { swing: 'tagSwingLabel', leaning: 'tagLeaningLabel', safe: 'tagSafeLabel' }

function PencilIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  const active = value !== 'all'
  return (
    <label className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 ${active ? 'border-[#12306e] bg-[#12306e]/5' : 'border-slate-200 bg-white'}`}>
      <span className="text-slate-400">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="max-w-[10rem] truncate bg-transparent font-medium text-slate-700 outline-none">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )
}

function TagBadge({ tag, t }) {
  const m = TAG_META[tag]
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.bg} ${m.text}`}>{t(TAG_LABEL_KEY[tag])}</span>
}

function AnalystDashboard({ onKaryakarta }) {
  const { t } = useLang()
  const [records, setRecords] = useState(() => getElectionRecords())
  const [labels, setLabels] = useState(() => getElectionLabels())
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('all')
  const [yearF, setYearF] = useState('all')
  const [partyF, setPartyF] = useState('all')
  const [villageF, setVillageF] = useState('all')
  const [marginF, setMarginF] = useState('all')
  const [openBooth, setOpenBooth] = useState(null)
  const [editorBooth, setEditorBooth] = useState(null) // null | 'new' | record
  const [showElections, setShowElections] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [pendingImport, setPendingImport] = useState(null) // {parsed, rows, skipped}
  const [msg, setMsg] = useState('')
  const uploadRef = useRef(null)

  const parties = useMemo(() => allParties(records), [records])
  const summary = useMemo(() => summarize(records), [records])
  const analyzed = useMemo(() => records.map((b) => ({ b, a: analyzeBooth(b) })), [records])
  const years = useMemo(() => {
    const set = new Set()
    records.forEach((b) => Object.keys(b.years || {}).forEach((y) => set.add(String(y))))
    Object.keys(labels).forEach((y) => set.add(String(y)))
    return [...set].sort()
  }, [records, labels])
  const villages = useMemo(() => [...new Set(records.map((b) => b.village).filter(Boolean))].sort(), [records])
  const yearLabel = (y) => labels[y] || y

  const filtered = analyzed.filter(({ b, a }) => {
    const q = query.trim().toLowerCase()
    if (q && !(b.booth.toLowerCase().includes(q) || (b.name || '').toLowerCase().includes(q) || (b.village || '').toLowerCase().includes(q))) return false
    if (tagFilter !== 'all' && a.tag !== tagFilter) return false
    if (villageF !== 'all' && b.village !== villageF) return false
    const rp = yearF !== 'all' ? a.perYear.find((p) => String(p.year) === String(yearF)) : a.perYear[a.perYear.length - 1]
    if (yearF !== 'all' && !rp) return false
    if (partyF !== 'all' && rp?.winner !== partyF) return false
    if (marginF !== 'all') {
      const m = yearF !== 'all' ? (rp?.marginPct ?? 999) : a.minMarginPct
      if (marginF === 'tight' && !(m < 5)) return false
      if (marginF === 'close' && !(m >= 5 && m < 10)) return false
      if (marginF === 'safe' && !(m >= 10)) return false
    }
    return true
  })

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2500) }
  function onSaveBooth(rec, prevBooth) { setRecords(upsertBooth(rec, prevBooth)); setEditorBooth(null); flash(t('saveWord')) }
  function onDeleteBooth(booth) { if (confirm(t('confirmDeleteBooth'))) { setRecords(deleteBooth(booth)); setEditorBooth(null) } }
  function onSaveElections(map) { setLabels(saveElectionLabels(map)); setShowElections(false) }

  async function onUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { records: parsed, rows, skipped } = await parseElectionFile(file)
      if (!parsed.length) flash('No valid rows found. Check the columns.')
      else setPendingImport({ parsed, rows, skipped })
    } catch (err) { flash('Import failed: ' + err.message) } finally { e.target.value = '' }
  }
  function applyImport(mode) {
    const { parsed } = pendingImport
    setRecords(mode === 'merge' ? mergeElectionRecords(parsed) : saveElectionRecords(parsed))
    setPendingImport(null)
    flash(`${mode === 'merge' ? 'Merged' : 'Imported'} ${parsed.length} booths.`)
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
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={onKaryakarta} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              {t('karyakartaView')}
            </button>
            <LanguageToggle />
          </div>
        </header>

        {/* Year selector (prominent, top-level) */}
        {years.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{t('filterYear')}</span>
            {['all', ...years].map((y) => (
              <button
                key={y}
                onClick={() => setYearF(y)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${yearF === y ? 'bg-[#12306e] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {y === 'all' ? t('allWord') : yearLabel(y)}
              </button>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <button className="rounded-lg bg-[#12306e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0e2757]" onClick={() => uploadRef.current?.click()}>
            <span className="inline-flex items-center gap-1.5"><UploadIcon className="h-3.5 w-3.5" /> {t('uploadForm20')}</span>
          </button>
          <button className={btn} onClick={() => downloadElectionTemplate()}>{t('downloadTemplate')}</button>
          <button className={btn} onClick={exportJson}>{t('exportJson')}</button>
          <button className={btn} onClick={() => { if (confirm('Reset to sample records?')) setRecords(resetElectionRecords()) }}>{t('resetWord')}</button>
          <span className="mx-1 h-4 w-px bg-slate-200" />
          <button className="rounded-lg bg-[#12306e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0e2757]" onClick={() => setEditorBooth('new')}>+ {t('addBooth')}</button>
          <button className={btn} onClick={() => setShowElections(true)}>{t('manageElections')}</button>
          <button className={btn} onClick={() => setShowCompare(true)} disabled={records.length < 2}>{t('compareBtn')}</button>
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

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <FilterSelect label={t('filterWinner')} value={partyF} onChange={setPartyF} options={[['all', t('allWord')], ...parties.map((p) => [p, partyLabel(p)])]} />
          <FilterSelect label={t('filterVillage')} value={villageF} onChange={setVillageF} options={[['all', t('allWord')], ...villages.map((v) => [v, v])]} />
          <FilterSelect label={t('filterMargin')} value={marginF} onChange={setMarginF} options={[['all', t('allWord')], ['tight', t('marginTight')], ['close', t('marginClose')], ['safe', t('marginSafe')]]} />
          {(yearF !== 'all' || partyF !== 'all' || villageF !== 'all' || marginF !== 'all') && (
            <button onClick={() => { setYearF('all'); setPartyF('all'); setVillageF('all'); setMarginF('all') }} className="rounded-lg px-2 py-1 text-slate-500 underline hover:text-slate-700">
              {t('allWord')} ✕
            </button>
          )}
          <span className="ml-auto text-slate-400">{filtered.length} {t('boothsWord')}</span>
        </div>

        {filtered.length === 0 && <p className="text-sm text-slate-400">{t('noElectionData')}</p>}

        {/* Booth list */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {filtered.map(({ b, a }) => {
            const open = openBooth === b.booth
            return (
              <div key={b.booth} className="border-b border-slate-100 last:border-0">
                <div className="flex items-center">
                <button onClick={() => setOpenBooth(open ? null : b.booth)} className="flex flex-1 flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
                  <span className="w-48 shrink-0" title={b.name || ''}>
                    <span className="font-medium text-slate-800">{b.booth}</span>
                    {b.name && <span className="block truncate text-[11px] text-slate-400">{b.name}</span>}
                  </span>
                  <span className="w-32 shrink-0 truncate text-sm text-slate-500">{b.village}</span>
                  <TagBadge tag={a.tag} t={t} />
                  <span className="flex flex-wrap items-center gap-1.5">
                    {a.perYear.map((p) => (
                      <span key={p.year} className="inline-flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-600">
                        {p.year} <span className="font-semibold" style={{ color: partyColor(p.winner) }}>{partyLabel(p.winner)}</span>
                      </span>
                    ))}
                  </span>
                  {(() => {
                    const tone = marginTone(a.minMarginPct)
                    return (
                      <span className={`ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.bg} ${tone.text}`} title="Tightest winner–runner-up gap across years">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.dot }} />
                        {t('marginWord')} {a.minMarginPct.toFixed(1)}%
                      </span>
                    )
                  })()}
                  <span className="ml-2 text-xs text-slate-400">{open ? '▲' : '▼'}</span>
                </button>
                <button onClick={() => setEditorBooth(b)} title={t('editWord')} className="mr-2 shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#12306e]">
                  <PencilIcon className="h-4 w-4" />
                </button>
                </div>

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
                            <td className="py-1.5 pr-3 font-medium text-slate-700">{yearLabel(p.year)}</td>
                            {parties.map((party) => {
                              const isWin = party === p.winner
                              return (
                                <td key={party} className={`px-2 py-1.5 text-right tabular-nums ${isWin ? 'font-bold' : 'text-slate-600'}`} style={isWin ? { color: partyColor(party) } : undefined}>
                                  {p.votes[party] ?? '—'}
                                </td>
                              )
                            })}
                            <td className="px-2 py-1.5 text-right tabular-nums text-slate-500">{p.total}</td>
                            <td className="px-2 py-1.5 text-right">
                              <span className="font-semibold" style={{ color: partyColor(p.winner) }}>{partyLabel(p.winner)}</span>
                              {p.runnerUp && p.runnerUp !== '—' && (
                                <span className="block text-[10px] text-slate-400">vs {partyLabel(p.runnerUp)}</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              {(() => {
                                const tn = marginTone(p.marginPct)
                                return (
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${tn.bg} ${tn.text}`}>
                                    +{p.marginVotes} · {p.marginPct.toFixed(1)}%
                                  </span>
                                )
                              })()}
                            </td>
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

      {editorBooth && (
        <BoothEditor
          record={editorBooth === 'new' ? null : editorBooth}
          years={years.length ? years : ['2017', '2022']}
          labels={labels}
          onSave={onSaveBooth}
          onDelete={onDeleteBooth}
          onClose={() => setEditorBooth(null)}
        />
      )}
      {showElections && (
        <ElectionsManager years={years} labels={labels} onSave={onSaveElections} onClose={() => setShowElections(false)} />
      )}
      {showCompare && <CompareBooths records={records} onClose={() => setShowCompare(false)} />}
      {pendingImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-[#12306e]">{t('importTitle')}</h2>
            </div>
            <div className="space-y-2 p-5 text-sm text-slate-600">
              <p>{t('importSummary', { rows: pendingImport.rows, booths: pendingImport.parsed.length, skipped: pendingImport.skipped })}</p>
              {(() => {
                const ys = [...new Set(pendingImport.parsed.flatMap((b) => Object.keys(b.years || {})))].sort()
                return ys.length ? <p className="text-xs font-medium text-slate-500">{t('importYears', { years: ys.join(', ') })}</p> : null
              })()}
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">{t('importHint')}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button onClick={() => setPendingImport(null)} className={btn}>{t('cancelWord')}</button>
              <button onClick={() => applyImport('replace')} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">{t('replaceAll')}</button>
              <button onClick={() => applyImport('merge')} className="rounded-lg bg-[#12306e] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0e2757]">{t('addToExisting')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Two faces of the app: the karyakarta booth-records view and the analyst dashboard. */
export default function App() {
  const [view, setView] = useState('karyakarta')
  if (view === 'karyakarta') return <KaryakartaFlow onAnalyst={() => setView('analyst')} />
  return <AnalystDashboard onKaryakarta={() => setView('karyakarta')} />
}
