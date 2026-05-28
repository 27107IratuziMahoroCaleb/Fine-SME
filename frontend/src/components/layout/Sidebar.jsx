import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { NAV_ITEMS } from '../../config/roles'
import { useRole } from '../../hooks/useRole'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../hooks/useTranslation'
import { LogoCompact } from '../ui/Logo'

export default function Sidebar({ onClose }) {
  const { role } = useRole()
  const { user } = useAuth()
  const { t } = useTranslation()

  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(role)
  })

  return (
    <aside className="w-64 bg-gray-900 min-h-screen flex flex-col">
      <div className="px-6 py-5 border-b border-gray-800">
        <LogoCompact markColor="#2563eb" fineColor="#ffffff" smeColor="#93c5fd" size="md" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item, i) => {
          if (item.divider) return <div key={i} className="my-3 border-t border-gray-800" />
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )
              }
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span>{item.i18nKey ? t(item.i18nKey) : item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-gray-800">
        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors',
              isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )
          }
        >
          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.full_name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{user?.full_name ?? 'Profile'}</p>
            <p className="text-xs text-gray-500 capitalize leading-tight">{role?.replace('_', ' ') ?? 'unknown'}</p>
          </div>
          {user?.mfa_enabled && (
            <span className="flex-shrink-0 text-xs font-semibold text-green-400 bg-green-900/40 px-1.5 py-0.5 rounded">MFA</span>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
