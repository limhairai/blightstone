"use client";

import { ApplicationsView } from "../../../components/dashboard/applications/applications-view"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

export default function ApplicationsPage() {
  return <ApplicationsView />
} 