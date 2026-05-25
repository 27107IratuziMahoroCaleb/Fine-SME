import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import AppLayout from '../../components/layout/AppLayout'
import { StatCard } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { portfolioApi, alertsApi, engagementsApi } from '../../services/api'
import { useRole } from '../../hooks/useRole'
import { useTranslation } from '../../hooks/useTranslation'

const RISK_COLORS = { low: '#22c55e', medium: '#facc15', high: '#f97316', critical: '#ef4444' }

const ENG_COLORS = {
  prospect: 'bg-blue-100 text-blue-700', under_review: 'bg-yellow-100 text-yellow-700',
  financed: 'bg-green-100 text-green-700', monitoring: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-500',
}
const ENG_LABELS = {
  prospect: 'Prospect', under_review: 'Under Review',
  financed: 'Financed', monitoring: 'Monitoring', closed: 'Closed',
}

function MyPortfolioSection({ engagements, t }) {
  const active = engagements.filter(e => e.status !== 'closed')
  if (active.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('page.dashboard.myPortfolio')}</h3>
        <p className="text-sm text-gray-400 mt-3">
          You have no SMEs in your portfolio yet. Browse <Link to="/smes" className="text-primary-600 hover:underline">SMEs</Link> and add ones you're interested in.
        </p>
      </div>
    )
  }

  const financed = active.filter(e => e.status === 'financed' || e.status === 'monitoring')
  const prospects = active.filter(e => e.status === 'prospect' || e.status === 'under_review')
  const totalLoan = financed.reduce((s, e) => s + (e.loan_amount || 0), 0)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('page.dashboard.myPortfolio')}</h2>
        <Link to="/smes" className="text-sm text-primary-600 hover:underline">{t('page.dashboard.browseSmes')}</Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('page.dashboard.finMonitoring')}</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{financed.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('page.dashboard.prospects')}</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{prospects.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('page.dashboard.loanExposure')}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
            {totalLoan > 0 ? `RWF ${totalLoan.toLocaleString()}` : '—'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
            <tr>
              {['SME', t('common.sector'), t('common.status'), t('common.risk'), t('common.loanAmount'), ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {active.map(e => (
              <tr key={e.sme_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{e.sme?.name}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{e.sme?.sector || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ENG_COLORS[e.status]}`}>
                    {ENG_LABELS[e.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {e.latest_prediction ? <Badge value={e.latest_prediction.overall_risk_level} /> : <span className="text-xs text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {e.loan_amount ? `RWF ${Number(e.loan_amount).toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <Link to={`/smes/${e.sme_id}`} className="text-primary-600 hover:underline text-xs font-medium">{t('common.view')} →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { isLender } = useRole()
  const { t } = useTranslation()
  const [summary, setSummary] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [myEngs, setMyEngs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calls = [
      portfolioApi.summary(),
      alertsApi.list({ status: 'active', limit: 5 }),
      portfolioApi.watchlist(),
      ...(isLender ? [engagementsApi.mine()] : []),
    ]
    Promise.all(calls).then(([s, a, w, e]) => {
      setSummary(s.data)
      setAlerts(a.data)
      setWatchlist(w.data.slice(0, 5))
      if (e) setMyEngs(e.data)
    }).finally(() => setLoading(false))
  }, [isLender])

  if (loading) return <AppLayout><Spinner /></AppLayout>

  const dist = summary?.risk_distribution || {}

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.dashboard.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.dashboard.subtitle')}</p>
      </div>

      {isLender && <MyPortfolioSection engagements={myEngs} t={t} />}

      <div className="mb-2">
        {isLender && <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{t('page.dashboard.platformOverview')}</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label={t('page.dashboard.totalSmes')} value={summary?.total_smes ?? '—'} color="text-primary-600" />
        <StatCard label={t('page.dashboard.activeAlerts')} value={summary?.active_alerts ?? '—'} color="text-red-600" />
        <StatCard label={t('page.dashboard.avgRiskScore')} value={summary?.avg_risk_score != null ? `${summary.avg_risk_score}` : '—'} color="text-orange-600" sub={t('page.dashboard.riskScoreSub')} />
        <StatCard label={t('page.dashboard.smesAssessed')} value={summary?.smes_assessed ?? '—'} color="text-green-600" />
      </div>

      {/* Risk Distribution Donut */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('page.dashboard.riskDist')}</h3>
        {Object.values(dist).every(v => (v ?? 0) === 0) ? (
          <p className="text-sm text-gray-400">{t('page.dashboard.noPredictions')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Low', value: dist.low ?? 0 },
                  { name: 'Medium', value: dist.medium ?? 0 },
                  { name: 'High', value: dist.high ?? 0 },
                  { name: 'Critical', value: dist.critical ?? 0 },
                ].filter(d => d.value > 0)}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {['low', 'medium', 'high', 'critical']
                  .filter(k => (dist[k] ?? 0) > 0)
                  .map(k => <Cell key={k} fill={RISK_COLORS[k]} />)}
              </Pie>
              <Tooltip formatter={(v, name) => [v + ' SMEs', name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('page.dashboard.activeWarnings')}</h3>
            <Link to="/alerts" className="text-sm text-primary-600 hover:underline">{t('common.viewAll')}</Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {alerts.length === 0 && <p className="px-6 py-8 text-sm text-gray-400 text-center">{t('page.dashboard.noAlerts')}</p>}
            {alerts.map((a) => (
              <div key={a.id} className="px-6 py-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{a.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{a.sme_name}</p>
                </div>
                <Badge value={a.severity} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('page.dashboard.watchList')}</h3>
            <Link to="/portfolio" className="text-sm text-primary-600 hover:underline">{t('common.viewAll')}</Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {watchlist.length === 0 && <p className="px-6 py-8 text-sm text-gray-400 text-center">{t('page.dashboard.noWatchlist')}</p>}
            {watchlist.map((w) => (
              <div key={w.sme_id} className="px-6 py-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{w.sme_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{w.sector} · {t('page.dashboard.score')}: {w.risk_score.toFixed(0)}</p>
                </div>
                <Badge value={w.risk_level} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
