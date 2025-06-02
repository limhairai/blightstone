import { useSuperuser } from "@/contexts/SuperuserContext";
import { AdminClientAccountsTable } from "@/components/admin/admin-client-accounts-table";
import { Loader } from "@/components/Loader";

export default function AdminClientsPage() {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!isSuperuser) return <div className="text-red-500">Not authorized</div>;

  return (
    <div>
      <h1>Admin Clients</h1>
      <AdminClientAccountsTable clientId="some-client-id" isSuperuser={isSuperuser} />
    </div>
  );
} 