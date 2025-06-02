// "use client"; // Removed: This page itself can be a Server Component

import type { Metadata } from "next";
import AccountsPageClient from "./AccountsPageClient"; // Corrected: Relative import to AccountsPageClient.tsx
// AppShell is provided by layout.tsx for the /dashboard/* routes

export const metadata: Metadata = {
  title: "Accounts | AdHub",
  description: "Manage your ad accounts and projects",
};

export default function AccountsPage() {
  // AppShell is provided by frontend/src/app/dashboard/layout.tsx
  return <AccountsPageClient />;
} 