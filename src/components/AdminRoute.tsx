import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'

interface AdminRouteProps {
  children: ReactNode
}

/**
 * Admin Route Guard
 * Protects admin routes - only allows access if user is authenticated AND is admin
 */
function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" />
  }

  return <>{children}</>
}

export default AdminRoute

