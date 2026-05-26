import { LogoStacked } from '../ui/Logo'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LanguageContext'

export default function AuthLayout({ children }) {
  const { theme, toggle: toggleTheme } = useTheme()
  const { lang, toggle: toggleLang } = useLang()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 flex items-center justify-center p-4 relative">
      {/* Toggles */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={toggleLang}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition"
          title="Switch language"
        >
          <span className={lang === 'en' ? 'opacity-100 font-bold' : 'opacity-50'}>EN</span>
          <span className="opacity-30">|</span>
          <span className={lang === 'rw' ? 'opacity-100 font-bold' : 'opacity-50'}>RW</span>
        </button>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark'
            ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-5.66l-.71.71M6.34 17.66l-.71.71M17.66 17.66l-.71-.71M6.34 6.34l-.71-.71M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
            : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" /></svg>
          }
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <LogoStacked
            markColor="#ffffff"
            fineColor="#ffffff"
            smeColor="#bfdbfe"
            tagColor="rgba(191,219,254,0.75)"
            iconBg="rgba(255,255,255,0.15)"
            markSize={64}
          />
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-xl">{children}</div>
      </div>
    </div>
  )
}
