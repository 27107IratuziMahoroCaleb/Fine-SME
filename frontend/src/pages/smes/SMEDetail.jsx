import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { Card } from '../../components/ui/Card'
import { useApi } from '../../hooks/useApi'
import { useRole } from '../../hooks/useRole'
import { useTranslation } from '../../hooks/useTranslation'
import { smesApi, predictionsApi, transactionsApi, engagementsApi } from '../../services/api'

const ENGAGEMENT_STATUSES = [
  { value: 'prospect',     label: 'Prospect',     color: 'bg-blue-100 text-blue-700' },
  { value: 'under_review', label: 'Under Review', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'financed',     label: 'Financed',     color: 'bg-green-100 text-green-700' },
  { value: 'monitoring',   label: 'Monitoring',   color: 'bg-purple-100 text-purple-700' },
  { value: 'closed',       label: 'Closed',       color: 'bg-gray-100 text-gray-500' },
]

function statusMeta(s) {
  return ENGAGEMENT_STATUSES.find(e => e.value === s) || ENGAGEMENT_STATUSES[0]
}

function EngagementPanel({ smeId, t }) {
  const { data: eng, refetch } = useApi(() => engagementsApi.forSme(smeId), [smeId])
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState('')
  const [loanAmount, setLoanAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  function openEdit(current) {
    setStatus(current?.status || 'prospect')
    setLoanAmount(current?.loan_amount ? String(current.loan_amount) : '')
    setNotes(current?.notes || '')
    setEditing(true)
  }

  async function save() {
    setSaving(true)
    try {
      await engagementsApi.upsert(smeId, status, loanAmount ? Number(loanAmount) : null, notes || null)
      setEditing(false); refetch()
    } finally { setSaving(false) }
  }

  async function remove() {
    setRemoving(true)
    try {
      await engagementsApi.remove(smeId)
      setEditing(false); refetch()
    } finally { setRemoving(false) }
  }

  const meta = eng ? statusMeta(eng.status) : null

  return (
    <Card className="p-6 col-span-1">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">My Engagement</h3>

      {!eng && !editing && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-400 mb-4">Not in your portfolio yet.</p>
          <Button onClick={() => openEdit(null)} className="w-full">+ Add to Watch List</Button>
        </div>
      )}

      {eng && !editing && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>{meta.label}</span>
            <button onClick={() => openEdit(eng)} className="text-xs text-primary-600 hover:underline">{t('common.edit')}</button>
          </div>
          {eng.loan_amount && (
            <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">Loan Amount</span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">RWF {Number(eng.loan_amount).toLocaleString()}</span>
            </div>
          )}
          {eng.notes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{eng.notes}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Attached {eng.attached_at ? new Date(eng.attached_at).toLocaleDateString() : '—'}
          </p>
        </div>
      )}

      {editing && (
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm">
              {ENGAGEMENT_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Loan Amount (RWF)</label>
            <input
              type="number"
              value={loanAmount}
              onChange={e => setLoanAmount(e.target.value)}
              placeholder="e.g. 5000000"
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes…"
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={save} loading={saving} className="flex-1 text-sm">{t('common.save')}</Button>
            <Button variant="secondary" onClick={() => setEditing(false)} className="text-sm">{t('common.cancel')}</Button>
          </div>
          {eng && (
            <button onClick={remove} disabled={removing}
              className="w-full text-xs text-red-500 hover:text-red-700 mt-1">
              {removing ? 'Removing…' : 'Remove from portfolio'}
            </button>
          )}
        </div>
      )}
    </Card>
  )
}

export default function SMEDetail() {
  const { id } = useParams()
  const smeId = Number(id)
  const { isLender, isAdmin } = useRole()
  const { t } = useTranslation()
  const { data: sme, loading } = useApi(() => smesApi.get(smeId), [smeId])
  const { data: predictions, refetch: refetchPreds } = useApi(() => predictionsApi.list(smeId), [smeId])
  const { data: summary } = useApi(() => transactionsApi.summary(smeId), [smeId])
  const [predicting, setPredicting] = useState(false)
  const [predError, setPredError] = useState('')

  async function runPrediction() {
    setPredicting(true); setPredError('')
    try { await predictionsApi.run(smeId); refetchPreds() }
    catch (e) { setPredError(e.response?.data?.detail || 'Prediction failed') }
    finally { setPredicting(false) }
  }

  if (loading) return <AppLayout><Spinner /></AppLayout>
  if (!sme) return <AppLayout><p className="text-gray-500 dark:text-gray-400">SME not found.</p></AppLayout>

  const latest = predictions?.[0]
  const showEngagement = isLender || isAdmin

  return (
    <AppLayout>
      <div className="flex items-center gap-2 mb-1">
        <Link to="/smes" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">← SMEs</Link>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{sme.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{[sme.sector, sme.location_province].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="flex gap-3 items-center">
          <Link to={`/smes/${smeId}/scorecard`}>
            <Button variant="secondary">Scorecard</Button>
          </Link>
          <Button loading={predicting} onClick={runPrediction}>{t('common.runPrediction')}</Button>
        </div>
      </div>
      {predError && <p className="text-sm text-red-500 mb-4 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{predError}</p>}

      <div className={`grid grid-cols-1 gap-6 mb-6 ${showEngagement ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        <Card className="p-6 col-span-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">SME Details</h3>
          {[
            ['Registration', sme.registration_number],
            ['Size', sme.size],
            ['Sector', sme.sector],
            ['Province', sme.location_province],
            ['District', sme.location_district],
            ['Owner', sme.owner_name],
            ['Phone', sme.owner_phone],
            ['Email', sme.owner_email],
            ['Employees', sme.employee_count],
          ].map(([l, v]) => v ? (
            <div key={l} className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
              <span className="text-xs text-gray-500 dark:text-gray-400">{l}</span>
              <span className="text-xs font-medium text-gray-900 dark:text-white capitalize">{v}</span>
            </div>
          ) : null)}
        </Card>

        <Card className="p-6 col-span-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Transaction Summary</h3>
          {summary ? [
            ['Total Inflow',       `RWF ${Number(summary.total_inflow).toLocaleString()}`],
            ['Total Outflow',      `RWF ${Number(summary.total_outflow).toLocaleString()}`],
            ['Net Cash Flow',      `RWF ${Number(summary.net_cash_flow).toLocaleString()}`],
            ['Avg Monthly Inflow', `RWF ${Number(summary.avg_monthly_inflow).toLocaleString()}`],
            ['Transactions',       summary.transaction_count],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
              <span className="text-xs text-gray-500 dark:text-gray-400">{l}</span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">{v}</span>
            </div>
          )) : <p className="text-sm text-gray-400">No transactions yet.</p>}
        </Card>

        <Card className="p-6 col-span-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Latest Risk Prediction</h3>
          {latest ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{Number(latest.overall_risk_score).toFixed(0)}</span>
                <Badge value={latest.overall_risk_level} />
              </div>
              {[
                ['Liquidity Risk',   `${Number(latest.liquidity_risk_score).toFixed(0)}/100`],
                ['Sustainability',   `${Number(latest.sustainability_risk_score).toFixed(0)}/100`],
                ['Burn Rate',        `${(Number(latest.burn_rate) * 100).toFixed(0)}%`],
                ['Cash Runway',      `${latest.cash_runway_days} days`],
                ['30d Stress Prob.', `${(Number(latest.liquidity_stress_30d) * 100).toFixed(0)}%`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{l}</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">{v}</span>
                </div>
              ))}
            </>
          ) : <p className="text-sm text-gray-400">No predictions yet. Click "Run Prediction" to generate.</p>}
        </Card>

        {showEngagement && <EngagementPanel smeId={smeId} t={t} />}
      </div>

      <div className="flex gap-3">
        <Link to={`/data?sme=${smeId}`}><Button variant="secondary">Add Transactions</Button></Link>
        <Link to={`/alerts?sme=${smeId}`}><Button variant="secondary">View Alerts</Button></Link>
        <Link to={`/credit?sme=${smeId}`}><Button variant="secondary">Credit Assessment</Button></Link>
      </div>
    </AppLayout>
  )
}
