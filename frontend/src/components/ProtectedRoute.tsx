import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.some((role) =>
      user.roles.some((r) => r.toLowerCase() === role.toLowerCase())
    )
    if (!hasRole) {
      // Find the appropriate dashboard for their actual role
      if (user.roles.includes('Admin')) return <Navigate to="/admin" replace />
      if (user.roles.includes('Faculty')) return <Navigate to="/faculty" replace />
      if (user.roles.includes('Student')) return <Navigate to="/student" replace />
      
      return <Navigate to="/login" replace />
    }
  }

  return <>{children}</>
}
