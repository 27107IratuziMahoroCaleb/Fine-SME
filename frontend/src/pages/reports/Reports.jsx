import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { reportsApi, smesApi } from '../../services/api'

const REPORT_TYPES = [
  { value: 'portfolio',     label: 'Portfolio Overview' },
  { value: 'sme_risk',      label: 'SME Risk Report' },
  { value: 'early_warning', label: 'Early Warning Summary' },
  { value: 'sector',        label: 'Sector Analysis' },
  { value: 'executive',     label: 'Executive Summary' },
]

const RISK_COLORS = {
  low:      'bg-green-100 text-green-700',
  medium:   'bg-yellow-100 text-yellow-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

function parseDateStr(str) {
  if (!str) return null
  const iso = String(str).replace(' ', 'T').replace(/(\.\d{6})/, (m) => m.slice(0, 4))
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

function fmtDate(str, opts = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) {
  const d = parseDateStr(str)
  return d ? d.toLocaleString('en-US', opts) : '—'
}

function RiskBadge({ level }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${RISK_COLORS[level] || 'bg-gray-100 text-gray-500'}`}>
      {level || 'N/A'}
    </span>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent || 'text-gray-900 dark:text-white'}`}>{value ?? '—'}</p>
    </div>
  )
}

function SectionTitle({ children }) {
  return <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{children}</p>
}

function Th({ children, center }) {
  return <th className={`pb-2 text-xs font-medium text-gray-400 dark:text-gray-500 ${center ? 'text-center' : 'text-left'}`}>{children}</th>
}
function Td({ children, center, bold }) {
  return <td className={`py-2 text-sm ${bold ? 'font-medium' : ''} text-gray-700 dark:text-gray-300 ${center ? 'text-center' : ''}`}>{children}</td>
}

function PortfolioReport({ data }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Active SMEs" value={data.total_smes} />
        <StatCard label="Active Alerts" value={data.active_alerts}
          accent={data.active_alerts > 0 ? 'text-orange-600' : undefined} />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">Generated {fmtDate(data.generated_at)}</p>
    </div>
  )
}

