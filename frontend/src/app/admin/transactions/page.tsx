"use client";

import { useSuperuser } from "@/contexts/SuperuserContext";
import { AdminOrgTransactionsTable } from "@/components/admin/admin-org-transactions-table";
import { Loader } from "@/components/core/Loader";

export default function AdminTransactionsPage() {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="text-red-500 p-4">Error resolving superuser status on Transactions page: {error}</div>;
  if (!isSuperuser) return <div className="text-red-500 p-4">Not authorized to view Transactions page.</div>;

  return (
    <div>
      <h1>Admin Transactions</h1>
      <AdminOrgTransactionsTable orgId="some-org-id" isSuperuser={isSuperuser} />
    </div>
  );
} 