import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/auth'
import { setAccessToken } from '../api/client'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Try to restore session via refresh token cookie
    authApi.refresh()
      .then(res => {
        setAccessToken(res.data.access_token)
        return client.get('/users/me')
      })
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await authApi.login({ email, password })
    setAccessToken(res.data.access_token)
    setUser(res.data.user)
    return res.data
  }

  const logout = async () => {
    try { await authApi.logout() } catch {}
    setAccessToken(null)
    setUser(null)
  }

  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }))

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
