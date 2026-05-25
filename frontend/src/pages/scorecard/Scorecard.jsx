import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { smesApi, predictionsApi } from '../../services/api'

function ScoreBar({ label, score }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-red-500'
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 dark:text-gray-300 font-medium">{label}</span>
        <span className="font-bold text-gray-900 dark:text-white">{score.toFixed(0)}/100</span>
      </div>
      <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export default function Scorecard() {
  const { data: smes, loading } = useApi(() => smesApi.list({}))
  const { t } = useTranslation()
  const [selected, setSelected] = useState(null)
  const { data: scorecard, loading: scLoading, error } = useApi(
    () => selected ? predictionsApi.scorecard(selected) : Promise.resolve({ data: null }),
    [selected]
  )

  if (loading) return <AppLayout><Spinner /></AppLayout>

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.scorecard.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.scorecard.subtitle')}</p>
      </div>

      <div className="mb-6">
        <select
          value={selected || ''}
          onChange={e => setSelected(e.target.value || null)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
        >
          <option value="">{t('common.selectSme')}</option>
          {(smes || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {scLoading && <Spinner />}
      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">{error}</p>}

      {scorecard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{scorecard.sme_name}</p>
            <div className="relative h-36 w-36 mb-4">
              <svg viewBox="0 0 36 36" className="rotate-[-90deg]">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none"
                  stroke={scorecard.overall_score >= 70 ? '#22c55e' : scorecard.overall_score >= 50 ? '#eab308' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${scorecard.overall_score} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{scorecard.overall_score.toFixed(0)}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">Overall</span>
              </div>
            </div>
            <Badge value={scorecard.risk_level} />
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-5">Dimension Scores</h3>
            <ScoreBar label="Liquidity" score={scorecard.liquidity_score} />
            <ScoreBar label="Profitability" score={scorecard.profitability_score} />
            <ScoreBar label="Revenue Stability" score={scorecard.stability_score} />
            <ScoreBar label="Growth" score={scorecard.growth_score} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-green-700 dark:text-green-400 mb-3">✓ Strengths</h3>
            {scorecard.strengths.length === 0
              ? <p className="text-sm text-gray-400">None identified</p>
              : scorecard.strengths.map((s, i) => <p key={i} className="text-sm text-gray-700 dark:text-gray-300 py-1">• {s}</p>)
            }
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-red-600 dark:text-red-400 mb-3">⚠ Weaknesses</h3>
            {scorecard.weaknesses.length === 0
              ? <p className="text-sm text-gray-400">None identified</p>
              : scorecard.weaknesses.map((w, i) => <p key={i} className="text-sm text-gray-700 dark:text-gray-300 py-1">• {w}</p>)
            }
          </div>
        </div>
      )}

      {!selected && !scLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-400">Select an SME to view its health scorecard.</p>
        </div>
      )}
    </AppLayout>
  )
}
