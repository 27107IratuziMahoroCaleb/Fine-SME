import { useRef, useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import PrintDocument from '../../components/ui/PrintDocument'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { exportPdf } from '../../utils/exportPdf'
import { smesApi, predictionsApi } from '../../services/api'

const IMPACT_STYLES = {
  high:   'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30',
  medium: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30',
  low:    'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30',
}

const S = {
  sectionTitle: { fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px 0' },
  metricBox: { background: '#f9fafb', borderRadius: 8, padding: '12px 14px' },
  metricLabel: { fontSize: 10, color: '#9ca3af', margin: '0 0 4px 0' },
  metricValue: { fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 },
  factorChip: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, borderRadius: 20, padding: '5px 12px', border: '1px solid #fde68a', background: '#fef9c3', color: '#854d0e', margin: '0 6px 6px 0' },
}

function SectionTitle({ children }) {
  return <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{children}</p>
}
function MetricBox({ label, value }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{value ?? '—'}</p>
    </div>
  )
}

function PredictionPrintContent({ p, smeName }) {
  const score = Number(p.overall_risk_score)
  const scoreColor = score >= 70 ? '#ef4444' : score >= 50 ? '#eab308' : '#22c55e'
  const level = p.overall_risk_level?.value ?? p.overall_risk_level ?? ''
  const metrics = [
    ['Liquidity Risk', `${Number(p.liquidity_risk_score).toFixed(0)} / 100`],
    ['Sustainability Risk', `${Number(p.sustainability_risk_score).toFixed(0)} / 100`],
    ['Burn Rate', `${(Number(p.burn_rate) * 100).toFixed(0)}%`],
    ['Cash Runway', `${p.cash_runway_days} days`],
    ['30-Day Stress', `${(Number(p.liquidity_stress_30d) * 100).toFixed(0)}%`],
    ['60-Day Stress', `${(Number(p.liquidity_stress_60d) * 100).toFixed(0)}%`],
    ['6-Month Risk', `${(Number(p.sustainability_risk_6m) * 100).toFixed(0)}%`],
    ['Revenue Volatility', `${(Number(p.revenue_volatility) * 100).toFixed(0)}%`],
  ]
  return (
    <div>
      {/* Hero */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#f9fafb', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
        <div>
          {smeName && <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 4px 0' }}>SME</p>}
          {smeName && <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>{smeName}</p>}
          <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Prediction Date: {p.prediction_date}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 38, fontWeight: 900, color: '#111827', lineHeight: 1, margin: 0 }}>{score.toFixed(0)}</p>
          <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 8px 0' }}>Risk Score / 100</p>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: score >= 70 ? '#fee2e2' : score >= 50 ? '#fef9c3' : '#dcfce7', color: score >= 70 ? '#dc2626' : score >= 50 ? '#854d0e' : '#15803d', textTransform: 'capitalize' }}>{level}</span>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${score}%`, background: scoreColor, borderRadius: 4 }} />
        </div>
      </div>

      {/* Key metrics */}
      <p style={S.sectionTitle}>Key Metrics</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {metrics.slice(0, 4).map(([l, v]) => (
          <div key={l} style={S.metricBox}>
            <p style={S.metricLabel}>{l}</p>
            <p style={S.metricValue}>{v}</p>
          </div>
        ))}
      </div>

      <p style={S.sectionTitle}>Stress &amp; Forecast</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
        {metrics.slice(4).map(([l, v]) => (
          <div key={l} style={S.metricBox}>
            <p style={S.metricLabel}>{l}</p>
            <p style={S.metricValue}>{v}</p>
          </div>
        ))}
      </div>

      {/* Risk factors */}
      {p.risk_factors?.length > 0 && (
        <div>
          <p style={S.sectionTitle}>Risk Factors</p>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {p.risk_factors.map((f, i) => (
              <span key={i} style={S.factorChip}>{f.factor}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PredictionCard({ p, smeName }) {
  const printRef = useRef(null)
  const [exporting, setExporting] = useState(false)
  const score = Number(p.overall_risk_score)
  const scoreColor = score >= 70 ? 'bg-red-500' : score >= 50 ? 'bg-yellow-400' : 'bg-green-500'

  async function handleExport() {
    if (!printRef.current) return
    setExporting(true)
    try {
      await exportPdf(
        printRef.current,
        `prediction_${(smeName || 'report').replace(/\s+/g, '_')}_${p.prediction_date}.pdf`
      )
    } finally { setExporting(false) }
  }

  return (
    <>
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px', pointerEvents: 'none' }}>
        <PrintDocument ref={printRef} title={`Risk Prediction — ${smeName || ''}`} subtitle="Sustainability Risk Prediction Report">
          <PredictionPrintContent p={p} smeName={smeName} />
        </PrintDocument>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-1">Sustainability Risk Prediction</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{p.prediction_date}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 text-xs text-primary-600 border border-primary-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {exporting ? 'Exporting…' : 'Download PDF'}
            </button>
            <div className="text-right">
              <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">{score.toFixed(0)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Risk Score / 100</p>
            </div>
            <Badge value={p.overall_risk_level} />
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <SectionTitle>Overall Risk Level</SectionTitle>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{score.toFixed(0)} / 100</span>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${scoreColor} transition-all`} style={{ width: `${score}%` }} />
            </div>
          </div>
          <div>
            <SectionTitle>Key Metrics</SectionTitle>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricBox label="Liquidity Risk" value={`${Number(p.liquidity_risk_score).toFixed(0)} / 100`} />
              <MetricBox label="Sustainability Risk" value={`${Number(p.sustainability_risk_score).toFixed(0)} / 100`} />
              <MetricBox label="Burn Rate" value={`${(Number(p.burn_rate) * 100).toFixed(0)}%`} />
              <MetricBox label="Cash Runway" value={`${p.cash_runway_days} days`} />
            </div>
          </div>
          <div>
            <SectionTitle>Stress &amp; Forecast</SectionTitle>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricBox label="30-Day Stress" value={`${(Number(p.liquidity_stress_30d) * 100).toFixed(0)}%`} />
              <MetricBox label="60-Day Stress" value={`${(Number(p.liquidity_stress_60d) * 100).toFixed(0)}%`} />
              <MetricBox label="6-Month Risk" value={`${(Number(p.sustainability_risk_6m) * 100).toFixed(0)}%`} />
              <MetricBox label="Revenue Volatility" value={`${(Number(p.revenue_volatility) * 100).toFixed(0)}%`} />
            </div>
          </div>
          {p.risk_factors?.length > 0 && (
            <div>
              <SectionTitle>Risk Factors ({p.risk_factors.length})</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {p.risk_factors.map((f, i) => {
                  const impact = (f.impact || '').toLowerCase()
                  return (
                    <span key={i} className={`inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 font-medium ${IMPACT_STYLES[impact] || IMPACT_STYLES.medium}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0" />
                      {f.factor}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function Predictions() {
  const { data: smes, loading } = useApi(() => smesApi.list({}))
  const { t } = useTranslation()
  const [selected, setSelected] = useState(null)
  const { data: preds, loading: predsLoading, refetch } = useApi(
    () => selected ? predictionsApi.list(selected) : Promise.resolve({ data: [] }),
    [selected]
  )
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState('')

  async function run() {
    if (!selected) return
    setRunning(true); setRunError('')
    try { await predictionsApi.run(selected); refetch() }
    catch (e) { setRunError(e.response?.data?.detail || 'Prediction failed') }
    finally { setRunning(false) }
  }

  if (loading) return <AppLayout><Spinner /></AppLayout>

  const selectedName = (smes || []).find(s => String(s.id) === String(selected))?.name

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.predictions.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.predictions.subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Run Prediction</h3>
        <div className="flex gap-3 flex-wrap">
          <select
            value={selected || ''}
            onChange={e => setSelected(e.target.value || null)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
          >
            <option value="">{t('common.selectSme')}</option>
            {(smes || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <Button onClick={run} loading={running} disabled={!selected}>{t('common.runPrediction')}</Button>
        </div>
        {runError && <p className="text-sm text-red-500 mt-3 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{runError}</p>}
      </div>

      {predsLoading ? <Spinner /> : (
        <div className="space-y-6">
          {(!preds || preds.length === 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <p className="text-gray-400">Select an SME and run a prediction to see results.</p>
            </div>
          )}
          {(preds || []).map(p => (
            <PredictionCard key={p.id} p={p} smeName={selectedName} />
          ))}
        </div>
      )}
    </AppLayout>
  )
}
