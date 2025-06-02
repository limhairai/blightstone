import { useSuperuser } from "@/contexts/SuperuserContext";
import { AdminOrgNotes } from "@/components/admin/admin-org-notes";
import { Loader } from "@/components/Loader";

export default function AdminNotesPage() {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!isSuperuser) return <div className="text-red-500">Not authorized</div>;

  return (
    <div>
      <h1>Admin Notes</h1>
      <AdminOrgNotes orgId="some-org-id" isSuperuser={isSuperuser} />
    </div>
  );
} 