"use client"

import { useUser } from "@/contexts/user-context"
import { getGreeting } from "@/lib/get-greeting"
import { useEffect, useState } from "react"

export function WelcomeHeader() {
  const { userProfile, loading } = useUser()
  const [greeting, setGreeting] = useState("Hello")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const updateClientGreeting = () => setGreeting(getGreeting())
    updateClientGreeting()
    
    const interval = setInterval(updateClientGreeting, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return <div className="h-8 w-3/4 bg-muted animate-pulse rounded mb-2" />
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-3/4 mb-2" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    )
  }

  if (!userProfile) {
    return (
      <h1 className="text-2xl font-bold text-foreground">
        {greeting}, Explorer!
      </h1>
    )
  }

  return (
    <h1 className="text-2xl font-bold text-foreground">
      {greeting}, {userProfile.displayName || "Explorer"}!
    </h1>
  )
} 