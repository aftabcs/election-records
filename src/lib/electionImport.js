/**
 * Form 20 import: parse an Excel/CSV of booth-wise results into the store shape.
 * Lazy-loads xlsx so it stays out of the initial bundle.
 *
 * Columns (header row): Booth, Village, Year, then one column PER PARTY holding
 * that party's vote count for that booth+year. One row per booth×year:
 *   Booth | Village | Year | INC | BJP | BSP | Others
 */
const RESERVED = new Set(['booth', 'village', 'year'])

export async function parseElectionFile(file) {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const boothMap = new Map()
  let rows = 0
  let skipped = 0

  for (const sheetName of wb.SheetNames) {
    const json = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' })
    for (const row of json) {
      const keys = Object.fromEntries(Object.keys(row).map((k) => [k.trim().toLowerCase(), k]))
      const booth = String(row[keys['booth']] ?? '').trim()
      const village = String(row[keys['village']] ?? '').trim()
      const year = String(row[keys['year']] ?? '').trim()
      if (!booth || !year) { skipped++; continue }

      const votes = {}
      for (const [lower, orig] of Object.entries(keys)) {
        if (RESERVED.has(lower)) continue
        const n = Number(String(row[orig]).replace(/[, ]/g, ''))
        if (!Number.isNaN(n) && row[orig] !== '') votes[orig.trim()] = n
      }
      if (!Object.keys(votes).length) { skipped++; continue }

      if (!boothMap.has(booth)) boothMap.set(booth, { booth, village, years: {} })
      const rec = boothMap.get(booth)
      if (village && !rec.village) rec.village = village
      rec.years[year] = votes
      rows++
    }
  }
  return { records: [...boothMap.values()], rows, skipped }
}

/** Download a ready-to-fill .xlsx template with the expected columns + examples. */
export async function downloadElectionTemplate() {
  const XLSX = await import('xlsx')
  const aoa = [
    ['Booth', 'Village', 'Year', 'INC', 'BJP', 'BSP', 'Others'],
    ['Booth 1', 'Vaidya', 2017, 320, 430, 60, 30],
    ['Booth 1', 'Vaidya', 2022, 470, 420, 40, 20],
    ['Booth 2', 'Vaidya', 2017, 320, 560, 40, 20],
  ]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Form20')
  XLSX.writeFile(wb, 'form20-template.xlsx')
}
