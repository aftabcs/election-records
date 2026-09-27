/**
 * Sample booth-wise election results (as compiled from Form 20 — the polling-
 * station-wise final result sheet). Replace ELECTION_SEED with real imported
 * data; the analysis + UI read from the store, not this file.
 *
 * Shape: one object per booth, with per-year party vote counts. Parties are
 * flexible; winner/margins are derived in electionAnalysis.js.
 */

export const PARTY_META = {
  INC: { label: 'Congress', color: '#12306e' },
  BJP: { label: 'BJP', color: '#f26a1b' },
  AAP: { label: 'AAP', color: '#1a7f5a' },
  BSP: { label: 'BSP', color: '#2563eb' },
  SP: { label: 'SP', color: '#e11d48' },
  UKD: { label: 'UKD', color: '#7c3aed' },
  Others: { label: 'Others', color: '#64748b' },
}

// Parties kept as their own column; everything else (minor parties, NOTA, etc.)
// is folded into "Others".
export const MAJOR_PARTIES = ['INC', 'BJP', 'AAP', 'BSP', 'SP', 'UKD']

export const ELECTION_SEED = [
  { booth: 'Booth 1', village: 'Vaidya', years: {
    2012: { INC: 360, BJP: 300, BSP: 70, Others: 40 },
    2017: { INC: 320, BJP: 430, BSP: 60, Others: 30 },
    2022: { INC: 470, BJP: 420, BSP: 40, Others: 20 },
  } },
  { booth: 'Booth 2', village: 'Vaidya', years: {
    2012: { INC: 300, BJP: 520, BSP: 50, Others: 30 },
    2017: { INC: 320, BJP: 560, BSP: 40, Others: 20 },
    2022: { INC: 350, BJP: 540, BSP: 30, Others: 20 },
  } },
  { booth: 'Booth 3', village: 'Vaidya', years: {
    2012: { INC: 540, BJP: 280, BSP: 60, Others: 40 },
    2017: { INC: 520, BJP: 300, BSP: 50, Others: 30 },
    2022: { INC: 560, BJP: 320, BSP: 30, Others: 20 },
  } },
  { booth: 'Booth 4', village: 'Shambhurahe Vaidya', years: {
    2012: { INC: 410, BJP: 390, BSP: 40, Others: 20 },
    2017: { INC: 430, BJP: 400, BSP: 30, Others: 20 },
    2022: { INC: 450, BJP: 420, BSP: 20, Others: 10 },
  } },
  { booth: 'Booth 5', village: 'Vaidya', years: {
    2012: { INC: 380, BJP: 400, BSP: 50, Others: 30 },
    2017: { INC: 420, BJP: 410, BSP: 40, Others: 20 },
    2022: { INC: 430, BJP: 440, BSP: 20, Others: 10 },
  } },
  { booth: 'Booth 6', village: 'Shambhurahe Vaidya', years: {
    2012: { INC: 410, BJP: 470, BSP: 40, Others: 20 },
    2017: { INC: 400, BJP: 480, BSP: 30, Others: 20 },
    2022: { INC: 460, BJP: 480, BSP: 20, Others: 10 },
  } },
]
