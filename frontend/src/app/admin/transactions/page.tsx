"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { AdminOrgTransactionsTable } from "../../../components/admin/admin-org-transactions-table";

export default function AdminTransactionsPage() {
  return (
    <div>
      <h1>Admin Transactions</h1>
      <AdminOrgTransactionsTable orgId="some-org-id" isSuperuser={true} />
    </div>
  );
} 