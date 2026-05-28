import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { useApi } from '../../hooks/useApi'
import { useRole } from '../../hooks/useRole'
import { useTranslation } from '../../hooks/useTranslation'
import { smesApi, engagementsApi, usersApi } from '../../services/api'
import { useForm } from 'react-hook-form'

const ENG_COLORS = {
  prospect:     'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  financed:     'bg-green-100 text-green-700',
  monitoring:   'bg-purple-100 text-purple-700',
  closed:       'bg-gray-100 text-gray-500',
}
const ENG_LABELS = {
  prospect: 'Prospect', under_review: 'Under Review',
  financed: 'Financed', monitoring: 'Monitoring', closed: 'Closed',
}

const SECTORS = ['Agriculture', 'Retail', 'Manufacturing', 'Services', 'Construction', 'ICT', 'Tourism', 'Transport', 'Health', 'Education']
const PROVINCES = ['Kigali', 'Eastern', 'Western', 'Northern', 'Southern']
const SIZES = [{ value: 'micro', label: 'Micro (1-5)' }, { value: 'small', label: 'Small (6-50)' }, { value: 'medium', label: 'Medium (51-250)' }]
const PAGE_SIZE_OPTIONS = [10, 25, 50]

function AddSMEModal({ open, onClose, onCreated, t, isAdmin }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()
  const [err, setErr] = useState('')
  const { data: advisors } = useApi(() => isAdmin ? usersApi.advisors() : Promise.resolve({ data: [] }), [isAdmin])

  async function onSubmit(data) {
    setErr('')
    try {
      await smesApi.create({
        ...data,
        employee_count: Number(data.employee_count || 0),
        assigned_advisor_id: data.assigned_advisor_id ? Number(data.assigned_advisor_id) : null,
      })
      reset(); onCreated(); onClose()
    } catch (e) { setErr(e.response?.data?.detail || 'Failed to create SME') }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('page.smes.addModal')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="SME Name *" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
        <Input label="Registration Number" {...register('registration_number')} />
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sector</label>
            <select className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm" {...register('sector')}>
              <option value="">Select…</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Size</label>
            <select className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm" {...register('size')}>
              {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Province</label>
            <select className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm" {...register('location_province')}>
              <option value="">Select…</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Input label="District" {...register('location_district')} />
        </div>
        <Input label="Owner Name" {...register('owner_name')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Owner Phone" {...register('owner_phone')} />
          <Input label="Employees" type="number" {...register('employee_count')} />
        </div>
        {isAdmin && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Assign Advisor <span className="text-gray-400 font-normal">(optional)</span></label>
            <select className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm" {...register('assigned_advisor_id')}>
              <option value="">— Unassigned —</option>
              {(advisors || []).map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
          </div>
        )}
        {err && <p className="text-sm text-red-500">{err}</p>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">{t('common.cancel')}</Button>
          <Button type="submit" loading={isSubmitting} className="flex-1">Create SME</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function SMEList() {
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { isLender, isAdmin } = useRole()
  const { t } = useTranslation()
  const { data: smes, loading, refetch } = useApi(() => smesApi.list({}))
  const { data: myEngs } = useApi(() => isLender ? engagementsApi.mine() : Promise.resolve({ data: [] }), [isLender])
  const { data: advisors } = useApi(() => isAdmin ? usersApi.advisors() : Promise.resolve({ data: [] }), [isAdmin])
  const [assigningId, setAssigningId] = useState(null)

  async function assignAdvisor(smeId, advisorId) {
    setAssigningId(smeId)
    try {
      await smesApi.update(smeId, { assigned_advisor_id: advisorId ? Number(advisorId) : null })
      refetch()
    } finally {
      setAssigningId(null)
    }
  }

  const engMap = useMemo(() => {
    const m = {}
    for (const e of (myEngs || [])) m[e.sme_id] = e.status
    return m
  }, [myEngs])

  const filtered = useMemo(() => {
    let list = smes || []
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.owner_name?.toLowerCase().includes(q) ||
        s.location_province?.toLowerCase().includes(q)
      )
    }
    if (sectorFilter) list = list.filter(s => s.sector === sectorFilter)
    return list
  }, [smes, search, sectorFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function handleSearch(e) { setSearch(e.target.value); setPage(1) }
  function handleSector(e) { setSectorFilter(e.target.value); setPage(1) }

  const colSpan = isLender ? 9 : 8

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.smes.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{filtered.length} of {smes?.length ?? 0} businesses</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>{t('page.smes.add')}</Button>
      </div>

      <AddSMEModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={refetch} t={t} isAdmin={isAdmin} />

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder={t('page.smes.searchPh')}
          value={search}
          onChange={handleSearch}
          className="flex-1 min-w-48 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <select
          value={sectorFilter}
          onChange={handleSector}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
        >
          <option value="">{t('common.allSectors')}</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={pageSize}
          onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
        >
          {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} {t('common.perPage')}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  {[t('common.name'), t('common.sector'), t('common.size'), t('common.location'), t('common.owner'), t('common.employees'), 'Advisor', ...(isLender ? [t('common.status')] : []), ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {paginated.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.sector || '—'}</td>
                    <td className="px-4 py-3"><Badge value={s.size} /></td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{[s.location_district, s.location_province].filter(Boolean).join(', ') || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.owner_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.employee_count}</td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <select
                          defaultValue={s.assigned_advisor_id ? String(s.assigned_advisor_id) : ''}
                          onChange={e => assignAdvisor(s.id, e.target.value)}
                          disabled={assigningId === s.id}
                          className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-xs focus:outline-none focus:border-primary-500 disabled:opacity-50 max-w-[140px]"
                        >
                          <option value="">— Unassigned —</option>
                          {(advisors || []).map(a => (
                            <option key={a.id} value={String(a.id)}>{a.full_name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-300">{s.assigned_advisor_name || <span className="text-gray-300 dark:text-gray-600">—</span>}</span>
                      )}
                    </td>
                    {isLender && (
                      <td className="px-4 py-3">
                        {engMap[s.id] ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ENG_COLORS[engMap[s.id]]}`}>
                            {ENG_LABELS[engMap[s.id]]}
                          </span>
                        ) : <span className="text-xs text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Link to={`/smes/${s.id}`} className="text-primary-600 hover:underline text-xs font-medium">{t('common.view')} →</Link>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={colSpan} className="px-4 py-12 text-center text-gray-400">
                    {search || sectorFilter ? t('page.smes.noResults') : t('page.smes.noSmes')}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span>
                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >←</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === '…'
                      ? <span key={`e${i}`} className="px-2 py-1.5">…</span>
                      : <button key={p} onClick={() => setPage(p)}
                          className={`px-3 py-1.5 rounded-lg border ${currentPage === p ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >{p}</button>
                  )
                }
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >→</button>
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  )
}
