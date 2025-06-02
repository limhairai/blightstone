"use client"

import { useUser } from "@/contexts/user-context"
import { getGreeting } from "@/lib/get-greeting"
import { useEffect, useState } from "react"

export function WelcomeHeader() {
  const { user, isLoading } = useUser()
  const [greeting, setGreeting] = useState(getGreeting())
  const [mounted, setMounted] = useState(false)

  // Update greeting every hour
  useEffect(() => {
    setMounted(true)
    const updateGreeting = () => setGreeting(getGreeting())
    const interval = setInterval(updateGreeting, 60 * 60 * 1000) // Update every hour

    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return <div className="h-8 w-48 bg-muted animate-pulse rounded" />
  }

  return (
    <h2 className="text-2xl font-bold text-foreground">
      {isLoading ? <div className="h-8 w-48 bg-muted animate-pulse rounded" /> : `${greeting}, ${user?.name || "User"}`}
    </h2>
  )
}
