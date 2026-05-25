import AppLayout from '../../components/layout/AppLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useTranslation } from '../../hooks/useTranslation'
import { usersApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function UserManagement() {
  const { user: me } = useAuth()
  const { t } = useTranslation()
  const { data: users, loading, refetch } = useApi(() => usersApi.list())

  async function toggle(u) {
    if (u.is_active) await usersApi.deactivate(u.id)
    else await usersApi.activate(u.id)
    refetch()
  }

  if (loading) return <AppLayout><Spinner /></AppLayout>

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.users.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{users?.length ?? 0} {t('page.users.subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              {['Name', 'Email', 'Role', 'Organisation', 'Status', 'Last Login', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {(users || []).map(u => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{u.full_name}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                <td className="px-4 py-3"><Badge value={u.role} label={u.role.replace('_', ' ')} /></td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.organization || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</td>
                <td className="px-4 py-3">
                  {u.id !== me?.id && (
                    <Button variant={u.is_active ? 'danger' : 'secondary'} className="text-xs py-1" onClick={() => toggle(u)}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}
