import { useSuperuser } from "@/contexts/SuperuserContext";
import { AdminOrgTransactionsTable } from "@/components/admin/admin-org-transactions-table";
import { Loader } from "@/components/Loader";

export default function AdminTransactionsPage() {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!isSuperuser) return <div className="text-red-500">Not authorized</div>;

  return (
    <div>
      <h1>Admin Transactions</h1>
      <AdminOrgTransactionsTable orgId="some-org-id" isSuperuser={isSuperuser} />
    </div>
  );
} 