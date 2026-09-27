import { createContext, useCallback, useContext, useState } from 'react'

/** Minimal bilingual (English / Hindi) layer — same pattern as Graphics Studio. */
const STR = {
  appTitle: { en: 'Election Records', hi: 'चुनावी रिकॉर्ड' },
  appSubtitle: {
    en: 'Booth-wise past results from Form 20 — swing vs consistent booths',
    hi: 'फॉर्म 20 से बूथवार पिछले नतीजे — स्विंग बनाम स्थिर बूथ',
  },
  uploadForm20: { en: 'Upload Form 20 (Excel/CSV)', hi: 'फॉर्म 20 अपलोड करें (Excel/CSV)' },
  downloadTemplate: { en: 'Download template', hi: 'टेम्पलेट डाउनलोड करें' },
  exportJson: { en: 'Export JSON', hi: 'JSON एक्सपोर्ट' },
  resetWord: { en: 'Reset', hi: 'रीसेट' },
  boothsWord: { en: 'booths', hi: 'बूथ' },
  tagSwingLabel: { en: 'Swing', hi: 'स्विंग' },
  tagLeaningLabel: { en: 'Leaning', hi: 'झुकाव' },
  tagSafeLabel: { en: 'Consistent', hi: 'स्थिर' },
  searchBooth: { en: 'Search booth / village…', hi: 'बूथ / गाँव खोजें…' },
  winnerWord: { en: 'Winner', hi: 'विजेता' },
  marginWord: { en: 'Margin', hi: 'अंतर' },
  turnoutWord: { en: 'Votes', hi: 'कुल वोट' },
  yearWord: { en: 'Year', hi: 'वर्ष' },
  noElectionData: { en: 'No records yet. Upload Form 20 or reset to the sample.', hi: 'अभी कोई रिकॉर्ड नहीं। फॉर्म 20 अपलोड करें या सैंपल पर रीसेट करें।' },

  // Karyakarta booth-records feature
  karyakartaView: { en: 'Karyakarta', hi: 'कार्यकर्ता' },
  analystView: { en: 'Analyst view', hi: 'विश्लेषक व्यू' },
  findBooth: { en: 'Find your booth', hi: 'अपना बूथ ढूँढें' },
  findBoothHint: { en: 'Pick your booth to see its past election record.', hi: 'अपना बूथ चुनें और उसका पिछला चुनावी रिकॉर्ड देखें।' },
  myBoothLabel: { en: 'My booth', hi: 'मेरा बूथ' },
  switchBooth: { en: 'Switch booth', hi: 'बूथ बदलें' },
  boothWord: { en: 'Booth', hi: 'बूथ' },
  voteShareTitle: { en: 'Votes by party & year', hi: 'पार्टीवार व वर्षवार वोट' },
  marginTrendTitle: { en: 'Winning margin by year', hi: 'वर्षवार जीत का अंतर' },
  vsWord: { en: 'vs', hi: 'बनाम' },

  // Admin: add/edit records, elections, filters
  addBooth: { en: 'Add booth', hi: 'बूथ जोड़ें' },
  editBooth: { en: 'Edit booth', hi: 'बूथ संपादित करें' },
  manageElections: { en: 'Elections', hi: 'चुनाव' },
  nameElectionsTitle: { en: 'Name your elections', hi: 'चुनावों के नाम दें' },
  nameElectionsHint: { en: 'Give each election year a name shown across the records.', hi: 'हर चुनाव वर्ष को एक नाम दें जो रिकॉर्ड में दिखे।' },
  addYear: { en: 'Add year', hi: 'वर्ष जोड़ें' },
  yearNumberLabel: { en: 'Year (e.g. 2022)', hi: 'वर्ष (जैसे 2022)' },
  electionNameLabel: { en: 'Election name', hi: 'चुनाव का नाम' },
  boothNumberLabel: { en: 'Booth number / label', hi: 'बूथ संख्या / लेबल' },
  boothNameLabel: { en: 'Booth name', hi: 'बूथ का नाम' },
  villageLabel: { en: 'Village', hi: 'गाँव' },
  votesGridHint: { en: 'Votes per party for each election', hi: 'हर चुनाव में पार्टीवार वोट' },
  saveWord: { en: 'Save', hi: 'सहेजें' },
  cancelWord: { en: 'Cancel', hi: 'रद्द करें' },
  deleteWord: { en: 'Delete', hi: 'हटाएँ' },
  editWord: { en: 'Edit', hi: 'संपादित' },
  confirmDeleteBooth: { en: 'Delete this booth and its records?', hi: 'यह बूथ व इसके रिकॉर्ड हटाएँ?' },
  allWord: { en: 'All', hi: 'सभी' },
  filterYear: { en: 'Year', hi: 'वर्ष' },
  filterWinner: { en: 'Winner', hi: 'विजेता' },
  filterVillage: { en: 'Village', hi: 'गाँव' },
  filterMargin: { en: 'Margin', hi: 'अंतर' },
  marginTight: { en: 'Tight (<5%)', hi: 'कड़ा (<5%)' },
  marginClose: { en: 'Close (5–10%)', hi: 'नज़दीकी (5–10%)' },
  marginSafe: { en: 'Safe (≥10%)', hi: 'सुरक्षित (≥10%)' },
  latestWord: { en: 'Latest', hi: 'ताज़ा' },
  compareBtn: { en: 'Compare', hi: 'तुलना करें' },
  compareTitle: { en: 'Compare two booths', hi: 'दो बूथों की तुलना' },
  boothALabel: { en: 'Booth A', hi: 'बूथ A' },
  boothBLabel: { en: 'Booth B', hi: 'बूथ B' },
  importTitle: { en: 'Import Form 20', hi: 'फॉर्म 20 आयात' },
  importSummary: { en: 'Parsed {rows} rows → {booths} booths ({skipped} skipped).', hi: '{rows} पंक्तियाँ → {booths} बूथ ({skipped} छोड़े गए)।' },
  importYears: { en: 'Elections in this file: {years}', hi: 'इस फ़ाइल के चुनाव: {years}' },
  addToExisting: { en: 'Add to existing', hi: 'मौजूदा में जोड़ें' },
  replaceAll: { en: 'Replace all', hi: 'सभी बदलें' },
  importHint: { en: 'Add merges these results into matching booths (keeps other years). Replace overwrites everything.', hi: 'जोड़ें: ये नतीजे मिलते बूथों में जुड़ते हैं (बाकी वर्ष रहते हैं)। बदलें: सब कुछ बदल जाता है।' },
  summarySwing: { en: 'This is a SWING booth — the winner changed across elections. Latest: {party} by {margin}%.', hi: 'यह एक स्विंग बूथ है — विजेता बदलता रहा। ताज़ा: {party} {margin}% से।' },
  summarySafe: { en: 'CONSISTENT booth — {party} has won every election (closest margin {margin}%).', hi: 'स्थिर बूथ — {party} हर बार जीता (न्यूनतम अंतर {margin}%)।' },
  summaryLeaning: { en: 'LEANS {party}, but at least one election was close (margin {margin}%).', hi: '{party} की ओर झुकाव, पर कम-से-कम एक बार मुक़ाबला नज़दीकी रहा (अंतर {margin}%)।' },
}

const LangContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k })

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('er.lang') || 'en')
  const setLang = useCallback((l) => { localStorage.setItem('er.lang', l); setLangState(l) }, [])
  const t = useCallback(
    (key, vars) => {
      let s = (STR[key] && (STR[key][lang] || STR[key].en)) || key
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v)
      return s
    },
    [lang],
  )
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}

export function LanguageToggle({ className = '' }) {
  const { lang, setLang } = useLang()
  return (
    <div className={`inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white text-xs ${className}`}>
      {['en', 'hi'].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1.5 font-medium ${lang === l ? 'bg-[#12306e] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {l === 'en' ? 'EN' : 'हिं'}
        </button>
      ))}
    </div>
  )
}
