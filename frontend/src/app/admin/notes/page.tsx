"use client";

import { useSuperuser } from "../../../contexts/SuperuserContext";
import { AdminOrgNotes } from "../../../components/admin/admin-org-notes";
import { Loader } from "../../../components/core/Loader";

export default function AdminNotesPage() {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="text-red-500 p-4">Error resolving superuser status on Notes page: {error}</div>;
  if (!isSuperuser) return <div className="text-red-500 p-4">Not authorized to view Notes page.</div>;

  return (
    <div>
      <h1>Admin Notes</h1>
      <AdminOrgNotes orgId="some-org-id" isSuperuser={isSuperuser} />
    </div>
  );
} 