import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { smesApi, creditApi } from '../../services/api'

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

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.credit.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.credit.subtitle')}</p>
      </div>

      <div className="flex gap-3 mb-6">
        <select value={selected || ''} onChange={e => setSelected(e.target.value || null)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm">
          <option value="">{t('common.selectSme')}</option>
          {(smes || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Button onClick={assess} loading={assessing} disabled={!selected}>{t('common.generate')} Assessment</Button>
      </div>
      {err && <p className="text-sm text-red-500 mb-4 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{err}</p>}

      <div className="space-y-6">
        {(!assessments || assessments.length === 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-400">No assessments yet. Select an SME with a prediction and click Generate.</p>
          </div>
        )}
        {(assessments || []).map(a => (
          <div key={a.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{a.sme_name}</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(a.assessment_date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{a.credit_rating}</span>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Creditworthiness</p>
                  <p className="font-bold text-primary-600">{Number(a.creditworthiness_score).toFixed(0)}/100</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {[
                ['Credit Limit', `RWF ${Number(a.recommended_credit_limit || 0).toLocaleString()}`],
                ['Interest Rate', `${Number(a.risk_adjusted_rate || 0).toFixed(1)}% p.a.`],
                ['Tenor', `${a.loan_tenor_months} months`],
                ['Monitoring', a.monitoring_frequency],
              ].map(([l, v]) => (
                <div key={l} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{l}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{v}</p>
                </div>
              ))}
            </div>
            {a.loan_structure && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Loan Structure</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{a.loan_structure}</p>
              </div>
            )}
            {a.covenant_suggestions && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Covenants</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{a.covenant_suggestions}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
