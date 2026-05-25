import AppLayout from '../../components/layout/AppLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { recommendationsApi } from '../../services/api'

const CATEGORY_COLORS = {
  cash_flow:     'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  expense:       'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
  revenue:       'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  working_capital:'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
  debt:          'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  growth:        'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400',
  pricing:       'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  inventory:     'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
}

export default function Recommendations() {
  const { data: recs, loading, refetch } = useApi(() => recommendationsApi.list({}))
  const { t } = useTranslation()

  async function updateStatus(id, status) {
    await recommendationsApi.update(id, { status }); refetch()
  }

  if (loading) return <AppLayout><Spinner /></AppLayout>

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.recommendations.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{recs?.length ?? 0} {t('page.recommendations.subtitle')}</p>
      </div>

      <div className="space-y-4">
        {(!recs || recs.length === 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-400">No recommendations yet. Run a prediction on an SME to generate recommendations.</p>
          </div>
        )}
        {(recs || []).map(r => (
          <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[r.category] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    {r.category.replace('_', ' ')}
                  </span>
                  <Badge value={r.status} />
                  {r.sme_name && <span className="text-xs text-gray-400 dark:text-gray-500">{r.sme_name}</span>}
                  <span className="text-xs text-gray-400 dark:text-gray-500">Priority {r.priority}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{r.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{r.description}</p>
                {r.action_steps && (
                  <details className="text-sm text-gray-500 dark:text-gray-400">
                    <summary className="cursor-pointer text-primary-600 font-medium">View action steps</summary>
                    <pre className="mt-2 whitespace-pre-wrap font-sans text-xs bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{r.action_steps}</pre>
                  </details>
                )}
                {r.expected_impact && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">Expected: {r.expected_impact}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {r.status === 'pending' && (
                  <Button className="text-xs py-1" onClick={() => updateStatus(r.id, 'in_progress')}>{t('common.start')}</Button>
                )}
                {r.status === 'in_progress' && (
                  <Button className="text-xs py-1" onClick={() => updateStatus(r.id, 'implemented')}>{t('common.markDone')}</Button>
                )}
                {r.status === 'pending' && (
                  <Button variant="secondary" className="text-xs py-1" onClick={() => updateStatus(r.id, 'dismissed')}>{t('common.dismiss')}</Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
