import { useAuth } from '../context/AuthContext'
import { canAccess } from '../config/roles'

export function useRole() {
  const { user } = useAuth()
  const role = user?.role ?? null

  return {
    role,
    isAdmin: role === 'admin',
    isLender: role === 'lender',
    isProgramManager: role === 'program_manager',
    can: (path) => canAccess(role, path),
  }
}
