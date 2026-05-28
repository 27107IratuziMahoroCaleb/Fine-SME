import { useRef, useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import PrintDocument from '../../components/ui/PrintDocument'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { exportPdf } from '../../utils/exportPdf'
import { smesApi, creditApi } from '../../services/api'

const RATING_META = {
  AAA: { color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-800' },
  AA:  { color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-800' },
  A:   { color: 'text-teal-700 dark:text-teal-400',    bg: 'bg-teal-50 dark:bg-teal-900/20',    border: 'border-teal-200 dark:border-teal-800' },
  BBB: { color: 'text-blue-700 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20',    border: 'border-blue-200 dark:border-blue-800' },
  BB:  { color: 'text-yellow-700 dark:text-yellow-400',bg: 'bg-yellow-50 dark:bg-yellow-900/20',border: 'border-yellow-200 dark:border-yellow-800' },
  B:   { color: 'text-orange-700 dark:text-orange-400',bg: 'bg-orange-50 dark:bg-orange-900/20',border: 'border-orange-200 dark:border-orange-800' },
  CCC: { color: 'text-red-700 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20',      border: 'border-red-200 dark:border-red-800' },
}
const fallbackMeta = { color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-50 dark:bg-gray-700', border: 'border-gray-200 dark:border-gray-600' }

const S = {
  sectionTitle: { fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px 0' },
  metricBox: { background: '#f9fafb', borderRadius: 8, padding: '12px 14px' },
  metricLabel: { fontSize: 10, color: '#9ca3af', margin: '0 0 4px 0' },
  metricValue: { fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, textTransform: 'capitalize' },
  cell: { fontSize: 12, color: '#6b7280', padding: '7px 0', borderBottom: '1px solid #f3f4f6' },
  cellBold: { fontSize: 12, fontWeight: 600, color: '#111827', padding: '7px 0', borderBottom: '1px solid #f3f4f6', textAlign: 'right' },
}

function CreditPrintContent({ a }) {
  const score = Number(a.creditworthiness_score || 0)
  const df = a.decision_factors || {}
  const scoreColor = score >= 70 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'
  const factors = [
    df.burn_rate !== undefined && ['Burn Rate', `${(Number(df.burn_rate) * 100).toFixed(0)}%`],
    df.cash_runway_days !== undefined && ['Cash Runway', `${df.cash_runway_days} days`],
    df.revenue_volatility !== undefined && ['Revenue Volatility', `${(Number(df.revenue_volatility) * 100).toFixed(0)}%`],
    df.inflow_trend !== undefined && ['Inflow Trend', Number(df.inflow_trend).toFixed(2)],
    df.overall_risk_score !== undefined && ['Overall Risk Score', `${Number(df.overall_risk_score).toFixed(0)} / 100`],
  ].filter(Boolean)

  return (
    <div>
      {/* SME + Rating header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, background: '#f9fafb', borderRadius: 10, padding: '16px 20px' }}>
        <div>
          <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 4px 0' }}>SME</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{a.sme_name}</p>
          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 6, margin: '6px 0 0 0' }}>
            {new Date(a.assessment_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 38, fontWeight: 900, color: '#1e3a8a', lineHeight: 1, margin: 0 }}>{a.credit_rating}</p>
          <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 8px 0' }}>Credit Rating</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#2563eb', margin: 0 }}>{score.toFixed(0)}<span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af' }}> / 100</span></p>
          <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 0 0' }}>Creditworthiness</p>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${score}%`, background: scoreColor, borderRadius: 4 }} />
        </div>
      </div>

      {/* Loan Terms */}
      <p style={S.sectionTitle}>Loan Terms</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[
          ['Credit Limit', `RWF ${Number(a.recommended_credit_limit || 0).toLocaleString()}`],
          ['Interest Rate', `${Number(a.risk_adjusted_rate || 0).toFixed(1)}% p.a.`],
          ['Tenor', `${a.loan_tenor_months} months`],
          ['Monitoring', a.monitoring_frequency],
        ].map(([l, v]) => (
          <div key={l} style={S.metricBox}>
            <p style={S.metricLabel}>{l}</p>
            <p style={S.metricValue}>{v ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Decision Factors */}
      {factors.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={S.sectionTitle}>Decision Factors</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {factors.map(([l, v]) => (
                <tr key={l}>
                  <td style={S.cell}>{l}</td>
                  <td style={S.cellBold}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Loan Structure */}
      {a.loan_structure && (
        <div style={{ marginBottom: 20 }}>
          <p style={S.sectionTitle}>Loan Structure</p>
          <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, background: '#f9fafb', padding: '12px 14px', borderRadius: 8, margin: 0 }}>{a.loan_structure}</p>
        </div>
      )}

      {/* Covenants */}
      {a.covenant_suggestions && (
        <div>
          <p style={S.sectionTitle}>Covenant Suggestions</p>
          <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, background: '#f9fafb', padding: '12px 14px', borderRadius: 8, margin: 0 }}>{a.covenant_suggestions}</p>
        </div>
      )}
    </div>
  )
}

function SectionTitle({ children }) {
  return <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{children}</p>
}
function MetricBox({ label, value }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{value ?? '—'}</p>
    </div>
  )
}
function FactorRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-600 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}

function AssessmentCard({ a }) {
  const printRef = useRef(null)
  const [exporting, setExporting] = useState(false)
  const meta = RATING_META[a.credit_rating] || fallbackMeta
  const score = Number(a.creditworthiness_score || 0)
  const df = a.decision_factors || {}
  const scoreColor = score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-red-500'

  async function handleExport() {
    if (!printRef.current) return
    setExporting(true)
    try {
      await exportPdf(
        printRef.current,
        `credit_report_${a.sme_name?.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
      )
    } finally { setExporting(false) }
  }

  return (
    <>
      {/* Hidden formal print document */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px', pointerEvents: 'none' }}>
        <PrintDocument ref={printRef} title={`Credit Assessment — ${a.sme_name}`} subtitle="Credit Decision Support Report">
          <CreditPrintContent a={a} />
        </PrintDocument>
      </div>

      {/* Screen card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-1">Credit Assessment Report</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{a.sme_name}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {new Date(a.assessment_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
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
            <div className={`px-5 py-2 rounded-xl border-2 text-center ${meta.bg} ${meta.border}`}>
              <p className={`text-3xl font-black leading-none ${meta.color}`}>{a.credit_rating}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Credit Rating</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <SectionTitle>Creditworthiness Score</SectionTitle>
              <span className="text-xs font-bold text-gray-900 dark:text-white">{score.toFixed(0)} / 100</span>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${scoreColor} transition-all`} style={{ width: `${score}%` }} />
            </div>
          </div>
          <div>
            <SectionTitle>Loan Terms</SectionTitle>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricBox label="Credit Limit" value={`RWF ${Number(a.recommended_credit_limit || 0).toLocaleString()}`} />
              <MetricBox label="Interest Rate" value={`${Number(a.risk_adjusted_rate || 0).toFixed(1)}% p.a.`} />
              <MetricBox label="Tenor" value={`${a.loan_tenor_months} months`} />
              <MetricBox label="Monitoring" value={a.monitoring_frequency} />
            </div>
          </div>
          {Object.keys(df).length > 0 && (
            <div>
              <SectionTitle>Decision Factors</SectionTitle>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-4 pt-1 pb-1">
                {df.burn_rate !== undefined && <FactorRow label="Burn Rate" value={`${(Number(df.burn_rate) * 100).toFixed(0)}%`} />}
                {df.cash_runway_days !== undefined && <FactorRow label="Cash Runway" value={`${df.cash_runway_days} days`} />}
                {df.revenue_volatility !== undefined && <FactorRow label="Revenue Volatility" value={`${(Number(df.revenue_volatility) * 100).toFixed(0)}%`} />}
                {df.inflow_trend !== undefined && <FactorRow label="Inflow Trend" value={Number(df.inflow_trend).toFixed(2)} />}
                {df.overall_risk_score !== undefined && <FactorRow label="Overall Risk Score" value={`${Number(df.overall_risk_score).toFixed(0)} / 100`} />}
              </div>
            </div>
          )}
          {a.loan_structure && (
            <div>
              <SectionTitle>Loan Structure</SectionTitle>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 leading-relaxed">{a.loan_structure}</p>
            </div>
          )}
          {a.covenant_suggestions && (
            <div>
              <SectionTitle>Covenant Suggestions</SectionTitle>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 leading-relaxed">{a.covenant_suggestions}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function CreditAssessment() {
  const { data: smes, loading } = useApi(() => smesApi.list({}))
  const { data: assessments, loading: aLoading, refetch } = useApi(() => creditApi.list({}))
  const { t } = useTranslation()
  const [selected, setSelected] = useState(null)
  const [assessing, setAssessing] = useState(false)
  const [err, setErr] = useState('')

  async function assess() {
    if (!selected) return
    setAssessing(true); setErr('')
    try { await creditApi.assess(selected); refetch() }
    catch (e) { setErr(e.response?.data?.detail || 'Assessment failed') }
    finally { setAssessing(false) }
  }

  if (loading || aLoading) return <AppLayout><Spinner /></AppLayout>

  const total = assessments?.length ?? 0
  const avgScore = total > 0
    ? (assessments.reduce((sum, a) => sum + Number(a.creditworthiness_score || 0), 0) / total).toFixed(1)
    : '—'
  const ratings = assessments?.reduce((acc, a) => { acc[a.credit_rating] = (acc[a.credit_rating] || 0) + 1; return acc }, {}) ?? {}

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.credit.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.credit.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Assessments</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Score</p>
          <p className="text-3xl font-bold text-primary-600">{avgScore}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 col-span-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Rating Distribution</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(ratings).map(([rating, count]) => {
              const m = RATING_META[rating] || fallbackMeta
              return (
                <span key={rating} className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${m.bg} ${m.border} ${m.color}`}>
                  {rating}: {count}
                </span>
              )
            })}
            {Object.keys(ratings).length === 0 && <span className="text-sm text-gray-400">—</span>}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Generate Assessment</h3>
        <div className="flex gap-3 flex-wrap">
          <select value={selected || ''} onChange={e => setSelected(e.target.value || null)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm">
            <option value="">{t('common.selectSme')}</option>
            {(smes || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <Button onClick={assess} loading={assessing} disabled={!selected}>{t('common.generate')} Assessment</Button>
        </div>
        {err && <p className="text-sm text-red-500 mt-3 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{err}</p>}
      </div>

      <div className="space-y-6">
        {(!assessments || assessments.length === 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-400">No assessments yet. Select an SME with a prediction and click Generate.</p>
          </div>
        )}
        {(assessments || []).map(a => <AssessmentCard key={a.id} a={a} />)}
      </div>
    </AppLayout>
  )
}
