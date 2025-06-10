"use client";

import { useSuperuser } from "@/contexts/SuperuserContext";
import { AdminOrgTasks } from "@/components/admin/admin-org-tasks";
import { Loader } from "@/components/core/Loader";

export default function AdminTasksPage() {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="text-red-500 p-4">Error resolving superuser status on Tasks page: {error}</div>;
  if (!isSuperuser) return <div className="text-red-500 p-4">Not authorized to view Tasks page.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-4">Admin Tasks</h1>
      <p className="text-muted-foreground">Admin tasks page is under development.</p>
    </div>
  );
} 