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

      <div className="px-4 py-3 border-t border-gray-800 space-y-2">
        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-colors',
              isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )
          }
        >
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="truncate">{user?.full_name ?? 'Profile'}</span>
          {user?.mfa_enabled && (
            <span className="ml-auto text-green-400 text-xs font-bold">MFA</span>
          )}
        </NavLink>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400 capitalize">
          {role?.replace('_', ' ') ?? 'unknown'}
        </span>
      </div>
    </aside>
  )
}
