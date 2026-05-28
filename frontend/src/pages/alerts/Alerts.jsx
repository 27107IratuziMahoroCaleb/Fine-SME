import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import PrintDocument from '../../components/ui/PrintDocument'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { exportPdf } from '../../utils/exportPdf'
import { alertsApi } from '../../services/api'

const STATUS_TABS = ['all', 'active', 'acknowledged', 'resolved']

const SEVERITY_BORDER = {
  critical: 'border-l-red-500',
  high:     'border-l-orange-400',
  medium:   'border-l-yellow-400',
  low:      'border-l-green-400',
}

const SEV_CHIP_STYLE = {
  critical: { background: '#fee2e2', color: '#dc2626' },
  high:     { background: '#ffedd5', color: '#c2410c' },
  medium:   { background: '#fef9c3', color: '#854d0e' },
  low:      { background: '#dcfce7', color: '#15803d' },
}

const S = {
  sectionTitle: { fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0' },
  statBox: { background: '#f9fafb', borderRadius: 8, padding: '12px 14px', textAlign: 'center' },
  statLabel: { fontSize: 10, color: '#9ca3af', margin: '0 0 4px 0' },
  statValue: { fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 },
  alertRow: { borderBottom: '1px solid #f3f4f6', padding: '10px 0' },
  chip: { display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12, textTransform: 'capitalize' },
}

function AlertsPrintContent({ alerts, counts }) {
  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
        {[
          ['Total', counts.total, '#111827'],
          ['Active', counts.active, counts.active > 0 ? '#dc2626' : '#111827'],
          ['Critical', counts.critical, counts.critical > 0 ? '#dc2626' : '#111827'],
          ['Acknowledged', counts.acknowledged, '#d97706'],
        ].map(([label, value, color]) => (
          <div key={label} style={S.statBox}>
            <p style={S.statLabel}>{label}</p>
            <p style={{ ...S.statValue, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Alert list */}
      <p style={S.sectionTitle}>Alert Details ({alerts.length})</p>
      {alerts.length === 0
        ? <p style={{ fontSize: 12, color: '#9ca3af' }}>No alerts.</p>
        : alerts.map((a, i) => {
          const sev = ((a.severity?.value ?? a.severity) || '').toLowerCase()
          const chipStyle = SEV_CHIP_STYLE[sev] || { background: '#f3f4f6', color: '#374151' }
          return (
            <div key={i} style={S.alertRow}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ ...S.chip, ...chipStyle }}>{sev}</span>
                  {a.sme_name && <span style={{ fontSize: 11, color: '#9ca3af' }}>{a.sme_name}</span>}
                </div>
                <span style={{ fontSize: 10, color: '#9ca3af' }}>{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px 0' }}>{a.title}</p>
              {a.description && <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{a.description}</p>}
              {a.recommended_action && <p style={{ fontSize: 11, color: '#2563eb', marginTop: 4, margin: '4px 0 0 0' }}>Recommendation: {a.recommended_action}</p>}
            </div>
          )
        })
      }
    </div>
  )
}

export default function Alerts() {
  const [searchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState('active')
  const { t } = useTranslation()
  const params = { status: statusFilter === 'all' ? undefined : statusFilter, sme_id: searchParams.get('sme') || undefined }
  const { data: alerts, loading, refetch } = useApi(() => alertsApi.list(params), [statusFilter])
  const { data: allAlerts } = useApi(() => alertsApi.list({}))
  const printRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  async function acknowledge(id) { await alertsApi.acknowledge(id); refetch() }
  async function resolve(id) { await alertsApi.resolve(id); refetch() }

  const counts = (allAlerts || []).reduce((acc, a) => {
    const sev = ((a.severity?.value ?? a.severity) || '').toLowerCase()
    const stat = ((a.status?.value ?? a.status) || '').toLowerCase()
    acc.total++
    if (stat === 'active') acc.active++
    if (sev === 'critical') acc.critical++
    if (stat === 'acknowledged') acc.acknowledged++
    if (stat === 'resolved') acc.resolved++
    return acc
  }, { total: 0, active: 0, critical: 0, acknowledged: 0, resolved: 0 })

  async function handleExport() {
    if (!printRef.current) return
    setExporting(true)
    try {
      await exportPdf(printRef.current, `alerts_report_${new Date().toISOString().slice(0, 10)}.pdf`)
    } finally { setExporting(false) }
  }

  return (
    <AppLayout>
      {/* Hidden formal print document */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px', pointerEvents: 'none' }}>
        <PrintDocument ref={printRef} title="Early Warning Alerts Report" subtitle="Active alert summary across all SMEs">
          <AlertsPrintContent alerts={allAlerts || []} counts={counts} />
        </PrintDocument>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.alerts.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.alerts.subtitle')}</p>
        </div>
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
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Alerts',   value: counts.total,        accent: '' },
          { label: 'Active',         value: counts.active,       accent: counts.active > 0 ? 'text-red-600 dark:text-red-400' : '' },
          { label: 'Critical',       value: counts.critical,     accent: counts.critical > 0 ? 'text-red-600 dark:text-red-400' : '' },
          { label: 'Acknowledged',   value: counts.acknowledged, accent: 'text-yellow-600 dark:text-yellow-400' },
        ].map(({ label, value, accent }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${accent || 'text-gray-900 dark:text-white'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm capitalize transition-colors font-medium ${
              statusFilter === s
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-3">
          {(!alerts || alerts.length === 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <p className="text-gray-400">No alerts found.</p>
            </div>
          )}
          {(alerts || []).map(a => {
            const sev = ((a.severity?.value ?? a.severity) || '').toLowerCase()
            return (
              <div key={a.id} className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-l-4 ${SEVERITY_BORDER[sev] || 'border-l-gray-300'} p-5`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge value={a.severity} />
                      <Badge value={a.status} />
                      {a.sme_name && <span className="text-xs text-gray-500 dark:text-gray-400">{a.sme_name}</span>}
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">{a.title}</p>
                    {a.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{a.description}</p>}
                    {a.recommended_action && (
                      <div className="flex items-start gap-2 mt-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-3 py-2">
                        <svg className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-primary-700 dark:text-primary-400">{a.recommended_action}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {a.status === 'active' && (
                      <Button variant="secondary" className="text-xs py-1" onClick={() => acknowledge(a.id)}>{t('common.acknowledge')}</Button>
                    )}
                    {a.status !== 'resolved' && (
                      <Button className="text-xs py-1" onClick={() => resolve(a.id)}>{t('common.resolve')}</Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
