// frontend/src/app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/react"
import { SimpleProviders } from "../components/core/simple-providers";
import { EnvIndicator } from "../components/debug/env-indicator";
import { Toaster } from "../components/ui/sonner";
import { DemoProvider } from "../contexts/DemoStateContext";
import { ProductionDataProvider } from "../contexts/ProductionDataContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AdHub - Ad Account Management Platform",
  description: "Manage your advertising accounts across multiple platforms",
  generator: 'v0.dev'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <DemoProvider>
          <ProductionDataProvider>
            <SimpleProviders>
              {children}
              <EnvIndicator />
            </SimpleProviders>
            <Toaster />
          </ProductionDataProvider>
        </DemoProvider>
      </body>
    </html>
  );
} 