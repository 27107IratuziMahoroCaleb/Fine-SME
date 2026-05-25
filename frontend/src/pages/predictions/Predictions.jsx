import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { smesApi, predictionsApi } from '../../services/api'

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

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.predictions.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.predictions.subtitle')}</p>
      </div>

      <div className="flex gap-3 mb-6">
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
      {runError && <p className="text-sm text-red-500 mb-4">{runError}</p>}

      {predsLoading ? <Spinner /> : (
        <div className="space-y-4">
          {(!preds || preds.length === 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <p className="text-gray-400">Select an SME and run a prediction to see results.</p>
            </div>
          )}
          {(preds || []).map(p => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Prediction Date: {p.prediction_date}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{Number(p.overall_risk_score).toFixed(0)}</span>
                    <Badge value={p.overall_risk_level} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {[
                  ['Liquidity Risk', `${Number(p.liquidity_risk_score).toFixed(0)}/100`],
                  ['Sustainability Risk', `${Number(p.sustainability_risk_score).toFixed(0)}/100`],
                  ['Burn Rate', `${(Number(p.burn_rate) * 100).toFixed(0)}%`],
                  ['Cash Runway', `${p.cash_runway_days} days`],
                  ['30-day stress', `${(Number(p.liquidity_stress_30d) * 100).toFixed(0)}%`],
                  ['60-day stress', `${(Number(p.liquidity_stress_60d) * 100).toFixed(0)}%`],
                  ['6-month risk', `${(Number(p.sustainability_risk_6m) * 100).toFixed(0)}%`],
                  ['Revenue Volatility', `${(Number(p.revenue_volatility) * 100).toFixed(0)}%`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{l}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{v}</p>
                  </div>
                ))}
              </div>
              {p.risk_factors?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">Risk Factors</p>
                  <div className="flex flex-wrap gap-2">
                    {p.risk_factors.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full px-3 py-1">
                        <Badge value={f.impact} /> {f.factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
