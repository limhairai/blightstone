"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useAdminRoute } from "../../../hooks/useAdminRoute"
import { AdminOrgTasks } from "../../../components/admin/admin-org-tasks";
import { Loader } from "../../../components/core/Loader";

export default function AdminTasksPage() {
  const { canViewAdmin, loading } = useAdminRoute();

  if (loading) return <Loader fullScreen />;
  if (!canViewAdmin) return <div className="text-red-500 p-4">Not authorized to view Tasks page.</div>;

  return (
    <div>
      <h1>Admin Tasks</h1>
      <AdminOrgTasks orgId="some-org-id" isSuperuser={canViewAdmin} />
    </div>
  );
} 