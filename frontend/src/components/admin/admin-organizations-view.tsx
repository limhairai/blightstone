"use client"

import { useSuperuser } from "@/contexts/SuperuserContext"
import { AdminOrgAccountsTable } from "@/components/admin/admin-org-accounts-table"
import { Loader } from "@/components/core/Loader"

export function AdminOrganizationsView() {
  const { isSuperuser, loading, error } = useSuperuser()

  if (loading) return <Loader fullScreen />
  if (error) return <div className="text-red-500 p-4">Error resolving superuser status on Organizations page: {error}</div>
  if (!isSuperuser) return <div className="text-red-500 p-4">Not authorized to view Organizations page.</div>

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold">Organizations</h1>
        <p className="text-xs text-muted-foreground">Manage and monitor all organizations</p>
      </div>
      <AdminOrgAccountsTable _orgId="some-org-id" isSuperuser={isSuperuser} />
    </div>
  )
} 