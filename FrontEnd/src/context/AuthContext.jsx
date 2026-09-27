import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState(null)

  const handleLogin = (data) => {
    setUserRole(data.role)
    setLoggedIn(true)
  }

  const handleLogout = () => {
    fetch('http://localhost:8000/logout', {
      method: 'POST',
      credentials: 'include'
    }).catch((error) => {
      console.error('Logout error:', error)
    })

    setUserRole(null)
    setLoggedIn(false)
  }

  const value = {
    loggedIn,
    userRole,
    handleLogin,
    handleLogout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// custom hook so components just do: const { userRole } = useAuth()
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }

  return context
}
