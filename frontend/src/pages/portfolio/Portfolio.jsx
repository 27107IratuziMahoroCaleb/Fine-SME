import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import AppLayout from '../../components/layout/AppLayout'
import Badge from '../../components/ui/Badge'
import { StatCard } from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { portfolioApi } from '../../services/api'
import { Link } from 'react-router-dom'

export default function Portfolio() {
  const { data: summary, loading: l1 } = useApi(() => portfolioApi.summary())
  const { data: watchlist, loading: l2 } = useApi(() => portfolioApi.watchlist())
  const { data: trend, loading: l3 } = useApi(() => portfolioApi.riskTrend())
  const { t } = useTranslation()

  if (l1 || l2 || l3) return <AppLayout><Spinner /></AppLayout>

  const dist = summary?.risk_distribution || {}

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    </AppLayout>
  )
}
