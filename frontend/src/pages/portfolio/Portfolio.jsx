import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts'
import AppLayout from '../../components/layout/AppLayout'
import Badge from '../../components/ui/Badge'
import { StatCard } from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { portfolioApi } from '../../services/api'
import { Link } from 'react-router-dom'

const RISK_COLORS = { low: '#22c55e', medium: '#eab308', high: '#f97316', critical: '#ef4444' }
const RISK_LEVELS = ['low', 'medium', 'high', 'critical']

export default function Portfolio() {
  const { data: summary, loading: l1 } = useApi(() => portfolioApi.summary())
  const { data: watchlist, loading: l2 } = useApi(() => portfolioApi.watchlist())
  const { data: trend, loading: l3 } = useApi(() => portfolioApi.riskTrend())
  const { t } = useTranslation()

  const [stressOpen, setStressOpen] = useState(false)
  const [revenueDrop, setRevenueDrop] = useState(10)
  const [expenseIncrease, setExpenseIncrease] = useState(10)
  const [scenarioName, setScenarioName] = useState('Adverse Scenario')
  const [stressResult, setStressResult] = useState(null)
  const [stressLoading, setStressLoading] = useState(false)
  const [stressError, setStressError] = useState('')

  if (l1 || l2 || l3) return <AppLayout><Spinner /></AppLayout>

  const dist = summary?.risk_distribution || {}

  async function runStressTest() {
    setStressLoading(true)
    setStressError('')
    try {
      const { data } = await portfolioApi.stressTest({
        scenario_name: scenarioName,
        revenue_drop_pct: revenueDrop,
        expense_increase_pct: expenseIncrease,
      })
      setStressResult(data)
    } catch (err) {
      setStressError(err.response?.data?.detail || 'Stress test failed.')
    } finally {
      setStressLoading(false)
    }
  }

  const stressChartData = stressResult
    ? RISK_LEVELS.map(k => ({
        name: k.charAt(0).toUpperCase() + k.slice(1),
        Baseline: stressResult.baseline_distribution[k] ?? 0,
        Stressed: stressResult.stressed_distribution[k] ?? 0,
      }))
    : []

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.portfolio.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.portfolio.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total SMEs" value={summary?.total_smes ?? '—'} color="text-primary-600" />
        <StatCard label="Active Alerts" value={summary?.active_alerts ?? '—'} color="text-red-600" />
        <StatCard label="Avg Risk Score" value={summary?.avg_risk_score ?? '—'} color="text-orange-600" />
        <StatCard label="Assessed" value={summary?.smes_assessed ?? '—'} color="text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-6">
        {[
          { k: 'low',      label: 'Low Risk',  color: 'border-green-400 text-green-700 dark:text-green-400' },
          { k: 'medium',   label: 'Medium',    color: 'border-yellow-400 text-yellow-700 dark:text-yellow-400' },
          { k: 'high',     label: 'High Risk', color: 'border-orange-400 text-orange-700 dark:text-orange-400' },
          { k: 'critical', label: 'Critical',  color: 'border-red-500 text-red-700 dark:text-red-400' },
        ].map(({ k, label, color }) => (
          <div key={k} className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 p-4 border border-gray-200 dark:border-gray-700 ${color}`}>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`text-2xl font-bold ${color.split(' ')[1]}`}>{dist[k] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('page.portfolio.watchList')}</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {(!watchlist || watchlist.length === 0) && (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">{t('page.portfolio.noWatch')}</p>
            )}
            {(watchlist || []).map(w => (
              <div key={w.sme_id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <Link to={`/smes/${w.sme_id}`} className="text-sm font-medium text-primary-600 hover:underline">{w.sme_name}</Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{w.sector} · Runway: {w.cash_runway_days ?? '—'} days</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{w.risk_score.toFixed(0)}</p>
                  <Badge value={w.risk_level} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('page.portfolio.trend')}</h3>
          {(!trend || trend.length === 0) ? (
            <p className="text-sm text-gray-400">{t('page.portfolio.noTrend')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend.map(t => ({ period: `${t.year}/${String(t.month).padStart(2,'0')}`, score: t.avg_score }))}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}`, 'Avg Risk Score']} />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} fill="url(#scoreGrad)" dot={{ r: 3, fill: '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Stress Test Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setStressOpen(o => !o)}
          className="w-full px-6 py-4 flex items-center justify-between text-left"
        >
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Portfolio Stress Test</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Model the impact of adverse economic scenarios on SME risk levels</p>
          </div>
          <svg className={`h-5 w-5 text-gray-400 transition-transform ${stressOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {stressOpen && (
          <div className="px-6 pb-6 space-y-5 border-t border-gray-100 dark:border-gray-700 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Scenario Name
                </label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={e => setScenarioName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Revenue Drop: <span className="text-primary-600 font-bold">{revenueDrop}%</span>
                </label>
                <input
                  type="range" min={0} max={50} value={revenueDrop}
                  onChange={e => setRevenueDrop(Number(e.target.value))}
                  className="w-full accent-primary-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Expense Increase: <span className="text-orange-600 font-bold">{expenseIncrease}%</span>
                </label>
                <input
                  type="range" min={0} max={50} value={expenseIncrease}
                  onChange={e => setExpenseIncrease(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>

            <button
              onClick={runStressTest}
              disabled={stressLoading}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {stressLoading ? 'Running…' : 'Run Stress Test'}
            </button>

            {stressError && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{stressError}</p>
            )}

            {stressResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Scenario: <strong>{stressResult.scenario_name}</strong></span>
                  <span className="text-xs text-gray-400">—</span>
                  <span className="text-sm text-gray-500">
                    {stressResult.escalation_count} of {stressResult.total_smes} SMEs escalate to higher risk
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Baseline vs Stressed Distribution</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={stressChartData} barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Baseline" fill="#3b82f6" radius={[3, 3, 0, 0]}>
                          {stressChartData.map((entry, i) => (
                            <Cell key={i} fill={RISK_COLORS[RISK_LEVELS[i]]} fillOpacity={0.4} />
                          ))}
                        </Bar>
                        <Bar dataKey="Stressed" fill="#f97316" radius={[3, 3, 0, 0]}>
                          {stressChartData.map((entry, i) => (
                            <Cell key={i} fill={RISK_COLORS[RISK_LEVELS[i]]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {stressResult.escalations.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">SMEs at Escalated Risk</p>
                      <div className="overflow-y-auto max-h-44 rounded-lg border border-gray-100 dark:border-gray-700">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-gray-500">SME</th>
                              <th className="px-3 py-2 text-left text-gray-500">From</th>
                              <th className="px-3 py-2 text-left text-gray-500">To</th>
                              <th className="px-3 py-2 text-right text-gray-500">Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {stressResult.escalations.map(e => (
                              <tr key={e.sme_id} className="bg-white dark:bg-gray-800">
                                <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{e.sme_name}</td>
                                <td className="px-3 py-2 capitalize text-gray-500">{e.from_level}</td>
                                <td className="px-3 py-2 capitalize font-semibold" style={{ color: RISK_COLORS[e.to_level] }}>{e.to_level}</td>
                                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{e.stressed_score}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
