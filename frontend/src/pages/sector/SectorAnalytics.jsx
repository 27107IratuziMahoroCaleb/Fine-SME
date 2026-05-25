import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import AppLayout from '../../components/layout/AppLayout'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { sectorApi } from '../../services/api'

export default function SectorAnalytics() {
  const { data: overview, loading: l1 } = useApi(() => sectorApi.overview())
  const { data: riskBySector, loading: l2 } = useApi(() => sectorApi.riskBySector())
  const { data: provinces, loading: l3 } = useApi(() => sectorApi.provinceMap())
  const { t } = useTranslation()

  if (l1 || l2 || l3) return <AppLayout><Spinner /></AppLayout>

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.sector.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.sector.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('page.sector.bySector')}</h3>
          {(!overview || overview.length === 0)
            ? <p className="text-sm text-gray-400">{t('common.noData')}</p>
            : (
              <ResponsiveContainer width="100%" height={Math.max(220, overview.length * 36)}>
                <BarChart
                  layout="vertical"
                  data={[...overview].sort((a, b) => b.sme_count - a.sme_count)}
                  margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="sector" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [v, 'SMEs']} />
                  <Bar dataKey="sme_count" name="SMEs" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('page.sector.byProvince')}</h3>
          {(!provinces || provinces.length === 0)
            ? <p className="text-sm text-gray-400">{t('common.noData')}</p>
            : provinces.map(p => (
              <div key={p.province} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-700 dark:text-gray-300">{p.province}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{p.sme_count}</span>
              </div>
            ))
          }
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('page.sector.riskBySector')}</h3>
        {(!riskBySector || riskBySector.length === 0)
          ? <p className="text-sm text-gray-400">Run predictions on SMEs to see sector risk data.</p>
          : (
            <>
              <ResponsiveContainer width="100%" height={Math.max(220, riskBySector.length * 44)}>
                <BarChart
                  layout="vertical"
                  data={riskBySector.map(r => ({
                    sector: r.sector,
                    Low: r.risk_distribution?.low ?? 0,
                    Medium: r.risk_distribution?.medium ?? 0,
                    High: r.risk_distribution?.high ?? 0,
                    Critical: r.risk_distribution?.critical ?? 0,
                  }))}
                  margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="sector" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Low" stackId="s" fill="#22c55e" />
                  <Bar dataKey="Medium" stackId="s" fill="#facc15" />
                  <Bar dataKey="High" stackId="s" fill="#f97316" />
                  <Bar dataKey="Critical" stackId="s" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      {['Sector', 'Total', 'Avg Score'].map(h => (
                        <th key={h} className="pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pr-6">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {riskBySector.map(r => (
                      <tr key={r.sector}>
                        <td className="py-1.5 font-medium text-gray-900 dark:text-white pr-6">{r.sector}</td>
                        <td className="py-1.5 text-gray-600 dark:text-gray-300 pr-6">{r.total}</td>
                        <td className="py-1.5 text-gray-600 dark:text-gray-300">{r.avg_risk_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        }
      </div>
    </AppLayout>
  )
}
