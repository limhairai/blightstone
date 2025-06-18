"use client"

import { useEffect, useState } from "react"
import { DashboardView } from "../../components/dashboard/dashboard-view"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  if (!isMounted) {
    return <div>Loading...</div>
  }
  
  return <DashboardView />
} 