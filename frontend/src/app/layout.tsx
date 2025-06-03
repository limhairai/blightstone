// frontend/src/app/layout.tsx (VERY SIMPLE TEST VERSION)
import type React from "react";
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "@/styles/globals.css"; // Correct path
// import { DevNavigation } from "@/components/dev-navigation"; // Removed import
import { Providers } from "@/components/providers"; // Changed import path and name

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AdHub - Ad Account Management Platform",
  description: "Manage your ad accounts, track spending, and optimize campaigns",
  generator: 'v0.dev' // from V0, optional
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers> {/* Use the comprehensive Providers component */}
          {children}
          {/* <DevNavigation /> */}{/* Removed component instance */}
        </Providers>
      </body>
    </html>
  );
} 