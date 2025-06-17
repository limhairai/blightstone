"use client";

import { PromoteUser } from "../../components/admin/promote-user";

export default function PromoteAdminPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Admin Promotion Tool
          </h1>
          <p className="text-muted-foreground text-sm">
            Development utility to promote users to admin status
          </p>
        </div>
        
        <PromoteUser />
        
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            After promotion, navigate to <code className="bg-muted px-1 rounded">/admin</code> to access the admin panel
          </p>
        </div>
      </div>
    </div>
  );
} 