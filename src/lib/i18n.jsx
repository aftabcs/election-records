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
