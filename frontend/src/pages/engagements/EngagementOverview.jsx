import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import AppLayout from '../../components/layout/AppLayout'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { engagementsApi } from '../../services/api'

const STATUS_COLORS = {
  prospect:     'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  financed:     'bg-green-100 text-green-700',
  monitoring:   'bg-purple-100 text-purple-700',
  closed:       'bg-gray-100 text-gray-500',
}
const STATUS_LABELS = {
  prospect: 'Prospect', under_review: 'Under Review',
  financed: 'Financed', monitoring: 'Monitoring', closed: 'Closed',
}
const ALL_STATUSES = Object.keys(STATUS_LABELS)

export default function EngagementOverview() {
  const { data: engagements, loading } = useApi(() => engagementsApi.overview())
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const stats = useMemo(() => {
    if (!engagements) return {}
    const totalLoan = engagements
      .filter(e => e.status === 'financed' || e.status === 'monitoring')
      .reduce((s, e) => s + (e.loan_amount || 0), 0)
    const byStatus = ALL_STATUSES.reduce((acc, s) => {
      acc[s] = engagements.filter(e => e.status === s).length
      return acc
    }, {})
    const uniqueLenders = new Set(engagements.map(e => e.lender?.id)).size
    const uniqueSMEs = new Set(engagements.map(e => e.sme?.id)).size
    return { total: engagements.length, totalLoan, byStatus, uniqueLenders, uniqueSMEs }
  }, [engagements])

  const chartData = useMemo(() =>
    ALL_STATUSES.map(s => ({ status: STATUS_LABELS[s], count: stats.byStatus?.[s] ?? 0 }))
  , [stats])

  const filtered = useMemo(() => {
    let list = engagements || []
    if (statusFilter) list = list.filter(e => e.status === statusFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(e =>
        e.sme?.name?.toLowerCase().includes(q) ||
        e.lender?.full_name?.toLowerCase().includes(q) ||
        e.lender?.organization?.toLowerCase().includes(q)
      )
    }
    return list
  }, [engagements, statusFilter, search])

  if (loading) return <AppLayout><Spinner /></AppLayout>

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Engagement Overview</h1>
        <p className="text-sm text-gray-500 mt-1">All lender–SME engagements across the platform</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Engagements', value: stats.total ?? 0, color: 'text-primary-600' },
          { label: 'Unique Lenders', value: stats.uniqueLenders ?? 0, color: 'text-blue-600' },
          { label: 'SMEs Engaged', value: stats.uniqueSMEs ?? 0, color: 'text-violet-600' },
          { label: 'Financed / Monitoring', value: (stats.byStatus?.financed ?? 0) + (stats.byStatus?.monitoring ?? 0), color: 'text-green-600' },
          {
            label: 'Total Loan Exposure',
            value: stats.totalLoan > 0 ? `RWF ${stats.totalLoan.toLocaleString()}` : '—',
            color: 'text-gray-900',
          },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Status bar chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Engagements by Status</h3>
        {(stats.total ?? 0) === 0
          ? <p className="text-sm text-gray-400">No engagements yet.</p>
          : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [v, 'Engagements']} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search SME or lender…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['SME', 'Sector', 'Lender', 'Organization', 'Status', 'Risk', 'Loan Amount', 'Since'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  {statusFilter || search ? 'No engagements match your filters.' : 'No engagements on the platform yet.'}
                </td>
              </tr>
            )}
            {filtered.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link to={`/smes/${e.sme?.id}`} className="text-primary-600 hover:underline">{e.sme?.name}</Link>
                </td>
                <td className="px-4 py-3 text-gray-500">{e.sme?.sector || '—'}</td>
                <td className="px-4 py-3 text-gray-700">{e.lender?.full_name}</td>
                <td className="px-4 py-3 text-gray-500">{e.lender?.organization || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[e.status]}`}>
                    {STATUS_LABELS[e.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {e.latest_prediction?.overall_risk_level
                    ? <Badge value={e.latest_prediction.overall_risk_level} />
                    : <span className="text-xs text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {e.loan_amount ? `RWF ${Number(e.loan_amount).toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {e.attached_at ? new Date(String(e.attached_at).replace(' ', 'T')).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}
