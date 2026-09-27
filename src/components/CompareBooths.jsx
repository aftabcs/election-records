import { useMemo, useState } from 'react'
import BoothCharts from './BoothCharts.jsx'
import { useLang } from '../lib/i18n.jsx'
import { analyzeBooth, partyLabel, partyColor, marginTone, TAG_META } from '../lib/electionAnalysis.js'

const TAG_LABEL_KEY = { swing: 'tagSwingLabel', leaning: 'tagLeaningLabel', safe: 'tagSafeLabel' }
const SUMMARY_KEY = { swing: 'summarySwing', leaning: 'summaryLeaning', safe: 'summarySafe' }

/** Side-by-side comparison of two booths: pick A and B, see tag, per-year
 *  winners/margins, and both charts next to each other. */
export default function CompareBooths({ records, onClose }) {
  const { t } = useLang()
  const [a, setA] = useState(records[0]?.booth || '')
  const [b, setB] = useState(records[1]?.booth || records[0]?.booth || '')

  const label = (r) => `${r.booth}${r.name ? ' — ' + r.name : ''}`

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
      <div className="my-6 w-full max-w-5xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-[#12306e]">{t('compareTitle')}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">✕</button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <BoothColumn side={t('boothALabel')} records={records} value={a} onChange={setA} label={label} accent="#12306e" />
          <BoothColumn side={t('boothBLabel')} records={records} value={b} onChange={setB} label={label} accent="#f26a1b" />
        </div>
      </div>
    </div>
  )
}

function BoothColumn({ side, records, value, onChange, label, accent }) {
  const { t } = useLang()
  const record = records.find((r) => r.booth === value) || null
  const analysis = useMemo(() => (record ? analyzeBooth(record) : null), [record])

  return (
    <div className="rounded-xl border border-slate-200">
      <div className="rounded-t-xl px-4 py-2" style={{ background: accent }}>
        <span className="text-xs font-semibold uppercase tracking-wide text-white/90">{side}</span>
      </div>
      <div className="space-y-4 p-4">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="devanagari w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12306e]"
        >
          {records.map((r) => <option key={r.booth} value={r.booth}>{label(r)}</option>)}
        </select>

        {record && analysis ? (
          <>
            <div className="flex items-center gap-2">
              <span className="truncate text-sm text-slate-500">{record.village}</span>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${TAG_META[analysis.tag].bg} ${TAG_META[analysis.tag].text}`}>
                {t(TAG_LABEL_KEY[analysis.tag])}
              </span>
            </div>

            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {t(SUMMARY_KEY[analysis.tag], {
                party: partyLabel(analysis.tag === 'swing' ? analysis.perYear[analysis.perYear.length - 1]?.winner : analysis.dominantParty),
                margin: (analysis.tag === 'swing' ? (analysis.perYear[analysis.perYear.length - 1]?.marginPct ?? 0) : analysis.minMarginPct).toFixed(1),
              })}
            </p>

            <div className="flex flex-wrap gap-2">
              {analysis.perYear.map((p) => {
                const tone = marginTone(p.marginPct)
                return (
                  <div key={p.year} className="flex items-center gap-1.5 rounded-lg border border-slate-100 px-2 py-1">
                    <span className="text-xs font-medium text-slate-500">{p.year}</span>
                    <span className="text-sm font-semibold" style={{ color: partyColor(p.winner) }}>{partyLabel(p.winner)}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${tone.bg} ${tone.text}`}>{p.marginPct.toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>

            <BoothCharts analysis={analysis} />
          </>
        ) : (
          <p className="text-sm text-slate-400">{t('noElectionData')}</p>
        )}
      </div>
    </div>
  )
}
