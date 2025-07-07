"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PromoteAdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new admin setup page
    router.replace("/admin-setup");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to admin setup...</p>
      </div>
    </div>
  );
} 