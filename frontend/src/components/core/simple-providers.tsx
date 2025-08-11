"use client"

import { ThemeProvider } from "../ui/theme-provider"
import { AuthProvider, useAuth } from "../../contexts/AuthContext"
import { AppShell } from '../layout/app-shell'
import { Loader } from "./Loader"
import { useRouter, usePathname } from "next/navigation"
import React, { useEffect, useState, createContext, useContext } from "react"

import { TooltipProvider } from "@radix-ui/react-tooltip"


import { SWRConfig } from 'swr'
import { swrConfig } from '@/lib/swr-config'
import { PageTransition } from '@/lib/instant-transitions'


import { MicroInteractionsProvider } from '@/lib/micro-interactions'
import { useInstantPerformance } from '@/lib/instant-performance'

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
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      {message}
    </div>
  );
}

function isPublicOrAuthPage(pathname: string): boolean {
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/confirm-email', '/magic-link', '/reset-password'];
  if (publicRoutes.includes(pathname)) return true;
  // Handle routes like /auth/callback, /auth/update-password
  if (pathname.startsWith('/auth/')) return true;
  return false;
}



function AppRouter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const [hasHydrated, setHasHydrated] = useState(false);

  // Initialize performance optimizations
  useInstantPerformance()

  // Track hydration to prevent SSR/client mismatches
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // While the authentication state is loading or before hydration, show a loader
  if (authLoading || !hasHydrated) {
    return <FullScreenLoader />;
  }
  
  const isAuthenticated = !!user;
  const isProtectedPage = pathname ? !isPublicOrAuthPage(pathname) : true;

  // If trying to access a protected page without being authenticated,
  // return null immediately. The middleware will handle the redirect.
  // This prevents rendering children that rely on authenticated context.
  if (!isAuthenticated && isProtectedPage) {
    return null;
  }

  // If the user is authenticated and on a protected page, wrap the content in the AppShell.
  if (isAuthenticated && isProtectedPage) {
    return (
        <AppShell>
          <PageTransition>{children}</PageTransition>
        </AppShell>
    );
  }

  // For public pages (like /login) or when the user is not authenticated,
  // render the children directly without the AppShell.
  return <PageTransition>{children}</PageTransition>;
}

export function SimpleProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <TooltipProvider>
        <SWRConfig value={swrConfig}>
          <MicroInteractionsProvider>
            <AuthProvider>
              <PageTitleProvider>

                <AppRouter>{children}</AppRouter>
              </PageTitleProvider>
            </AuthProvider>
          </MicroInteractionsProvider>
        </SWRConfig>
      </TooltipProvider>
    </ThemeProvider>
  );
} 