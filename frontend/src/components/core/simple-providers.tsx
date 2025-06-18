"use client"

import { ThemeProvider } from "../ui/theme-provider"
import { AuthProvider, useAuth } from "../../contexts/AuthContext"
import { ProductionDataProvider } from "../../contexts/ProductionDataContext"
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
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During build time or before mounting, just render children
  if (!isMounted) {
    return <>{children}</>;
  }

  // For public pages (landing, login, register), render directly without auth checks
  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  const { user, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isRouting, setIsRouting] = useState(false);

  useEffect(() => {
    // Don't redirect while loading or if no pathname
    if (authLoading || !pathname) return;

    const isPublicPage = isPublicOrAuthPage(pathname);

    console.log('Simplified Router:', { 
      user: !!user, 
      session: !!session, 
      pathname, 
      isPublicPage,
      authLoading
    });

    // SIMPLE RULE 1: Not authenticated → Login
    if (!user || !session) {
      if (!isPublicPage) {
        console.log('Redirecting to login: not authenticated');
        setIsRouting(true);
        router.replace("/login");
        return;
      }
      setIsRouting(false);
      return;
    }

    // SIMPLE RULE 2: Authenticated and on public page → Dashboard
    if (isPublicPage) {
      console.log('Redirecting to dashboard: authenticated user on public page');
      setIsRouting(true);
      router.replace("/dashboard");
      return;
    }

    // SIMPLE RULE 3: Authenticated and on protected page → Allow access
    setIsRouting(false);
  }, [user, session, authLoading, pathname, router]);

  // Clear routing state when pathname changes
  useEffect(() => {
    setIsRouting(false);
  }, [pathname]);

  // Show loading while auth is loading or routing
  if (authLoading || isRouting) {
    return <FullScreenLoader />;
  }

  // For authenticated users on protected routes, wrap with ProductionDataProvider
  if (user && session && pathname && !isPublicOrAuthPage(pathname)) {
    // For admin pages, wrap with ProductionDataProvider (no AppShell)
    if (isAdminPage(pathname)) {
      return (
        <ProductionDataProvider>
          {children}
        </ProductionDataProvider>
      );
    }
    
    // For regular dashboard pages, wrap with ProductionDataProvider and AppShell
    return (
      <ProductionDataProvider>
        <AppShell>{children}</AppShell>
      </ProductionDataProvider>
    );
  }

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