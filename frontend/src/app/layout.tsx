// frontend/src/app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/react"
import { Providers } from "@/components/core/providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AdHub - Ad Account Management Platform",
  description: "Manage your ad accounts, track spending, and optimize campaigns",
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
} 