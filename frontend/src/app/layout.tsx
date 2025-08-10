// Production guard removed - using production data only
// frontend/src/app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import { Inter, DM_Sans } from 'next/font/google';
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"
import { SimpleProviders } from "../components/core/simple-providers";
import { DynamicToaster } from "../components/ui/dynamic-toaster";
import { initializeAdminPerformance } from "@/lib/admin-performance";

import { CacheManagerInit } from "../components/core/cache-manager-init";

// Configure Inter font with minimal configuration to reduce loading issues
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Show fallback immediately, swap when Inter loads
  weight: ['400', '500', '600', '700'], // Only load weights we use
  variable: '--font-inter', // CSS variable for easier usage
});

// Configure DM Sans font for headings
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
});

// Add or edit your "generateMetadata" to include the Sentry trace data:
export function generateMetadata(): Metadata {
  const baseMetadata = {
    title: "Blightstone - Internal CRM Platform",
    description: "Internal CRM platform for managing clients and business operations",
    generator: 'v0.dev',
  };

  // Only add Sentry trace data in production
  if (process.env.NODE_ENV === 'production') {
    const Sentry = require('@sentry/nextjs');
    return {
      ...baseMetadata,
      other: {
        ...Sentry.getTraceData()
      }
    };
  }

  return baseMetadata;
}

// Production guard removed - using production data only

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize admin performance optimizations
  if (typeof window !== 'undefined') {
    initializeAdminPerformance();
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${inter.variable} ${dmSans.variable}`}>
        <SimpleProviders>
          <CacheManagerInit />
          {children}
          <DynamicToaster />
        </SimpleProviders>
      </body>
    </html>
  );
} 
