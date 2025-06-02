"use client"

import { createContext, useContext, type ReactNode, useState, useEffect } from "react"

type User = {
  name: string
  email: string
  initial: string
}

type UserContextType = {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching user data
    const timer = setTimeout(() => {
      setUser({
        name: "Victor",
        email: "victor@example.com",
        initial: "V",
      })
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return <UserContext.Provider value={{ user, isLoading, setUser }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
