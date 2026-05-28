import { useRef, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import AppLayout from '../../components/layout/AppLayout'
import PrintDocument from '../../components/ui/PrintDocument'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { exportPdf } from '../../utils/exportPdf'
import { sectorApi } from '../../services/api'

const S = {
  sectionTitle: { fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0' },
  th: { fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px 8px 0', borderBottom: '1px solid #e5e7eb', textAlign: 'left' },
  td: { fontSize: 12, color: '#374151', padding: '7px 8px 7px 0', borderBottom: '1px solid #f3f4f6' },
  tdBold: { fontSize: 12, fontWeight: 600, color: '#111827', padding: '7px 8px 7px 0', borderBottom: '1px solid #f3f4f6' },
  statBox: { background: '#f9fafb', borderRadius: 8, padding: '12px 14px' },
}

function SectorPrintContent({ overview, riskBySector, provinces }) {
  const totalSmes = (overview || []).reduce((s, r) => s + (r.sme_count || 0), 0)
  const topSector = [...(overview || [])].sort((a, b) => b.sme_count - a.sme_count)[0]
  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
        {[
          ['Total SMEs', totalSmes],
          ['Sectors', (overview || []).length],
          ['Provinces', (provinces || []).length],
          ['Largest Sector', topSector?.sector || '—'],
        ].map(([label, value]) => (
          <div key={label} style={S.statBox}>
            <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 4px 0' }}>{label}</p>
            <p style={{ fontSize: typeof value === 'number' ? 22 : 14, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.2 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Sector overview table */}
      <p style={S.sectionTitle}>SMEs by Sector</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 28 }}>
        <thead>
          <tr>
            <th style={S.th}>Sector</th>
            <th style={{ ...S.th, textAlign: 'right' }}>SMEs</th>
          </tr>
        </thead>
        <tbody>
          {[...(overview || [])].sort((a, b) => b.sme_count - a.sme_count).map(r => (
            <tr key={r.sector}>
              <td style={S.tdBold}>{r.sector}</td>
              <td style={{ ...S.td, textAlign: 'right' }}>{r.sme_count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Risk by sector */}
      {(riskBySector || []).length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <p style={S.sectionTitle}>Risk Distribution by Sector</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Sector', 'Total', 'Avg Score', 'Low', 'Medium', 'High', 'Critical'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riskBySector.map(r => (
                <tr key={r.sector}>
                  <td style={S.tdBold}>{r.sector}</td>
                  <td style={S.td}>{r.total}</td>
                  <td style={S.td}>{r.avg_risk_score}</td>
                  <td style={{ ...S.td, color: '#15803d' }}>{r.risk_distribution?.low ?? 0}</td>
                  <td style={{ ...S.td, color: '#854d0e' }}>{r.risk_distribution?.medium ?? 0}</td>
                  <td style={{ ...S.td, color: '#c2410c' }}>{r.risk_distribution?.high ?? 0}</td>
                  <td style={{ ...S.td, color: '#dc2626' }}>{r.risk_distribution?.critical ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Province table */}
      {(provinces || []).length > 0 && (
        <div>
          <p style={S.sectionTitle}>SMEs by Province</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={S.th}>Province</th>
                <th style={{ ...S.th, textAlign: 'right' }}>SMEs</th>
              </tr>
            </thead>
            <tbody>
              {provinces.map(p => (
                <tr key={p.province}>
                  <td style={S.tdBold}>{p.province}</td>
                  <td style={{ ...S.td, textAlign: 'right' }}>{p.sme_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SectionTitle({ children }) {
  return <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{children}</p>
}
function Th({ children }) {
  return <th className="pb-2 text-xs font-medium text-gray-400 dark:text-gray-500 text-left">{children}</th>
}
function Td({ children, bold }) {
  return <td className={`py-2 text-sm ${bold ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{children}</td>
}

export default function SectorAnalytics() {
  const { data: overview, loading: l1 } = useApi(() => sectorApi.overview())
  const { data: riskBySector, loading: l2 } = useApi(() => sectorApi.riskBySector())
  const { data: provinces, loading: l3 } = useApi(() => sectorApi.provinceMap())
  const { t } = useTranslation()
  const printRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  if (l1 || l2 || l3) return <AppLayout><Spinner /></AppLayout>

  const totalSmes = (overview || []).reduce((s, r) => s + (r.sme_count || 0), 0)
  const topSector = [...(overview || [])].sort((a, b) => b.sme_count - a.sme_count)[0]

  async function handleExport() {
    if (!printRef.current) return
    setExporting(true)
    try {
      await exportPdf(printRef.current, `sector_analytics_${new Date().toISOString().slice(0, 10)}.pdf`)
    } finally { setExporting(false) }
  }

  return (
    <AppLayout>
      {/* Hidden formal print document */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px', pointerEvents: 'none' }}>
        <PrintDocument ref={printRef} title="Sector & Industry Analytics Report" subtitle="SME risk distribution and sector performance overview">
          <SectorPrintContent overview={overview} riskBySector={riskBySector} provinces={provinces} />
        </PrintDocument>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.sector.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.sector.subtitle')}</p>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total SMEs</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalSmes}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sectors Tracked</p>
          <p className="text-3xl font-bold text-primary-600">{(overview || []).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Provinces</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{(provinces || []).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Largest Sector</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{topSector?.sector || '—'}</p>
          {topSector && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{topSector.sme_count} SMEs</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <SectionTitle>SMEs by Sector</SectionTitle>
          {(!overview || overview.length === 0)
            ? <p className="text-sm text-gray-400">{t('common.noData')}</p>
            : (
              <ResponsiveContainer width="100%" height={Math.max(220, overview.length * 36)}>
                <BarChart layout="vertical" data={[...overview].sort((a, b) => b.sme_count - a.sme_count)} margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="sector" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [v, 'SMEs']} />
                  <Bar dataKey="sme_count" name="SMEs" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <SectionTitle>SMEs by Province</SectionTitle>
          {(!provinces || provinces.length === 0)
            ? <p className="text-sm text-gray-400">{t('common.noData')}</p>
            : (
              <div className="space-y-0">
                {provinces.map(p => (
                  <div key={p.province} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{p.province}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 bg-primary-100 dark:bg-primary-900/20 rounded-full overflow-hidden w-24">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.round((p.sme_count / totalSmes) * 100)}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white w-6 text-right">{p.sme_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <SectionTitle>Risk Distribution by Sector</SectionTitle>
        {(!riskBySector || riskBySector.length === 0)
          ? <p className="text-sm text-gray-400">Run predictions on SMEs to see sector risk data.</p>
          : (
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={Math.max(220, riskBySector.length * 44)}>
                <BarChart layout="vertical" data={riskBySector.map(r => ({ sector: r.sector, Low: r.risk_distribution?.low ?? 0, Medium: r.risk_distribution?.medium ?? 0, High: r.risk_distribution?.high ?? 0, Critical: r.risk_distribution?.critical ?? 0 }))} margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="sector" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Low" stackId="s" fill="#22c55e" />
                  <Bar dataKey="Medium" stackId="s" fill="#facc15" />
                  <Bar dataKey="High" stackId="s" fill="#f97316" />
                  <Bar dataKey="Critical" stackId="s" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div>
                <SectionTitle>Sector Summary</SectionTitle>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <Th>Sector</Th><Th>Total SMEs</Th><Th>Avg Risk Score</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {riskBySector.map(r => (
                        <tr key={r.sector}>
                          <Td bold>{r.sector}</Td>
                          <Td>{r.total}</Td>
                          <Td>{r.avg_risk_score}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        }
      </div>
    </AppLayout>
  )
}
