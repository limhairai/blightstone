import { useSuperuser } from "@/contexts/SuperuserContext";
import { AdminOrgFiles } from "@/components/admin/admin-org-files";
import { Loader } from "@/components/Loader";

export default function AdminFilesPage() {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!isSuperuser) return <div className="text-red-500">Not authorized</div>;

  return (
    <div>
      <h1>Admin Files</h1>
      <AdminOrgFiles orgId="some-org-id" isSuperuser={isSuperuser} />
    </div>
  );
} 