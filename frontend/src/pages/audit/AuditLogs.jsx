import { useRef, useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PrintDocument from '../../components/ui/PrintDocument'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { exportPdf } from '../../utils/exportPdf'
import { auditApi } from '../../services/api'

const ACTION_STYLES = {
  create: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  update: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  delete: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  login:  'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
  logout: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
}
function actionStyle(action) {
  const key = Object.keys(ACTION_STYLES).find(k => (action || '').toLowerCase().includes(k))
  return ACTION_STYLES[key] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
}

const S = {
  sectionTitle: { fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0' },
  th: { fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px 8px 0', borderBottom: '1px solid #e5e7eb', textAlign: 'left' },
  td: { fontSize: 11, color: '#374151', padding: '6px 8px 6px 0', borderBottom: '1px solid #f3f4f6' },
  tdMono: { fontSize: 10, fontFamily: 'monospace', color: '#374151', padding: '6px 8px 6px 0', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' },
  statBox: { background: '#f9fafb', borderRadius: 8, padding: '12px 14px', textAlign: 'center' },
}

function AuditPrintContent({ logs, counts }) {
  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
        {[
          ['Total Events', counts.total, '#111827'],
          ['Creates', counts.creates, '#15803d'],
          ['Updates', counts.updates, '#1d4ed8'],
          ['Deletes', counts.deletes, counts.deletes > 0 ? '#dc2626' : '#111827'],
        ].map(([label, value, color]) => (
          <div key={label} style={S.statBox}>
            <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 4px 0' }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Log table */}
      <p style={S.sectionTitle}>Activity Log ({logs.length} events)</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Timestamp', 'User', 'Action', 'Resource', 'Description'].map(h => (
              <th key={h} style={S.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.length === 0
            ? <tr><td colSpan={5} style={{ ...S.td, color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>No logs.</td></tr>
            : logs.map((l, i) => (
              <tr key={i}>
                <td style={S.td}>{new Date(l.created_at).toLocaleString()}</td>
                <td style={S.td}>{l.user_id ?? 'System'}</td>
                <td style={S.tdMono}>{l.action}</td>
                <td style={S.td}>{l.resource_type}{l.resource_id ? ` #${l.resource_id}` : ''}</td>
                <td style={{ ...S.td, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.description || '—'}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}

export default function AuditLogs() {
  const { data: logs, loading } = useApi(() => auditApi.list({ limit: 100 }))
  const { t } = useTranslation()
  const printRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    if (!printRef.current) return
    setExporting(true)
    try {
      await exportPdf(printRef.current, `audit_log_${new Date().toISOString().slice(0, 10)}.pdf`)
    } finally { setExporting(false) }
  }

  if (loading) return <AppLayout><Spinner /></AppLayout>

  const counts = (logs || []).reduce((acc, l) => {
    acc.total++
    const action = (l.action || '').toLowerCase()
    if (action.includes('create')) acc.creates++
    if (action.includes('update')) acc.updates++
    if (action.includes('delete')) acc.deletes++
    return acc
  }, { total: 0, creates: 0, updates: 0, deletes: 0 })

  return (
    <AppLayout>
      {/* Hidden formal print document */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px', pointerEvents: 'none' }}>
        <PrintDocument ref={printRef} title="Security & Audit Log Report" subtitle="Comprehensive system activity trail">
          <AuditPrintContent logs={logs || []} counts={counts} />
        </PrintDocument>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.audit.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.audit.subtitle')}</p>
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
          { label: 'Total Events', value: counts.total,   accent: '' },
          { label: 'Creates',      value: counts.creates, accent: 'text-green-600 dark:text-green-400' },
          { label: 'Updates',      value: counts.updates, accent: 'text-blue-600 dark:text-blue-400' },
          { label: 'Deletes',      value: counts.deletes, accent: counts.deletes > 0 ? 'text-red-600 dark:text-red-400' : '' },
        ].map(({ label, value, accent }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${accent || 'text-gray-900 dark:text-white'}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Activity Log</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Last {(logs || []).length} events</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
              <tr>
                {['Timestamp', 'User', 'Action', 'Resource', 'Description'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {(!logs || logs.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No audit logs yet.</td></tr>
              )}
              {(logs || []).map(l => (
                <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {l.user_id ?? <span className="text-gray-400 dark:text-gray-500 font-normal">System</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-xs px-2 py-0.5 rounded font-medium ${actionStyle(l.action)}`}>{l.action}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {l.resource_type}{l.resource_id ? ` #${l.resource_id}` : ''}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{l.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
