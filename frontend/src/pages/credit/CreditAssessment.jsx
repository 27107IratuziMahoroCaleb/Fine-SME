import { useRef, useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { smesApi, creditApi } from '../../services/api'

async function exportCardAsPdf(cardEl, filename) {
  const { default: html2canvas } = await import('html2canvas')
  const { jsPDF } = await import('jspdf')
  const canvas = await html2canvas(cardEl, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const imgH = (canvas.height * pageW) / canvas.width
  pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH)
  pdf.save(filename)
}

function AssessmentCard({ a }) {
  const cardRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    if (!cardRef.current) return
    setExporting(true)
    try {
      await exportCardAsPdf(cardRef.current, `credit_${a.sme_name?.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{a.sme_name}</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(a.assessment_date).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs text-primary-600 border border-primary-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting ? 'Exporting…' : 'PDF'}
          </button>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{a.credit_rating}</span>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Creditworthiness</p>
            <p className="font-bold text-primary-600">{Number(a.creditworthiness_score).toFixed(0)}/100</p>
          </div>
        </div>
      </div>

      {/* ref wraps only the printable content */}
      <div ref={cardRef} className="bg-white dark:bg-gray-800">
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
    </div>
  )
}

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
          <AssessmentCard key={a.id} a={a} />
        ))}
      </div>
    </AppLayout>
  )
}
