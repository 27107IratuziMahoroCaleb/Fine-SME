import { Link } from 'react-router-dom'
import { LogoCompact } from '../components/ui/Logo'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LanguageContext'
import { useTranslation } from '../hooks/useTranslation'

const features = [
  {
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    title: 'Risk Predictions',
    desc: 'Automated liquidity and sustainability scoring from transaction data. Catch distress signals months before they become defaults.',
  },
  {
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    title: 'Early Warning Alerts',
    desc: 'Real-time alerts triggered by burn rate spikes, cash runway drops, and declining inflows — so no SME slips through the cracks.',
  },
  {
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    title: 'Credit Assessment',
    desc: 'Data-driven credit ratings from AAA to CCC with recommended loan limits, interest rates, and repayment tenors.',
  },
  {
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    title: 'Health Scorecard',
    desc: 'Visual scorecard with gauge meters showing cash flow health, revenue stability, growth trend, and expense efficiency.',
  },
  {
    icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z',
    title: 'Sector Analytics',
    desc: 'Benchmark any SME against its sector. Identify province-level risk concentration and inter-sector performance gaps.',
  },
  {
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    title: 'Recommendations',
    desc: "Actionable, categorised recommendations — cash flow optimisation, cost reduction, revenue diversification — tied to each SME's risk profile.",
  },
]

const roles = [
  {
    role: 'Lender',
    color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    items: ['Credit assessments & ratings', 'Risk predictions', 'Early warning alerts', 'Portfolio reports'],
  },
  {
    role: 'SME Advisor',
    color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    items: ['Upload & manage transactions', 'Health scorecards', 'Tailored recommendations', 'Early warning alerts'],
  },
  {
    role: 'Risk Analyst',
    color: 'bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
    items: ['Full risk prediction suite', 'Sector analytics', 'Portfolio risk trends', 'Exportable reports'],
  },
  {
    role: 'Program Manager',
    color: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    items: ['Portfolio overview', 'Sector & province maps', 'Aggregate reports', 'SME directory'],
  },
]

const stats = [
  { value: '14', label: 'Integrated modules' },
  { value: '6',  label: 'KPI-based risk factors' },
  { value: '5',  label: 'User roles' },
  { value: 'Real-time', label: 'Alert engine' },
]

function Icon({ path, className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

export default function Landing() {
  const { theme, toggle: toggleTheme } = useTheme()
  const { lang, toggle: toggleLang } = useLang()
  const { t } = useTranslation()

  const waveFill = theme === 'dark' ? '#111827' : 'white'

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 font-sans transition-colors">

      {/* Floating Nav */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="w-full max-w-5xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg shadow-black/10 px-5 py-3 flex items-center justify-between">
          <LogoCompact markColor="#2563eb" fineColor={theme === 'dark' ? '#ffffff' : '#1e293b'} smeColor="#2563eb" size="md" />
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <span className={lang === 'en' ? 'opacity-100 font-bold' : 'opacity-40'}>EN</span>
              <span className="opacity-30">|</span>
              <span className={lang === 'rw' ? 'opacity-100 font-bold' : 'opacity-40'}>RW</span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {theme === 'dark'
                ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-5.66l-.71.71M6.34 17.66l-.71.71M17.66 17.66l-.71-.71M6.34 6.34l-.71-.71M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" /></svg>
              }
            </button>
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {t('auth.signIn')}
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-xl transition shadow-sm"
            >
              Get started
            </Link>
          </div>
        </nav>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 40%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 75% 70%, #6366f1 0%, transparent 50%)' }} />
        <div className="relative max-w-6xl mx-auto px-6 pt-36 pb-24 md:pt-48 md:pb-36 text-center">
          <span className="inline-block mb-4 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-300 text-xs font-semibold tracking-wide uppercase">
            Financial Intelligence for Rwanda's SMEs
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Predict risk.<br />
            <span className="text-primary-400">Protect SMEs.</span><br />
            Grow the economy.
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-300 mb-10">
            FINE SME uses transaction-level data to score financial sustainability, flag early warnings, and generate credit assessments — giving lenders and advisors the intelligence to act before it's too late.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-semibold text-base transition shadow-lg shadow-primary-900/40"
            >
              Start for free
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base border border-white/20 transition"
            >
              {t('auth.signIn')}
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 30C1440 30 1080 0 720 0C360 0 0 30 0 30L0 60Z" fill={waveFill} />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-primary-600">{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Everything you need in one platform</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">From raw transaction data to credit decisions — all 14 modules work together in a single workflow.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md dark:hover:shadow-gray-900/40 transition">
                <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <Icon path={f.icon} className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">How it works</h2>
          <p className="text-gray-500 dark:text-gray-400">Three steps from raw data to actionable insight.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Ingest transaction data',
              desc: 'Upload bank statements, mobile money records, or POS data via CSV or manual entry. FINE SME normalises it all into a unified ledger.',
              icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
            },
            {
              step: '02',
              title: 'Score & analyse',
              desc: 'The risk engine computes burn rate, cash runway, revenue volatility, and inflow trend — then maps them to liquidity and sustainability scores.',
              icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z',
            },
            {
              step: '03',
              title: 'Act on insights',
              desc: 'Lenders get credit ratings. Advisors get recommendations. Program managers get portfolio overviews. Everyone gets the right view for their role.',
              icon: 'M13 10V3L4 14h7v7l9-11h-7z',
            },
          ].map(s => (
            <div key={s.step} className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Role-based views */}
      <section className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Tailored for every role</h2>
            <p className="text-gray-500 dark:text-gray-400">Each user sees only what's relevant to their job — no noise, no clutter.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map(r => (
              <div key={r.role} className={`rounded-2xl border p-6 ${r.color}`}>
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${r.badge}`}>
                  {r.role}
                </span>
                <ul className="space-y-2">
                  {r.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <svg className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-primary-600 to-primary-800 text-white text-center px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to get started?</h2>
        <p className="text-primary-200 mb-8 max-w-md mx-auto text-lg">
          Join lenders, advisors, and analysts already using FINE SME to protect Rwanda's growing SME sector.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white text-primary-700 font-semibold hover:bg-primary-50 transition shadow-lg"
          >
            Create an account
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition"
          >
            {t('auth.signIn')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <LogoCompact markColor="#2563eb" fineColor="#ffffff" smeColor="#93c5fd" size="sm" />
          <p className="text-xs text-center">Financial Intelligence for SME Empowerment — Rwanda</p>
          <div className="flex gap-4 text-xs">
            <Link to="/login" className="hover:text-white transition">{t('auth.signIn')}</Link>
            <Link to="/register" className="hover:text-white transition">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
