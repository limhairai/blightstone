"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useSuperuser } from "../../../contexts/AppDataContext"
import { AdminOrgFiles } from "../../../components/admin/admin-org-files";
import { Loader } from "../../../components/core/Loader";

export default function AdminFilesPage() {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="text-red-500 p-4">Error resolving superuser status on Files page: {error}</div>;
  if (!isSuperuser) return <div className="text-red-500 p-4">Not authorized to view Files page.</div>;

  return (
    <div>
      <h1>Admin Files</h1>
      <AdminOrgFiles orgId="some-org-id" isSuperuser={isSuperuser} />
    </div>
  );
} 