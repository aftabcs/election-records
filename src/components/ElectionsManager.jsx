import { useState } from 'react'
import { useLang } from '../lib/i18n.jsx'

/**
 * Name the elections: each known year gets a label (e.g. 2022 → "2022 Vidhan
 * Sabha"). New years can be added here; they then appear as columns in the booth
 * editor so the admin can enter that election's votes.
 */
export default function ElectionsManager({ years, labels, onSave, onClose }) {
  const { t } = useLang()
  const [rows, setRows] = useState(() => years.map((y) => ({ year: y, label: labels[y] || '' })))
  const [newYear, setNewYear] = useState('')

  const setLabel = (i, v) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, label: v } : row)))
  function addYear() {
    const y = newYear.trim()
    if (!y || rows.some((r) => r.year === y)) return
    setRows((r) => [...r, { year: y, label: '' }].sort((a, b) => a.year.localeCompare(b.year)))
    setNewYear('')
  }
  function save() {
    const map = {}
    rows.forEach((r) => { if (r.label.trim()) map[r.year] = r.label.trim() })
    onSave(map)
  }
  const field = 'rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12306e]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#12306e]">{t('nameElectionsTitle')}</h2>
            <p className="text-xs text-slate-500">{t('nameElectionsHint')}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">✕</button>
        </div>

        <div className="space-y-2 p-5">
          {rows.map((r, i) => (
            <div key={r.year} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-sm font-semibold text-slate-700">{r.year}</span>
              <input
                value={r.label}
                onChange={(e) => setLabel(i, e.target.value)}
                placeholder={t('electionNameLabel')}
                className={`devanagari flex-1 ${field}`}
              />
            </div>
          ))}

          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
            <input
              value={newYear}
              onChange={(e) => setNewYear(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={t('yearNumberLabel')}
              className={`w-32 ${field}`}
            />
            <button onClick={addYear} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
              + {t('addYear')}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">{t('cancelWord')}</button>
          <button onClick={save} className="rounded-lg bg-[#12306e] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0e2757]">{t('saveWord')}</button>
        </div>
      </div>
    </div>
  )
}
