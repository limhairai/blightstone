import { useSuperuser } from "@/contexts/SuperuserContext";
import { AdminOrgActivityLog } from "@/components/admin/admin-org-activity-log";
import { Loader } from "@/components/Loader";

export default function AdminActivityPage() {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!isSuperuser) return <div className="text-red-500">Not authorized</div>;

  return (
    <div>
      <h1>Admin Activity</h1>
      <AdminOrgActivityLog orgId="some-org-id" isSuperuser={isSuperuser} />
    </div>
  );
} 