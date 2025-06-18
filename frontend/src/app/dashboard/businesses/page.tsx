"use client"

import { BusinessesView } from "../../../components/dashboard/businesses/businesses-view"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

export default function BusinessesPage() {
  return <BusinessesView />
} 