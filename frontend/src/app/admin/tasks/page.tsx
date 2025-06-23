"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useSuperuser } from "../../../contexts/AppDataContext"
import { AdminOrgTasks } from "../../../components/admin/admin-org-tasks";
import { Loader } from "../../../components/core/Loader";

export default function AdminTasksPage() {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="text-red-500 p-4">Error resolving superuser status on Tasks page: {error}</div>;
  if (!isSuperuser) return <div className="text-red-500 p-4">Not authorized to view Tasks page.</div>;

  return (
    <div>
      <h1>Admin Tasks</h1>
      <AdminOrgTasks orgId="some-org-id" isSuperuser={isSuperuser} />
    </div>
  );
} 