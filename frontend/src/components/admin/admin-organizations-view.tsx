"use client"

import { useAdminRoute } from "../../hooks/useAdminRoute"
import { AdminOrgAccountsTable } from "./admin-org-accounts-table"
import { Loader } from "../core/Loader"

export function AdminOrganizationsView() {
  const { canViewAdmin, loading } = useAdminRoute()

  if (loading) return <Loader fullScreen />
  if (!canViewAdmin) return <div className="text-red-500 p-4">Not authorized to view Organizations page.</div>

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold">Organizations</h1>
        <p className="text-xs text-muted-foreground">Manage and monitor all organizations</p>
      </div>
      <AdminOrgAccountsTable _orgId="some-org-id" isSuperuser={canViewAdmin} />
    </div>
  )
} 