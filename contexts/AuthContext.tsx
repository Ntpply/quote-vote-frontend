import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface AuthContextType {
  username: string | null
  token: string | null
  login: (username: string, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUsername = localStorage.getItem('username')
    if (storedToken && storedUsername) {
      setToken(storedToken)
      setUsername(storedUsername)
    }
  }, [])

  const login = (username: string, token: string) => {
    setUsername(username)
    setToken(token)
    localStorage.setItem('token', token)
    localStorage.setItem('username', username)
  }

  const logout = () => {
    setUsername(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('username')
  }

  return (
    <AuthContext.Provider value={{ username, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
