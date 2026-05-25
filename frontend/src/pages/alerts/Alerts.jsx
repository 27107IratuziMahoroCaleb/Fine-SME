import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { alertsApi } from '../../services/api'

const STATUS_TABS = ['all', 'active', 'acknowledged', 'resolved']

export default function Alerts() {
  const [searchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState('active')
  const { t } = useTranslation()
  const params = { status: statusFilter === 'all' ? undefined : statusFilter, sme_id: searchParams.get('sme') || undefined }
  const { data: alerts, loading, refetch } = useApi(() => alertsApi.list(params), [statusFilter])

  async function acknowledge(id) { await alertsApi.acknowledge(id); refetch() }
  async function resolve(id) { await alertsApi.resolve(id); refetch() }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.alerts.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.alerts.subtitle')}</p>
      </div>

      <div className="flex gap-2 mb-6">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm capitalize transition ${
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
          {(alerts || []).map(a => (
            <div key={a.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge value={a.severity} />
                    <Badge value={a.status} />
                    {a.sme_name && <span className="text-xs text-gray-500 dark:text-gray-400">{a.sme_name}</span>}
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">{a.title}</p>
                  {a.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{a.description}</p>}
                  {a.recommended_action && (
                    <p className="text-sm text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-3 py-2 mt-2">
                      💡 {a.recommended_action}
                    </p>
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
          ))}
        </div>
      )}
    </AppLayout>
  )
}
