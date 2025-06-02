import { useSuperuser } from "@/contexts/SuperuserContext";
import { AdminStats } from "@/components/admin/admin-stats";
import { Loader } from "@/components/Loader";

export default function AdminStatsPage() {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!isSuperuser) return <div className="text-red-500">Not authorized</div>;

  return (
    <div>
      <h1>Admin Stats</h1>
      <AdminStats isSuperuser={isSuperuser} />
    </div>
  );
} 