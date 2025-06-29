"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { AdminOrgTasks } from "../../../components/admin/admin-org-tasks";

export default function AdminTasksPage() {
  // Auth is handled by the layout, no need for redundant checks
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Tasks</h1>
      <AdminOrgTasks orgId="some-org-id" isSuperuser={true} />
    </div>
  );
} 