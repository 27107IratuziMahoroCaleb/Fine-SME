import { useRef, useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import PrintDocument from '../../components/ui/PrintDocument'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { exportPdf } from '../../utils/exportPdf'
import { recommendationsApi } from '../../services/api'

const CATEGORY_STYLES = {
  cash_flow:      'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  expense:        'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
  revenue:        'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  working_capital:'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
  debt:           'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  growth:         'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400',
  pricing:        'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  inventory:      'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
}

const PRIORITY_BAR = ['', 'bg-green-400', 'bg-yellow-400', 'bg-orange-400', 'bg-red-500', 'bg-red-700']

const S = {
  sectionTitle: { fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0' },
  statBox: { background: '#f9fafb', borderRadius: 8, padding: '12px 14px', textAlign: 'center' },
  recRow: { borderBottom: '1px solid #f3f4f6', padding: '12px 0' },
  chip: { display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12, textTransform: 'capitalize', marginRight: 6 },
}

function RecsPrintContent({ recs, counts, byCat }) {
  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
        {[
          ['Total', counts.total, '#111827'],
          ['Pending', counts.pending || 0, '#374151'],
          ['In Progress', counts.in_progress || 0, '#2563eb'],
          ['Implemented', counts.implemented || 0, '#15803d'],
        ].map(([label, value, color]) => (
          <div key={label} style={S.statBox}>
            <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 4px 0' }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* By category */}
      {Object.keys(byCat).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={S.sectionTitle}>By Category</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(byCat).map(([cat, count]) => (
              <span key={cat} style={{ ...S.chip, background: '#eff6ff', color: '#1d4ed8' }}>
                {cat.replace('_', ' ')} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation list */}
      <p style={S.sectionTitle}>Recommendations ({recs.length})</p>
      {recs.length === 0
        ? <p style={{ fontSize: 12, color: '#9ca3af' }}>No recommendations.</p>
        : recs.map((r, i) => (
          <div key={i} style={S.recRow}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div>
                <span style={{ ...S.chip, background: '#eff6ff', color: '#1d4ed8' }}>{r.category.replace('_', ' ')}</span>
                <span style={{ ...S.chip, background: '#f3f4f6', color: '#6b7280' }}>{r.status.replace('_', ' ')}</span>
                {r.sme_name && <span style={{ fontSize: 10, color: '#9ca3af' }}>{r.sme_name}</span>}
              </div>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>Priority {r.priority}</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 3px 0' }}>{r.title}</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{r.description}</p>
            {r.expected_impact && (
              <p style={{ fontSize: 11, color: '#15803d', margin: '4px 0 0 0' }}>Expected: {r.expected_impact}</p>
            )}
          </div>
        ))
      }
    </div>
  )
}

function SectionTitle({ children }) {
  return <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{children}</p>
}

export default function Recommendations() {
  const { data: recs, loading, refetch } = useApi(() => recommendationsApi.list({}))
  const { t } = useTranslation()
  const printRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  async function updateStatus(id, status) {
    await recommendationsApi.update(id, { status }); refetch()
  }

  async function handleExport() {
    if (!printRef.current) return
    setExporting(true)
    try {
      await exportPdf(printRef.current, `recommendations_report_${new Date().toISOString().slice(0, 10)}.pdf`)
    } finally { setExporting(false) }
  }

  if (loading) return <AppLayout><Spinner /></AppLayout>

  const counts = (recs || []).reduce((acc, r) => {
    acc.total++
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, { total: 0 })

  const byCat = (recs || []).reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1
    return acc
  }, {})

  return (
    <AppLayout>
      {/* Hidden formal print document */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px', pointerEvents: 'none' }}>
        <PrintDocument ref={printRef} title="Advisory Recommendations Report" subtitle="AI-generated intervention recommendations for SMEs">
          <RecsPrintContent recs={recs || []} counts={counts} byCat={byCat} />
        </PrintDocument>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.recommendations.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.recommendations.subtitle')}</p>
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
        {[
          { label: 'Total',       value: counts.total,              accent: '' },
          { label: 'Pending',     value: counts.pending || 0,       accent: 'text-gray-700 dark:text-gray-300' },
          { label: 'In Progress', value: counts.in_progress || 0,   accent: 'text-blue-600 dark:text-blue-400' },
          { label: 'Implemented', value: counts.implemented || 0,   accent: 'text-green-600 dark:text-green-400' },
        ].map(({ label, value, accent }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${accent || 'text-gray-900 dark:text-white'}`}>{value}</p>
          </div>
        ))}
      </div>

      {Object.keys(byCat).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <SectionTitle>By Category</SectionTitle>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(byCat).map(([cat, count]) => (
              <span key={cat} className={`text-xs font-medium px-3 py-1.5 rounded-full capitalize ${CATEGORY_STYLES[cat] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {cat.replace('_', ' ')} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {(!recs || recs.length === 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-400">No recommendations yet. Run a prediction on an SME to generate recommendations.</p>
          </div>
        )}
        {(recs || []).map(r => (
          <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {r.priority >= 1 && r.priority <= 5 && <div className={`h-0.5 ${PRIORITY_BAR[r.priority] || 'bg-gray-300'}`} />}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${CATEGORY_STYLES[r.category] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      {r.category.replace('_', ' ')}
                    </span>
                    <Badge value={r.status} />
                    {r.sme_name && <span className="text-xs text-gray-400 dark:text-gray-500">{r.sme_name}</span>}
                    <span className="text-xs text-gray-400 dark:text-gray-500">Priority {r.priority}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{r.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{r.description}</p>
                  {r.expected_impact && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">Expected: {r.expected_impact}</p>
                    </div>
                  )}
                  {r.action_steps && (
                    <details className="group">
                      <summary className="cursor-pointer text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 select-none list-none flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        View action steps
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 leading-relaxed">{r.action_steps}</pre>
                    </details>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {r.status === 'pending' && (
                    <Button className="text-xs py-1" onClick={() => updateStatus(r.id, 'in_progress')}>{t('common.start')}</Button>
                  )}
                  {r.status === 'in_progress' && (
                    <Button className="text-xs py-1" onClick={() => updateStatus(r.id, 'implemented')}>{t('common.markDone')}</Button>
                  )}
                  {r.status === 'pending' && (
                    <Button variant="secondary" className="text-xs py-1" onClick={() => updateStatus(r.id, 'dismissed')}>{t('common.dismiss')}</Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
