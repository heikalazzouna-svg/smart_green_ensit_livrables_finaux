import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiClient } from '@/api/client'

export interface UserResponse {
  id: number
  email: string
  full_name: string
  role: string
  entity_id: number | null
  is_active: boolean
}

interface AuthContextValue {
  user: UserResponse | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<UserResponse>
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(() => {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as UserResponse) : null
  })
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const { data } = await apiClient.get<UserResponse>('/auth/me')
      setUser(data)
      localStorage.setItem('user', JSON.stringify(data))
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const { data: tokenData } = await apiClient.post<{ access_token: string; token_type: string }>('/auth/login', {
      email,
      password,
    })
    localStorage.setItem('token', tokenData.access_token)
    const { data: profile } = await apiClient.get<UserResponse>('/auth/me')
    localStorage.setItem('user', JSON.stringify(profile))
    setUser(profile)
    return profile
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/login'
  }

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    login,
    logout,
    checkAuth,
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