function SMERiskReport({ data }) {
  const sme = data.sme || {}
  return (
    <div className="space-y-5">
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 grid grid-cols-2 gap-3">
        {[['SME Name', sme.name], ['Sector', sme.sector], ['Province', sme.province], ['Size', sme.size]].map(([lbl, val]) => (
          <div key={lbl}>
            <p className="text-xs text-gray-400 dark:text-gray-500">{lbl}</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white mt-0.5 capitalize">{val || '—'}</p>
          </div>
        ))}
      </div>
      <div>
        <SectionTitle>Prediction History</SectionTitle>
        {!(data.predictions?.length) ? <p className="text-sm text-gray-400 dark:text-gray-500">No predictions found.</p> : (
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 dark:border-gray-700">
              <Th>Date</Th><Th>Risk Score</Th><Th>Level</Th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {data.predictions.map((p, i) => (
                <tr key={i}>
                  <Td>{fmtDate(p.date, { day: 'numeric', month: 'short', year: 'numeric' })}</Td>
                  <Td>{typeof p.score === 'number' ? p.score.toFixed(1) : '—'}</Td>
                  <Td><RiskBadge level={p.level?.value ?? p.level} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function EarlyWarningReport({ data, expand }) {
  const alerts = data.alerts || []
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Active" value={data.active_alerts} />
        <StatCard label="Critical" value={data.critical} accent={data.critical > 0 ? 'text-red-600' : undefined} />
        <StatCard label="High" value={data.high} accent={data.high > 0 ? 'text-orange-600' : undefined} />
      </div>
      <div>
        <SectionTitle>Active Alerts ({alerts.length})</SectionTitle>
        {!alerts.length ? <p className="text-sm text-gray-400 dark:text-gray-500">No active alerts.</p> : (
          <div className={`space-y-2 pr-1 ${expand ? '' : 'max-h-64 overflow-y-auto'}`}>
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start justify-between gap-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{a.title}</p>
                  {a.message && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.message}</p>}
                </div>
                <RiskBadge level={a.severity?.value ?? a.severity} />
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">Generated {fmtDate(data.generated_at)}</p>
    </div>
  )
}

function SectorReport({ data }) {
  const sectors = data.sectors || []
  return (
    <div className="space-y-4">
      <table className="w-full">
        <thead><tr className="border-b border-gray-100 dark:border-gray-700">
          <Th>Sector</Th>
          <Th center>SMEs</Th><Th center>Low</Th><Th center>Medium</Th><Th center>High</Th><Th center>Critical</Th>
        </tr></thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
          {sectors.map((s, i) => (
            <tr key={i}>
              <Td bold>{s.sector}</Td>
              <Td center>{s.smes}</Td>
              <Td center><span className="text-green-600">{s.low || 0}</span></Td>
              <Td center><span className="text-yellow-600">{s.medium || 0}</span></Td>
              <Td center><span className="text-orange-600">{s.high || 0}</span></Td>
              <Td center><span className="text-red-600">{s.critical || 0}</span></Td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {data.total_smes} SMEs across {sectors.length} sectors · Generated {fmtDate(data.generated_at)}
      </p>
    </div>
  )
}

function ExecutiveReport({ data }) {
  const dist = data.risk_distribution || {}
  const topAtRisk = data.top_at_risk || []
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Active SMEs" value={data.total_smes} />
        <StatCard label="Active Alerts" value={data.active_alerts}
          accent={data.active_alerts > 0 ? 'text-orange-600' : undefined} />
      </div>
      <div>
        <SectionTitle>Risk Distribution</SectionTitle>
        <div className="grid grid-cols-4 gap-2">
          {['low', 'medium', 'high', 'critical'].map(level => (
            <div key={level} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dist[level] || 0}</p>
              <div className="mt-1"><RiskBadge level={level} /></div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SectionTitle>Top 5 At-Risk SMEs</SectionTitle>
        {!topAtRisk.length ? <p className="text-sm text-gray-400 dark:text-gray-500">No data.</p> : (
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 dark:border-gray-700">
              <Th>SME</Th><Th>Sector</Th><Th>Province</Th><Th>Score</Th><Th>Level</Th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {topAtRisk.map((s, i) => (
                <tr key={i}>
                  <Td bold>{s.name}</Td>
                  <Td>{s.sector}</Td>
                  <Td>{s.province}</Td>
                  <Td>{s.score?.toFixed(1)}</Td>
                  <Td><RiskBadge level={s.level} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">Generated {fmtDate(data.generated_at)}</p>
    </div>
  )
}

const RENDERERS = {
  portfolio:     PortfolioReport,
  sme_risk:      SMERiskReport,
  early_warning: EarlyWarningReport,
  sector:        SectorReport,
  executive:     ExecutiveReport,
}

function ReportView({ detail, expand }) {
  const type = detail.type?.value ?? detail.type
  const Renderer = RENDERERS[type]
  if (!Renderer) return <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">No renderer for "{type}".</p>
  return <Renderer data={detail.data || {}} expand={expand} />
}

function FineSMELogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0"  y="16" width="8" height="16" rx="2" fill="#2563eb" />
        <rect x="12" y="9"  width="8" height="23" rx="2" fill="#2563eb" />
        <rect x="24" y="0"  width="8" height="32" rx="2" fill="#2563eb" />
      </svg>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#1e3a8a', letterSpacing: '-0.03em', lineHeight: 1 }}>FINE</span>
          <span style={{ width: 1.5, height: 13, background: '#cbd5e1', borderRadius: 1 }} />
          <span style={{ fontWeight: 600, fontSize: 18, color: '#2563eb', letterSpacing: '0.05em', lineHeight: 1 }}>SME</span>
        </div>
        <p style={{ fontSize: 9, color: '#6b7280', letterSpacing: '0.04em', marginTop: 3, lineHeight: 1 }}>
          Financial Sustainability Intelligence
        </p>
      </div>
    </div>
  )
}

function PrintDocument({ detail }) {
  const printDate = new Date()
  const printDateStr = printDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#111827', padding: '40px 48px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #2563eb', paddingBottom: 16, marginBottom: 28 }}>
        <FineSMELogo />
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>Report Date</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{printDateStr}</p>
          <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, letterSpacing: '0.05em' }}>CONFIDENTIAL</p>
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          Official Report
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>{detail.title}</h1>
        <div style={{ width: 48, height: 3, backgroundColor: '#2563eb', borderRadius: 2, marginTop: 10 }} />
      </div>
      <div style={{ flex: 1 }}>
        <ReportView detail={detail} expand />
      </div>
      <div style={{ borderTop: '1px solid #d1d5db', paddingTop: 24, marginTop: 40 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
          Authorized Signatures
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
          {['Prepared by', 'Reviewed by', 'Approved by'].map(label => (
            <div key={label}>
              <div style={{ borderBottom: '1px solid #374151', height: 36, marginBottom: 6 }} />
              <p style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{label}</p>
              <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Name &amp; Signature</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <p style={{ fontSize: 10, color: '#6b7280', whiteSpace: 'nowrap' }}>Date:</p>
                <div style={{ borderBottom: '1px solid #9ca3af', flex: 1, height: 16 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 10, color: '#9ca3af' }}>FINE SME — Financial Sustainability Intelligence System · For authorized use only</p>
        <p style={{ fontSize: 10, color: '#9ca3af' }}>Printed {printDate.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      </div>
    </div>
  )
}

export default function Reports() {
  const { data: reports, loading, refetch } = useApi(() => reportsApi.list())
  const { data: smes } = useApi(() => smesApi.list({}))
  const { t } = useTranslation()
  const [type, setType] = useState('portfolio')
  const [smeId, setSmeId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)

  async function generate() {
    setGenerating(true)
    try {
      const res = await reportsApi.generate(type, smeId || null)
      setDetail(res.data)
      setSelected(res.data.id)
      refetch()
    } finally { setGenerating(false) }
  }

  async function viewReport(id) {
    const res = await reportsApi.get(id)
    setDetail(res.data)
    setSelected(id)
  }

  if (loading) return <AppLayout><Spinner /></AppLayout>

  return (
    <AppLayout>
      <div className="print:hidden">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.reports.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.reports.subtitle')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('page.reports.generate')}</h3>
          <div className="flex gap-3 flex-wrap">
            <select value={type} onChange={e => setType(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm">
              {REPORT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {type === 'sme_risk' && (
              <select value={smeId} onChange={e => setSmeId(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm">
                <option value="">Select SME…</option>
                {(smes || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            <Button onClick={generate} loading={generating}>{t('page.reports.generate')}</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('page.reports.generated')}</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {(!reports || reports.length === 0) && (
                <p className="px-6 py-8 text-sm text-gray-400 dark:text-gray-500 text-center">{t('page.reports.none')}</p>
              )}
              {(reports || []).map(r => (
                <button key={r.id} onClick={() => viewReport(r.id)}
                  className={`w-full text-left px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selected === r.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{r.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                    {r.type?.replace('_', ' ')} · {fmtDate(r.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            {detail ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{detail.title}</h3>
                  <button onClick={() => window.print()}
                    className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    {t('common.print')}
                  </button>
                </div>
                <ReportView detail={detail} />
              </>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <p className="text-gray-400 dark:text-gray-500">{t('page.reports.selectPrompt')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {detail && (
        <div className="hidden print:block">
          <PrintDocument detail={detail} />
        </div>
      )}
    </AppLayout>
  )
}
