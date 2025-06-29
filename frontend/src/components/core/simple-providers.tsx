"use client"

import { ThemeProvider } from "../ui/theme-provider"
import { AuthProvider, useAuth } from "../../contexts/AuthContext"
import { AppShell } from '../layout/app-shell'
import { Toaster } from "sonner"
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
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/confirm-email'];
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

  // While the authentication state is loading, show a loader to prevent a flash of the wrong content.
  if (authLoading) {
    return <FullScreenLoader />;
  }
  
  const isAuthenticated = !!user;
  const isProtectedPage = !isPublicOrAuthPage(pathname);

  // If trying to access a protected page without being authenticated,
  // return null immediately. The middleware will handle the redirect.
  // This prevents rendering children that rely on authenticated context.
  if (!isAuthenticated && isProtectedPage) {
    return null;
  }

  // If the user is authenticated and on a protected page, wrap the content in the AppShell.
  // The AppDataProvider is included to provide necessary data for the authenticated experience.
  // Exception: Admin pages have their own layout and should not be wrapped in AppShell.
  if (isAuthenticated && isProtectedPage) {
    if (isAdminPage(pathname)) {
      // Admin pages handle their own layout and don't need AppShell
      return <>{children}</>;
    }
    
    return (
        <AppShell>{children}</AppShell>
    );
  }

  // For public pages (like /login) or when the user is not authenticated,
  // render the children directly without the AppShell.
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