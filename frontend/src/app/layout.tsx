// Production guard removed - using production data only
// frontend/src/app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/react"
import { SimpleProviders } from "../components/core/simple-providers";
import { EnvIndicator } from "../components/debug/env-indicator";
import { DynamicToaster } from "../components/ui/dynamic-toaster";

// Configure Inter font with minimal configuration to reduce loading issues
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Show fallback immediately, swap when Inter loads
  weight: ['400', '500', '600', '700'], // Only load weights we use
  variable: '--font-inter', // CSS variable for easier usage
});

// Add or edit your "generateMetadata" to include the Sentry trace data:
export function generateMetadata(): Metadata {
  const baseMetadata = {
    title: "AdHub - Ad Account Management Platform",
    description: "Manage your advertising accounts across multiple platforms",
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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${inter.variable}`}>
        <SimpleProviders>
          {children}
          <EnvIndicator />
          <DynamicToaster />
        </SimpleProviders>
      </body>
    </html>
  );
} 
