"use client";

import { useSuperuser } from "@/contexts/SuperuserContext";
import { AdminOrgActivityLog } from "@/components/admin/admin-org-activity-log";
import { Loader } from "@/components/core/Loader";

export default function AdminActivityPage() {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="text-red-500 p-4">Error resolving superuser status on Activity page: {error}</div>;
  if (!isSuperuser) return <div className="text-red-500 p-4">Not authorized to view Activity page.</div>;

  return (
    <div>
      <h1>Admin Activity</h1>
      <AdminOrgActivityLog orgId="some-org-id" isSuperuser={isSuperuser} />
    </div>
  );
} 