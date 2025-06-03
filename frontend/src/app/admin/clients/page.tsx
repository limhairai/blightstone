"use client";

import { useSuperuser } from "@/contexts/SuperuserContext";
import { AdminClientAccountsTable } from "@/components/admin/admin-client-accounts-table";
import { Loader } from "@/components/core/Loader";

export default function AdminClientsPage() {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="text-red-500 p-4">Error resolving superuser status on Clients page: {error}</div>;
  if (!isSuperuser) return <div className="text-red-500 p-4">Not authorized to view Clients page.</div>;

  return (
    <div>
      <h1>Admin Clients</h1>
      <AdminClientAccountsTable _clientId="some-client-id" _isSuperuser={isSuperuser} />
    </div>
  );
} 