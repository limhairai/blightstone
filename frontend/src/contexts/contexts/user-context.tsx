"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
  plan: string
  avatar?: string
}

interface UserContextType {
  user: User | null
  loading: boolean
  error: Error | null
  updateUser: (user: User) => void
  clearUser: () => void
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  error: null,
  updateUser: () => {},
  clearUser: () => {},
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Here you would typically fetch the user data from your backend
    // For now, we'll just simulate a loading state
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const updateUser = (newUser: User) => {
    setUser(newUser)
  }

  const clearUser = () => {
    setUser(null)
  }

  return (
    <UserContext.Provider value={{ user, loading, error, updateUser, clearUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
} 