import { useMemo, useState } from 'react'
import TricolourBar from './TricolourBar.jsx'
import { MountainMark, SearchIcon } from './icons.jsx'
import BoothCharts from './BoothCharts.jsx'
import { useLang, LanguageToggle } from '../lib/i18n.jsx'
import { getElectionRecords, getMyBooth, saveMyBooth, clearMyBooth } from '../lib/store.js'
import { analyzeBooth, partyLabel, partyColor, marginTone, TAG_META } from '../lib/electionAnalysis.js'

const TAG_LABEL_KEY = { swing: 'tagSwingLabel', leaning: 'tagLeaningLabel', safe: 'tagSafeLabel' }
const SUMMARY_KEY = { swing: 'summarySwing', leaning: 'summaryLeaning', safe: 'summarySafe' }

/**
 * Karyakarta-facing flow: pick your booth ("login"), then see that booth's own
 * past-election record with charts. Fully separate from the analyst dashboard.
 */
export default function KaryakartaFlow({ onAnalyst }) {
  const { t, lang } = useLang()
  const records = useMemo(() => getElectionRecords(), [])
  const [booth, setBooth] = useState(() => getMyBooth())

  const record = records.find((b) => b.booth === booth) || null

  function pick(b) { setBooth(saveMyBooth(b)) }
  function switchBooth() { clearMyBooth(); setBooth(null) }

  return (
    <div className="min-h-screen">
      <TricolourBar />
      <div className="mx-auto max-w-2xl px-6 py-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#12306e] text-white shadow-sm">
              <MountainMark className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#12306e]">{t('appTitle')}</h1>
              <p className={`mt-0.5 text-sm text-slate-500 ${lang === 'hi' ? 'devanagari' : ''}`}>{t('findBoothHint')}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageToggle />
            <button onClick={onAnalyst} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              {t('analystView')}
            </button>
          </div>
        </header>

        {record ? (
          <BoothView record={record} onSwitch={switchBooth} />
        ) : (
          <BoothPicker records={records} onPick={pick} />
        )}
      </div>
    </div>
  )
}

function BoothPicker({ records, onPick }) {
  const { t } = useLang()
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const shown = records.filter(
    (b) => !query || b.booth.toLowerCase().includes(query) || (b.name || '').toLowerCase().includes(query) || (b.village || '').toLowerCase().includes(query),
  )
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-900">{t('findBooth')}</h2>
      <div className="relative my-3">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchBooth')}
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#12306e]"
        />
      </div>
      {records.length === 0 && <p className="text-sm text-slate-400">{t('noElectionData')}</p>}
      <div className="max-h-[52vh] divide-y divide-slate-100 overflow-y-auto">
        {shown.map((b) => (
          <button
            key={b.booth}
            onClick={() => onPick(b.booth)}
            className="flex w-full items-center gap-3 px-1 py-2.5 text-left hover:bg-slate-50"
          >
            <span className="w-20 shrink-0 font-medium text-slate-800">{b.booth}</span>
            <span className="min-w-0 flex-1">
              {b.name && <span className="block truncate text-sm text-slate-700">{b.name}</span>}
              <span className="block truncate text-xs text-slate-400">{b.village}</span>
            </span>
            <span className="ml-auto text-xs text-slate-300">›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function BoothView({ record, onSwitch }) {
  const { t } = useLang()
  const a = useMemo(() => analyzeBooth(record), [record])
  const latest = a.perYear[a.perYear.length - 1]
  const tag = TAG_META[a.tag]
  const summaryParty = a.tag === 'swing' ? latest?.winner : a.dominantParty
  const summaryMargin = a.tag === 'swing' ? (latest?.marginPct ?? 0) : a.minMarginPct

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-400">{t('myBoothLabel')} · {record.booth}</p>
            <h2 className="truncate text-xl font-bold text-slate-900">{record.name || record.booth}</h2>
            <p className="text-sm text-slate-500">{record.village}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tag.bg} ${tag.text}`}>{t(TAG_LABEL_KEY[a.tag])}</span>
          <button onClick={onSwitch} className="ml-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
            {t('switchBooth')}
          </button>
        </div>
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {t(SUMMARY_KEY[a.tag], { party: partyLabel(summaryParty), margin: (summaryMargin || 0).toFixed(1) })}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {a.perYear.map((p) => {
            const tone = marginTone(p.marginPct)
            return (
              <div key={p.year} className="flex items-center gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5">
                <span className="text-xs font-medium text-slate-500">{p.year}</span>
                <span className="text-sm font-semibold" style={{ color: partyColor(p.winner) }}>{partyLabel(p.winner)}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${tone.bg} ${tone.text}`}>{p.marginPct.toFixed(1)}%</span>
                {p.runnerUp && p.runnerUp !== '—' && (
                  <span className="text-[11px] text-slate-400">{t('vsWord')} {partyLabel(p.runnerUp)}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <BoothCharts analysis={a} />
    </div>
  )
}
