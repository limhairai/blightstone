import { useSuperuser } from "@/contexts/SuperuserContext";
import { AdminOrgTasks } from "@/components/admin/admin-org-tasks";
import { Loader } from "@/components/Loader";

export default function AdminTasksPage() {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!isSuperuser) return <div className="text-red-500">Not authorized</div>;

  return (
    <div>
      <h1>Admin Tasks</h1>
      <AdminOrgTasks orgId="some-org-id" isSuperuser={isSuperuser} />
    </div>
  );
} 