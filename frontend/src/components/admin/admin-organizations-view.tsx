"use client"

import { AdminOrgAccountsTable } from "./admin-org-accounts-table"

export function AdminOrganizationsView() {
  // Auth is handled by the layout, no need for redundant checks
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold">Organizations</h1>
        <p className="text-xs text-muted-foreground">Manage and monitor all organizations</p>
      </div>
      <AdminOrgAccountsTable _orgId="some-org-id" isSuperuser={true} />
    </div>
  )
} 