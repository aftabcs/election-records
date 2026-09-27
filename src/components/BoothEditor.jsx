import { useMemo, useState } from 'react'
import { PARTY_META, MAJOR_PARTIES } from '../data/electionData.js'
import { useLang } from '../lib/i18n.jsx'

const PARTIES = [...MAJOR_PARTIES, 'Others']

/**
 * Add / edit one booth: number/label, name, village, and a votes grid
 * (rows = parties, columns = the defined election years). Writes back a record
 * in the store shape { booth, name, village, years: { [year]: { party: n } } }.
 */
export default function BoothEditor({ record, years, labels, onSave, onDelete, onClose }) {
  const { t } = useLang()
  const editing = !!record
  const [booth, setBooth] = useState(record?.booth || '')
  const [name, setName] = useState(record?.name || '')
  const [village, setVillage] = useState(record?.village || '')

  // votes[year][party] = string (controlled inputs)
  const [votes, setVotes] = useState(() => {
    const v = {}
    years.forEach((y) => {
      v[y] = {}
      PARTIES.forEach((p) => { v[y][p] = record?.years?.[y]?.[p] != null ? String(record.years[y][p]) : '' })
    })
    return v
  })

  const yearLabel = (y) => labels[y] || y
  const setCell = (y, p, val) => setVotes((prev) => ({ ...prev, [y]: { ...prev[y], [p]: val.replace(/[^0-9]/g, '') } }))

  function save() {
    const b = booth.trim()
    if (!b) return
    const years_ = {}
    for (const y of years) {
      const yv = {}
      for (const p of PARTIES) {
        const n = parseInt(votes[y][p], 10)
        if (Number.isFinite(n) && n > 0) yv[p] = n
      }
      if (Object.keys(yv).length) years_[y] = yv
    }
    onSave({ booth: b, name: name.trim(), village: village.trim(), years: years_ }, record?.booth)
  }

  const field = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12306e]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-[#12306e]">{editing ? t('editBooth') : t('addBooth')}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">✕</button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-xs font-medium text-slate-500">{t('boothNumberLabel')}
              <input value={booth} onChange={(e) => setBooth(e.target.value)} className={`mt-1 ${field}`} placeholder="Booth 7" />
            </label>
            <label className="text-xs font-medium text-slate-500 sm:col-span-2">{t('boothNameLabel')}
              <input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1 ${field} devanagari`} placeholder="राजकीय प्राथमिक विद्यालय…" />
            </label>
          </div>
          <label className="block text-xs font-medium text-slate-500">{t('villageLabel')}
            <input value={village} onChange={(e) => setVillage(e.target.value)} className={`mt-1 ${field} devanagari`} />
          </label>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-500">{t('votesGridHint')}</p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-500">
                    <th className="px-3 py-2">{t('filterWinner')}</th>
                    {years.map((y) => <th key={y} className="px-3 py-2 text-right">{yearLabel(y)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PARTIES.map((p) => (
                    <tr key={p} className="border-t border-slate-100">
                      <td className="px-3 py-1.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PARTY_META[p]?.color || '#94a3b8' }} />
                          {PARTY_META[p]?.label || p}
                        </span>
                      </td>
                      {years.map((y) => (
                        <td key={y} className="px-2 py-1">
                          <input
                            inputMode="numeric"
                            value={votes[y][p]}
                            onChange={(e) => setCell(y, p, e.target.value)}
                            className="w-20 rounded-md border border-slate-200 px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-[#12306e]"
                            placeholder="0"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-200 px-5 py-3">
          {editing && (
            <button onClick={() => onDelete(record.booth)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">
              {t('deleteWord')}
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">{t('cancelWord')}</button>
            <button onClick={save} className="rounded-lg bg-[#12306e] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0e2757]">{t('saveWord')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
