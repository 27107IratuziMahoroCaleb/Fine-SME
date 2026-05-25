import AppLayout from '../../components/layout/AppLayout'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { auditApi } from '../../services/api'

export default function AuditLogs() {
  const { data: logs, loading } = useApi(() => auditApi.list({ limit: 100 }))
  const { t } = useTranslation()

  if (loading) return <AppLayout><Spinner /></AppLayout>

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.audit.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.audit.subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              {['Timestamp', 'User', 'Action', 'Resource', 'Description'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {(!logs || logs.length === 0) && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No audit logs yet.</td></tr>
            )}
            {(logs || []).map(l => (
              <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-2.5 text-xs text-gray-400 dark:text-gray-500">{new Date(l.created_at).toLocaleString()}</td>
                <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{l.user_id ?? 'System'}</td>
                <td className="px-4 py-2.5">
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">{l.action}</span>
                </td>
                <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300 text-xs">{l.resource_type}{l.resource_id ? ` #${l.resource_id}` : ''}</td>
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-xs">{l.description || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}
