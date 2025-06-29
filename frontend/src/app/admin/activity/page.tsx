"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { AdminOrgActivityLog } from "../../../components/admin/admin-org-activity-log";

export default function AdminActivityPage() {
  // Auth is handled by the layout, no need for redundant checks
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Activity</h1>
      <AdminOrgActivityLog orgId="some-org-id" isSuperuser={true} />
    </div>
  );
} 