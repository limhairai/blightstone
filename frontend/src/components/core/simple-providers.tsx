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
  const [isMounted, setIsMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const pathname = usePathname();
  const { user, session, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle redirects in useEffect
  useEffect(() => {
    if (!isMounted || authLoading || isRedirecting) return;

    const isPublicPage = isPublicOrAuthPage(pathname);
    const isAuthenticated = !!(user && session);

    // If authenticated user is on login/register, redirect to dashboard
    if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
      setIsRedirecting(true);
      router.push("/dashboard");
      return;
    }

    // If unauthenticated user is on protected page, redirect to login
    if (!isAuthenticated && !isPublicPage) {
      setIsRedirecting(true);
      router.push("/login");
      return;
    }
  }, [isMounted, authLoading, user, session, pathname, router]);

  // Reset redirecting flag when pathname changes
  useEffect(() => {
    setIsRedirecting(false);
  }, [pathname]);

  // Don't render anything until mounted and auth is ready
  if (!isMounted || authLoading || isRedirecting) {
    return <FullScreenLoader />;
  }

  const isPublicPage = isPublicOrAuthPage(pathname);
  const isAuthenticated = !!(user && session);

  // For public pages, render directly
  if (isPublicPage) {
    return <>{children}</>;
  }

  // For authenticated users on protected routes
  if (isAuthenticated) {
    if (isAdminPage(pathname)) {
      return (
        <AppDataProvider>
          {children}
        </AppDataProvider>
      );
    }
    
    return (
      <AppDataProvider>
        <AppShell>{children}</AppShell>
      </AppDataProvider>
    );
  }

  // Show loading while redirecting
  return <FullScreenLoader />;
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