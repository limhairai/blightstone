"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useAdminRoute } from "../../../hooks/useAdminRoute"
import { AdminOrgFiles } from "../../../components/admin/admin-org-files";
import { Loader } from "../../../components/core/Loader";

export default function AdminFilesPage() {
  const { canViewAdmin, loading } = useAdminRoute();

  if (loading) return <Loader fullScreen />;
  if (!canViewAdmin) return <div className="text-red-500 p-4">Not authorized to view Files page.</div>;

  return (
    <div>
      <h1>Admin Files</h1>
      <AdminOrgFiles orgId="some-org-id" isSuperuser={canViewAdmin} />
    </div>
  );
} 