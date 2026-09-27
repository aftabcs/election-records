import { partyLabel, partyColor, marginTone } from '../lib/electionAnalysis.js'
import { useLang } from '../lib/i18n.jsx'

/**
 * Two hand-drawn SVG charts for one booth (no chart library — stays offline &
 * light): votes by party×year (grouped bars) and the winning-margin trend.
 * `analysis` is the object returned by analyzeBooth().
 */
export default function BoothCharts({ analysis }) {
  const { t } = useLang()
  const perYear = analysis.perYear || []
  if (perYear.length === 0) return null

  // Parties present in this booth across all years, canonical order (Others last).
  const seen = []
  perYear.forEach((p) => Object.keys(p.votes).forEach((k) => { if (!seen.includes(k)) seen.push(k) }))
  const parties = seen.filter((p) => p !== 'Others').concat(seen.includes('Others') ? ['Others'] : [])

  return (
    <div className="space-y-4">
      <ChartCard title={t('voteShareTitle')}>
        <VoteBars perYear={perYear} parties={parties} />
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {parties.map((p) => (
            <span key={p} className="inline-flex items-center gap-1 text-[11px] text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: partyColor(p) }} />
              {partyLabel(p)}
            </span>
          ))}
        </div>
      </ChartCard>

      <ChartCard title={t('marginTrendTitle')}>
        <MarginBars perYear={perYear} />
      </ChartCard>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold text-slate-500">{title}</p>
      {children}
    </div>
  )
}

/** Grouped bars: for each year a cluster of party bars, height ∝ votes. */
function VoteBars({ perYear, parties }) {
  const W = 320, H = 170, padX = 6, padTop = 8, padBot = 26
  const plotW = W - padX * 2, plotH = H - padTop - padBot
  const maxVotes = Math.max(1, ...perYear.flatMap((p) => parties.map((k) => p.votes[k] || 0)))
  const groupW = plotW / perYear.length
  const innerW = groupW * 0.82
  const barW = Math.max(3, innerW / parties.length)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="votes by party and year">
      <line x1={padX} y1={padTop + plotH} x2={W - padX} y2={padTop + plotH} stroke="#e2e8f0" />
      {perYear.map((p, gi) => {
        const gx = padX + gi * groupW + (groupW - innerW) / 2
        return (
          <g key={p.year}>
            {parties.map((k, bi) => {
              const v = p.votes[k] || 0
              const bh = (v / maxVotes) * plotH
              const x = gx + bi * barW
              const y = padTop + plotH - bh
              return <rect key={k} x={x} y={y} width={Math.max(2, barW - 1)} height={bh} rx="1" fill={partyColor(k)} />
            })}
            <text x={padX + gi * groupW + groupW / 2} y={H - 9} textAnchor="middle" fontSize="11" fill="#64748b">{p.year}</text>
          </g>
        )
      })}
    </svg>
  )
}

/** Winning-margin per year as bars, coloured by tightness (red/amber/green). */
function MarginBars({ perYear }) {
  const W = 320, H = 130, padX = 8, padTop = 16, padBot = 26
  const plotW = W - padX * 2, plotH = H - padTop - padBot
  const maxPct = Math.max(20, ...perYear.map((p) => p.marginPct))
  const groupW = plotW / perYear.length
  const barW = Math.min(46, groupW * 0.5)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="winning margin by year">
      <line x1={padX} y1={padTop + plotH} x2={W - padX} y2={padTop + plotH} stroke="#e2e8f0" />
      {perYear.map((p, gi) => {
        const tone = marginTone(p.marginPct)
        const bh = (p.marginPct / maxPct) * plotH
        const cx = padX + gi * groupW + groupW / 2
        const y = padTop + plotH - bh
        return (
          <g key={p.year}>
            <rect x={cx - barW / 2} y={y} width={barW} height={bh} rx="2" fill={tone.dot} />
            <text x={cx} y={y - 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#334155">{p.marginPct.toFixed(1)}%</text>
            <text x={cx} y={H - 9} textAnchor="middle" fontSize="11" fill="#64748b">{p.year}</text>
          </g>
        )
      })}
    </svg>
  )
}
