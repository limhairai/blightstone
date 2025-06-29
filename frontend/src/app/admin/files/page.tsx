"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { AdminOrgFiles } from "../../../components/admin/admin-org-files";

export default function AdminFilesPage() {
  // Auth is handled by the layout, no need for redundant checks
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Files</h1>
      <AdminOrgFiles orgId="some-org-id" isSuperuser={true} />
    </div>
  );
} 