"use client"

import { DashboardView } from "../../components/dashboard/dashboard-view"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return <DashboardView />
} 