"use client"

import { ThemeProvider } from "./theme-provider"
import { FirebaseProvider } from "@/contexts/FirebaseContext"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { OnboardingProvider } from "@/contexts/onboarding-context"
import { TeamProvider } from "@/contexts/TeamContext"
import { AdminProvider } from "@/contexts/AdminContext"
import { TeamSettingsProvider } from "@/contexts/TeamSettingsContext"
import { WalletProvider } from "@/contexts/WalletContext"
import { OrganizationProvider, useOrganization } from "@/contexts/organization-context"
import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from "@/components/ui/toaster"
import { Loader } from "@/components/core/Loader"
import { useRouter, usePathname } from "next/navigation"
import React, { useEffect, useState, createContext, useContext } from "react"
import { UserProvider } from "@/contexts/user-context"
import { NotificationProvider } from "@/contexts/NotificationContext"

// PageTitle Context
const PageTitleContext = createContext<{
  pageTitle: string;
  setPageTitle: (title: string) => void;
}>({
  pageTitle: "",
  setPageTitle: () => {},
});

export function usePageTitle() {
  return useContext(PageTitleContext);
}

function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [pageTitle, setPageTitle] = useState("");
  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

function FullScreenLoader() {
  return <Loader fullScreen />;
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-red-500">
      {message}
    </div>
  );
}

function AuthOrgGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { organizations, currentOrg, loading: orgLoading, error: orgError } = useOrganization();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't run redirection logic if core data is loading, user is not logged in, or there's an org error.
    // These cases are handled by the early returns below.
    if (authLoading || (user && orgLoading) || !user || orgError) {
      return;
    }

    if (
      organizations !== undefined &&
      organizations.length === 0 &&
      !orgLoading && // Ensure org loading is complete
      pathname !== "/onboarding"
    ) {
      router.replace("/onboarding");
    } else if (
      organizations !== undefined &&
      organizations.length > 0 &&
      !orgLoading && // Ensure org loading is complete
      (pathname === "/onboarding" || pathname === "/")
    ) {
      router.replace("/dashboard");
    }
  }, [user, organizations, orgLoading, authLoading, orgError, router, pathname]);

  // 1. Show loader until auth/org are resolved
  if (authLoading || (user && orgLoading)) {
    return <FullScreenLoader />;
  }

  // 2. If not logged in, show public pages (useEffect above won't run for !user)
  if (!user) {
    return <>{children}</>;
  }

  // 3. Handle org error (useEffect above won't run for orgError)
  if (orgError) {
    return <ErrorScreen message="Cannot fetch organization" />;
  }
  
  // 4. If user has no orgs and is not on onboarding, show loader (redirect is handled by useEffect)
  // This return is to prevent rendering children while redirect is occurring.
  if (
    organizations !== undefined &&
    organizations.length === 0 &&
    !orgLoading &&
    pathname !== "/onboarding"
  ) {
    return <FullScreenLoader />; // Show loader while redirecting
  }

  // Similar loader for redirection to dashboard
  if (
    organizations !== undefined &&
    organizations.length > 0 &&
    !orgLoading &&
    (pathname === "/onboarding" || pathname === "/")
  ) {
    return <FullScreenLoader />; // Show loader while redirecting
  }

  // 5. If user has orgs but currentOrg is not set yet, show loader
  if (user && organizations && organizations.length > 0 && !currentOrg) {
    return <FullScreenLoader />;
  }

  // 6. If user has org and currentOrg, render the app
  return (
    <TeamProvider>
      <AdminProvider>
        <TeamSettingsProvider>
          <OnboardingProvider>
            <WalletProvider>
              <AppShell>{children}</AppShell>
            </WalletProvider>
          </OnboardingProvider>
        </TeamSettingsProvider>
      </AdminProvider>
    </TeamProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <FirebaseProvider>
        <AuthProvider>
          <OrganizationProvider>
            <UserProvider>
              <NotificationProvider>
                <PageTitleProvider>
                  <AuthOrgGate>{children}</AuthOrgGate>
                </PageTitleProvider>
              </NotificationProvider>
            </UserProvider>
          </OrganizationProvider>
        </AuthProvider>
      </FirebaseProvider>
    </ThemeProvider>
  );
} 