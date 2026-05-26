/**
 * Defines which nav routes each role can access.
 * Routes not listed here are inaccessible for that role (redirect to /unauthorized).
 */

export const ROLES = {
  ADMIN: 'admin',
  LENDER: 'lender',
  SME_ADVISOR: 'sme_advisor',
  RISK_ANALYST: 'risk_analyst',
  PROGRAM_MANAGER: 'program_manager',
}

// Routes each role is allowed to visit
export const ROLE_ROUTES = {
  admin: ['*'],  // admin sees everything
  lender: [
    '/dashboard', '/smes', '/predictions', '/alerts',
    '/scorecard', '/credit', '/reports', '/profile',
  ],
  sme_advisor: [
    '/dashboard', '/smes', '/data', '/alerts',
    '/scorecard', '/recommendations', '/profile',
  ],
  risk_analyst: [
    '/dashboard', '/smes', '/predictions', '/alerts',
    '/scorecard', '/sector', '/portfolio', '/reports', '/profile',
  ],
  program_manager: [
    '/dashboard', '/smes', '/portfolio', '/sector', '/reports', '/engagements', '/profile',
  ],
}

// Nav items — each entry declares which roles can see it
export const NAV_ITEMS = [
  { to: '/dashboard',     label: 'Dashboard',        i18nKey: 'nav.dashboard',       roles: ['admin', 'lender', 'sme_advisor', 'risk_analyst', 'program_manager'], icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/smes',          label: 'SMEs',             i18nKey: 'nav.smes',            roles: ['admin', 'lender', 'sme_advisor', 'risk_analyst', 'program_manager'], icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { to: '/data',          label: 'Data Integration', i18nKey: 'nav.data',            roles: ['admin', 'sme_advisor'],                                              icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
  { to: '/predictions',   label: 'Risk Predictions', i18nKey: 'nav.predictions',     roles: ['admin', 'lender', 'risk_analyst'],                                   icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { to: '/alerts',        label: 'Early Warnings',   i18nKey: 'nav.alerts',          roles: ['admin', 'lender', 'sme_advisor', 'risk_analyst'],                    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  { to: '/scorecard',     label: 'Health Scorecard', i18nKey: 'nav.scorecard',       roles: ['admin', 'lender', 'sme_advisor', 'risk_analyst'],                    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { to: '/recommendations',label: 'Recommendations', i18nKey: 'nav.recommendations', roles: ['admin', 'sme_advisor'],                                              icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { to: '/credit',        label: 'Credit Assessment',i18nKey: 'nav.credit',          roles: ['admin', 'lender'],                                                   icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { to: '/sector',        label: 'Sector Analytics', i18nKey: 'nav.sector',          roles: ['admin', 'risk_analyst', 'program_manager'],                          icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' },
  { to: '/portfolio',     label: 'Portfolio',        i18nKey: 'nav.portfolio',       roles: ['admin', 'risk_analyst', 'program_manager'],                          icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { to: '/reports',       label: 'Reports',          i18nKey: 'nav.reports',         roles: ['admin', 'lender', 'risk_analyst', 'program_manager'],                icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to: '/engagements',   label: 'Engagements',      i18nKey: 'nav.engagements',     roles: ['admin', 'program_manager'],                                          icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { divider: true, roles: ['admin'] },
  { to: '/admin/users',   label: 'User Management',  i18nKey: 'nav.users',           roles: ['admin'],                                                             icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { to: '/audit',         label: 'Audit Logs',       i18nKey: 'nav.audit',           roles: ['admin'],                                                             icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
]

export function canAccess(role, path) {
  if (!role) return false
  if (role === ROLES.ADMIN) return true
  const allowed = ROLE_ROUTES[role] ?? []
  // Match exact or prefix (e.g. /smes/:id matches /smes)
  return allowed.some(r => path === r || path.startsWith(r + '/'))
}
