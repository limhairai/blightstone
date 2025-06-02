import { useSuperuser } from "@/contexts/SuperuserContext";
import { AdminOrgAccountsTable } from "@/components/admin/admin-org-accounts-table";

export default function AdminOrganizationsPage() {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!isSuperuser) return <div className="text-red-500">Not authorized</div>;

  return (
    <div>
      <h1>Admin Organizations</h1>
      <AdminOrgAccountsTable orgId="some-org-id" isSuperuser={isSuperuser} />
    </div>
  );
} 