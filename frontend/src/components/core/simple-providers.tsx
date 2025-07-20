"use client"

import { ThemeProvider } from "../ui/theme-provider"
import { AuthProvider, useAuth } from "../../contexts/AuthContext"
import { AppShell } from '../layout/app-shell'
import { Loader } from "./Loader"
import { useRouter, usePathname } from "next/navigation"
import React, { useEffect, useState, createContext, useContext } from "react"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { SWRConfig } from 'swr'
import { swrConfig } from '@/lib/swr-config'
import { PageTransition } from '@/lib/instant-transitions'
import { useAggressivePreloading, usePredictiveLoading } from '@/lib/bundle-optimization'
import { ResourceHints, CriticalCSS } from '@/lib/bundle-components'
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
    <div className="min-h-screen flex items-center justify-center text-red-500">
      {message}
    </div>
  );
}

function isPublicOrAuthPage(pathname: string): boolean {
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/confirm-email', '/magic-link'];
  if (publicRoutes.includes(pathname)) return true;
  // Handle routes like /auth/callback
  if (pathname.startsWith('/auth/')) return true;
  return false;
}

function isAdminPage(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

function AppRouter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();

  // Initialize performance optimizations
  useAggressivePreloading()
  usePredictiveLoading()
  useInstantPerformance()

  // While the authentication state is loading, show a loader to prevent a flash of the wrong content.
  if (authLoading) {
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
  // The AppDataProvider is included to provide necessary data for the authenticated experience.
  // Exception: Admin pages and onboarding have their own layout and should not be wrapped in AppShell.
  if (isAuthenticated && isProtectedPage) {
    if (pathname && (isAdminPage(pathname) || pathname === '/onboarding')) {
      // Admin pages and onboarding handle their own layout and don't need AppShell
      return <PageTransition>{children}</PageTransition>;
    }
    
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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <QueryClientProvider client={new QueryClient()}>
          <SWRConfig value={swrConfig}>
            <MicroInteractionsProvider>
              <AuthProvider>
                <PageTitleProvider>
                  <ResourceHints />
                  <CriticalCSS />
                  <AppRouter>{children}</AppRouter>
                </PageTitleProvider>
              </AuthProvider>
            </MicroInteractionsProvider>
          </SWRConfig>
        </QueryClientProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
} 