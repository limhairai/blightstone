"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useAdminRoute } from "../../../hooks/useAdminRoute"
import { AdminOrgNotes } from "../../../components/admin/admin-org-notes";
import { Loader } from "../../../components/core/Loader";

export default function AdminNotesPage() {
  const { canViewAdmin, loading } = useAdminRoute();

  if (loading) return <Loader fullScreen />;
  if (!canViewAdmin) return <div className="text-red-500 p-4">Not authorized to view Notes page.</div>;

  return (
    <div>
      <h1>Admin Notes</h1>
      <AdminOrgNotes orgId="some-org-id" isSuperuser={canViewAdmin} />
    </div>
  );
} 