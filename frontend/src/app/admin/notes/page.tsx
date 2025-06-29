"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { AdminOrgNotes } from "../../../components/admin/admin-org-notes";

export default function AdminNotesPage() {
  // Auth is handled by the layout, no need for redundant checks
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Notes</h1>
      <AdminOrgNotes orgId="some-org-id" isSuperuser={true} />
    </div>
  );
} 