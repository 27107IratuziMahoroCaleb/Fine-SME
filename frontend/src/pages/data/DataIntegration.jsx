import { useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardHeader } from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { smesApi, transactionsApi } from '../../services/api'
import { useForm } from 'react-hook-form'

export default function DataIntegration() {
  const [params] = useSearchParams()
  const [selectedSme, setSelectedSme] = useState(params.get('sme') || '')
  const [csvStatus, setCsvStatus] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()
  const { t } = useTranslation()
  const { data: smes, loading } = useApi(() => smesApi.list({}))
  const { data: summary, refetch } = useApi(
    () => selectedSme ? transactionsApi.summary(selectedSme) : Promise.resolve({ data: null }),
    [selectedSme]
  )

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()
  const [txError, setTxError] = useState('')
  const [txSuccess, setTxSuccess] = useState('')

  async function onAddTransaction(data) {
    setTxError(''); setTxSuccess('')
    try {
      await transactionsApi.add(selectedSme, { ...data, amount: Number(data.amount) })
      setTxSuccess('Transaction added successfully')
      reset(); refetch()
    } catch (e) { setTxError(e.response?.data?.detail || 'Failed') }
  }

  async function handleCsvUpload(e) {
    const file = e.target.files[0]
    if (!file || !selectedSme) return
    setUploading(true); setCsvStatus(null)
    try {
      const res = await transactionsApi.uploadCsv(selectedSme, file)
      setCsvStatus({ success: true, msg: `Imported ${res.data.imported} transactions` })
      refetch()
    } catch { setCsvStatus({ success: false, msg: 'Import failed. Check CSV format.' }) }
    finally { setUploading(false) }
  }

  if (loading) return <AppLayout><Spinner /></AppLayout>

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.data.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('page.data.subtitle')}</p>
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Select SME</label>
        <select
          value={selectedSme}
          onChange={e => setSelectedSme(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm w-full max-w-sm"
        >
          <option value="">— choose an SME —</option>
          {(smes || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {selectedSme && summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            ['Total Inflow', `RWF ${Number(summary.total_inflow || 0).toLocaleString()}`],
            ['Total Outflow', `RWF ${Number(summary.total_outflow || 0).toLocaleString()}`],
            ['Transactions', summary.transaction_count],
          ].map(([l, v]) => (
            <div key={l} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{l}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{v}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Add Single Transaction" />
          <div className="p-6">
            {!selectedSme
              ? <p className="text-sm text-gray-400">Select an SME first.</p>
              : (
                <form onSubmit={handleSubmit(onAddTransaction)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Date *" type="date" error={errors.date?.message} {...register('date', { required: true })} />
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type *</label>
                      <select className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm" {...register('type', { required: true })}>
                        <option value="inflow">Inflow</option>
                        <option value="outflow">Outflow</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Amount (RWF) *" type="number" error={errors.amount?.message} {...register('amount', { required: true })} />
                    <Input label="Category" placeholder="e.g. sales, rent" {...register('category')} />
                  </div>
                  <Input label="Description" {...register('description')} />
                  {txError && <p className="text-sm text-red-500">{txError}</p>}
                  {txSuccess && <p className="text-sm text-green-600">{txSuccess}</p>}
                  <Button type="submit" loading={isSubmitting} className="w-full">Add Transaction</Button>
                </form>
              )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Import CSV" subtitle="Columns: date, type, amount, category, balance, description" />
          <div className="p-6 space-y-4">
            {!selectedSme
              ? <p className="text-sm text-gray-400">Select an SME first.</p>
              : (
                <>
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-8 text-center">
                    <svg className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Upload a CSV file with transaction data</p>
                    <Button variant="secondary" onClick={() => fileRef.current.click()} loading={uploading}>
                      Choose CSV File
                    </Button>
                    <input ref={fileRef} type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                  </div>
                  {csvStatus && (
                    <p className={`text-sm ${csvStatus.success ? 'text-green-600' : 'text-red-500'}`}>{csvStatus.msg}</p>
                  )}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Expected CSV format:</p>
                    <code className="text-xs text-gray-500 dark:text-gray-400">date,type,amount,category,balance,description<br/>2024-01-15,inflow,500000,sales,1200000,January sales</code>
                  </div>
                </>
              )}
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
