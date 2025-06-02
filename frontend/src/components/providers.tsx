"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { DevNavigation } from "@/components/dev-navigation"
import { FirebaseProvider } from "@/contexts/FirebaseContext"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { OnboardingProvider } from "@/contexts/onboarding-context"
import { TeamProvider } from "@/contexts/TeamContext"
import { AdminProvider } from "@/contexts/AdminContext"
import { TeamSettingsProvider } from "@/contexts/TeamSettingsContext"
import { WalletProvider } from "@/contexts/WalletContext"
import { OrganizationProvider, useOrganization } from "@/contexts/organization-context"
import AppShell from '@/components/app-shell'
import { Loader } from "@/components/Loader"
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

  // 1. Show loader until auth/org are resolved
  if (authLoading || (user && orgLoading)) {
    return <FullScreenLoader />;
  }

  // 2. If not logged in, show public pages
  if (!user) {
    return <>{children}</>;
  }

  // 3. Handle org error
  if (orgError) {
    return <ErrorScreen message="Cannot fetch organization" />;
  }

  // 4. If user has no orgs, redirect to onboarding (but not if already on onboarding)
  useEffect(() => {
    if (
      user &&
      organizations !== undefined &&
      organizations.length === 0 &&
      !orgLoading &&
      pathname !== "/onboarding"
    ) {
      router.replace("/onboarding");
    }
    if (
      user &&
      organizations !== undefined &&
      organizations.length > 0 &&
      !orgLoading &&
      (pathname === "/onboarding" || pathname === "/")
    ) {
      router.replace("/dashboard");
    }
  }, [user, organizations, orgLoading, router, pathname]);
  if (
    user &&
    organizations !== undefined &&
    organizations.length === 0 &&
    !orgLoading &&
    pathname !== "/onboarding"
  ) {
    return <FullScreenLoader />;
  }
  if (
    user &&
    organizations !== undefined &&
    organizations.length > 0 &&
    !orgLoading &&
    (pathname === "/onboarding" || pathname === "/")
  ) {
    return <FullScreenLoader />;
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
              <DevNavigation />
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