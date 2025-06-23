"use client"

import { ThemeProvider } from "../ui/theme-provider"
import { AuthProvider, useAuth } from "../../contexts/AuthContext"
import { AppDataProvider } from "../../contexts/AppDataContext"
import { AppShell } from '../layout/app-shell'
import { Toaster } from "../ui/sonner"
import { Loader } from "./Loader"
import { useRouter, usePathname } from "next/navigation"
import React, { useEffect, useState, createContext, useContext } from "react"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

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
  return pathname === "/" || pathname === "/login" || pathname === "/register";
}

function isAdminPage(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

function AppRouter({ children }: { children: React.ReactNode }) {
  // Handle build-time rendering gracefully
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  
  // ALL HOOKS MUST BE CALLED AT THE TOP - NEVER CONDITIONALLY
  const { user, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isRouting, setIsRouting] = useState(false);
  
  // ALL useEffect hooks must also be at the top
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Don't redirect while loading or if no pathname or not mounted
    if (!isMounted || authLoading || !pathname) return;

    const isPublicPage = isPublicOrAuthPage(pathname);

    // Debug logging
    // // 🚨 SECURITY: Removed dangerous console log - console.log('Simplified Router:', { 
    //   user...
    // });

    // SIMPLE RULE 1: Not authenticated → Login
    if (!user || !session) {
      if (!isPublicPage) {
        // 🚨 SECURITY: Removed dangerous console log - console.log('Redirecting to login: not authenticat...;
        setIsRouting(true);
        router.replace("/login");
        return;
      }
      setIsRouting(false);
      return;
    }

    // SIMPLE RULE 2: Authenticated and on public page → Dashboard
    if (isPublicPage) {
      // 🚨 SECURITY: Removed dangerous console log - // 🚨 SECURITY: Removed dangerous console log - console.log('Redirecting to dashboard: authenticat...;
      router.replace("/dashboard");
      return;
    }

    // SIMPLE RULE 3: Authenticated and on protected page → Allow access
    setIsRouting(false);
  }, [isMounted, user, session, authLoading, pathname, router]);

  // Clear routing state when pathname changes
  useEffect(() => {
    setIsRouting(false);
  }, [pathname]);

  // During build time or before mounting, just render children
  if (!isMounted) {
    return <>{children}</>;
  }

  // For public pages (landing, login, register), render directly without auth checks
  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  // Show loading while auth is loading or routing
  if (authLoading || isRouting) {
    return <FullScreenLoader />;
  }

  // For authenticated users on protected routes, wrap with appropriate providers
  if (user && session && pathname && !isPublicOrAuthPage(pathname)) {
    // For admin pages, wrap with AppDataProvider (no AppShell)
    if (isAdminPage(pathname)) {
      return (
        <AppDataProvider>
          {children}
        </AppDataProvider>
      );
    }
    
    // For regular dashboard pages, wrap with AppDataProvider and AppShell
    return (
      <AppDataProvider>
        <AppShell>{children}</AppShell>
      </AppDataProvider>
    );
  }

  // // 🚨 SECURITY: Removed dangerous console log - console.log('Not wrapping with ProductionDataProvi... 
  // });
  
  // For public pages, return children directly (no data providers)
  return <>{children}</>;
}

export function SimpleProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <QueryClientProvider client={new QueryClient()}>
          <AuthProvider>
            <PageTitleProvider>
              <AppRouter>{children}</AppRouter>
            </PageTitleProvider>
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
} 