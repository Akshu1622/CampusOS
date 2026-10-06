import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiClient } from '@/api/client'

export interface User {
  id: number
  username: string
  roles: string[]
  permission_sets: string[]
  status: string
  person_id?: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (token: string, refresh: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      apiClient<User>('/me')
        .then((userData) => {
          setUser(userData)
        })
        .catch(() => {
          // Handled by apiClient's session expiration
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = (token: string, refresh: string) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('refresh_token', refresh)
    setIsLoading(true)
    apiClient<User>('/me')
      .then((userData) => {
        setUser(userData)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const logout = async () => {
    const refresh_token = localStorage.getItem('refresh_token')
    if (refresh_token) {
      try {
        await apiClient('/auth/logout', { method: 'POST', data: { refresh_token } })
      } catch (e) {
        console.error('Logout failed', e)
      }
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
