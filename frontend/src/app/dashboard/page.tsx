"use client"

import { ProjectDashboardView } from '@/components/dashboard/project-dashboard-view'

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return <ProjectDashboardView />
} 