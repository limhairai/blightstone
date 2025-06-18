"use client"

import { AdminView } from "../../components/admin/admin-view"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

export default function AdminPage() {
  return <AdminView />
}