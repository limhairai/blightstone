"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useAdminRoute } from "../../../hooks/useAdminRoute"
import { AdminOrgActivityLog } from "../../../components/admin/admin-org-activity-log";
import { Loader } from "../../../components/core/Loader";

export default function AdminActivityPage() {
  const { canViewAdmin, loading } = useAdminRoute();

  if (loading) return <Loader fullScreen />;
  if (!canViewAdmin) return <div className="text-red-500 p-4">Not authorized to view Activity page.</div>;

  return (
    <div>
      <h1>Admin Activity</h1>
      <AdminOrgActivityLog orgId="some-org-id" isSuperuser={canViewAdmin} />
    </div>
  );
} 