import { useRef, useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Badge from '../../components/ui/Badge'
import PrintDocument from '../../components/ui/PrintDocument'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { exportPdf } from '../../utils/exportPdf'
import { smesApi, predictionsApi } from '../../services/api'

const S = {
  sectionTitle: { fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px 0' },
  scoreBarBg: { height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden', margin: '4px 0 14px 0' },
  bullet: { display: 'inline-block', width: 7, height: 7, borderRadius: '50%', marginRight: 8, flexShrink: 0 },
  listItem: { display: 'flex', alignItems: 'flex-start', fontSize: 12, color: '#374151', marginBottom: 8, lineHeight: 1.5 },
}

function ScorecardPrintContent({ sc }) {
  const overall = sc.overall_score
  const gaugeColor = overall >= 70 ? '#22c55e' : overall >= 50 ? '#eab308' : '#ef4444'
  const level = sc.risk_level?.value ?? sc.risk_level ?? ''
  const dims = [
    ['Liquidity', sc.liquidity_score],
    ['Profitability', sc.profitability_score],
    ['Revenue Stability', sc.stability_score],
    ['Growth', sc.growth_score],
  ]
  return (
    <div>
      {/* Hero */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', borderRadius: 10, padding: '16px 20px', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 4px 0' }}>SME</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>{sc.sme_name}</p>
          <span style={{ display: 'inline-block', marginTop: 8, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: overall >= 70 ? '#dcfce7' : overall >= 50 ? '#fef9c3' : '#fee2e2', color: overall >= 70 ? '#15803d' : overall >= 50 ? '#854d0e' : '#dc2626', textTransform: 'capitalize' }}>{level}</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 100, height: 100 }}>
            <svg viewBox="0 0 36 36" style={{ width: 100, height: 100, transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3.2" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={gaugeColor} strokeWidth="3.2"
                strokeDasharray={`${overall} 100`} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{overall.toFixed(0)}</span>
              <span style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>Overall</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dimension scores */}
      <p style={S.sectionTitle}>Dimension Scores</p>
      {dims.map(([label, score]) => {
        const c = score >= 70 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'
        return (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{score.toFixed(0)}<span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 10 }}> / 100</span></span>
            </div>
            <div style={S.scoreBarBg}>
              <div style={{ height: '100%', width: `${score}%`, background: c, borderRadius: 4 }} />
            </div>
          </div>
        )
      })}

      {/* Strengths & Weaknesses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
        <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '14px 16px' }}>
          <p style={{ ...S.sectionTitle, color: '#15803d', margin: '0 0 10px 0' }}>Strengths</p>
          {sc.strengths.length === 0
            ? <p style={{ fontSize: 12, color: '#9ca3af' }}>None identified</p>
            : sc.strengths.map((s, i) => (
              <div key={i} style={S.listItem}>
                <span style={{ ...S.bullet, background: '#22c55e', marginTop: 4 }} />
                {s}
              </div>
            ))
          }
        </div>
        <div style={{ background: '#fff1f2', borderRadius: 8, padding: '14px 16px' }}>
          <p style={{ ...S.sectionTitle, color: '#dc2626', margin: '0 0 10px 0' }}>Weaknesses</p>
          {sc.weaknesses.length === 0
            ? <p style={{ fontSize: 12, color: '#9ca3af' }}>None identified</p>
            : sc.weaknesses.map((w, i) => (
              <div key={i} style={S.listItem}>
                <span style={{ ...S.bullet, background: '#ef4444', marginTop: 4 }} />
                {w}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{children}</p>
}
function ScoreBar({ label, score }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-red-500'
  const textColor = score >= 70 ? 'text-green-600 dark:text-green-400' : score >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500 dark:text-red-400'
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>
          {score.toFixed(0)}<span className="text-xs text-gray-400 dark:text-gray-500 font-normal"> / 100</span>
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export default function Scorecard() {
  const { data: smes, loading } = useApi(() => smesApi.list({}))
  const { t } = useTranslation()
  const [selected, setSelected] = useState(null)
  const { data: scorecard, loading: scLoading, error } = useApi(
    () => selected ? predictionsApi.scorecard(selected) : Promise.resolve({ data: null }),
    [selected]
  )
  const printRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    if (!printRef.current) return
    setExporting(true)
    try {
      await exportPdf(
        printRef.current,
        `scorecard_${scorecard?.sme_name?.replace(/\s+/g, '_') || 'report'}_${new Date().toISOString().slice(0, 10)}.pdf`
      )
    } finally { setExporting(false) }
  }

  if (loading) return <AppLayout><Spinner /></AppLayout>

  return (
    <AppLayout>
      {/* Hidden formal print document */}
      {scorecard && (
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px', pointerEvents: 'none' }}>
          <PrintDocument ref={printRef} title={`Health Scorecard — ${scorecard.sme_name}`} subtitle="SME Financial Health Scorecard Report">
            <ScorecardPrintContent sc={scorecard} />
          </PrintDocument>
        </div>
      )}

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.scorecard.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.scorecard.subtitle')}</p>
        </div>
        {scorecard && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg px-3 py-1.5 transition-colors font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting ? 'Exporting…' : 'Download PDF'}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Select SME</h3>
        <select
          value={selected || ''}
          onChange={e => setSelected(e.target.value || null)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
        >
          <option value="">{t('common.selectSme')}</option>
          {(smes || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {scLoading && <Spinner />}
      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">{error}</p>}

      {scorecard && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center gap-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide text-center">{scorecard.sme_name}</p>
              <div className="relative h-44 w-44">
                <svg viewBox="0 0 36 36" className="rotate-[-90deg] w-full h-full">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3.2" className="dark:[stroke:#374151]" />
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={scorecard.overall_score >= 70 ? '#22c55e' : scorecard.overall_score >= 50 ? '#eab308' : '#ef4444'}
                    strokeWidth="3.2"
                    strokeDasharray={`${scorecard.overall_score} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-gray-900 dark:text-white leading-none">{scorecard.overall_score.toFixed(0)}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-1">Overall</span>
                </div>
              </div>
              <Badge value={scorecard.risk_level} />
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <SectionTitle>Dimension Scores</SectionTitle>
              <ScoreBar label="Liquidity" score={scorecard.liquidity_score} />
              <ScoreBar label="Profitability" score={scorecard.profitability_score} />
              <ScoreBar label="Revenue Stability" score={scorecard.stability_score} />
              <ScoreBar label="Growth" score={scorecard.growth_score} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Strengths</h3>
              </div>
              <div className="p-6">
                {scorecard.strengths.length === 0
                  ? <p className="text-sm text-gray-400 dark:text-gray-500">None identified</p>
                  : <ul className="space-y-2.5">{scorecard.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />{s}
                    </li>
                  ))}</ul>
                }
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Weaknesses</h3>
              </div>
              <div className="p-6">
                {scorecard.weaknesses.length === 0
                  ? <p className="text-sm text-gray-400 dark:text-gray-500">None identified</p>
                  : <ul className="space-y-2.5">{scorecard.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />{w}
                    </li>
                  ))}</ul>
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {!selected && !scLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-400">Select an SME to view its health scorecard.</p>
        </div>
      )}
    </AppLayout>
  )
}
