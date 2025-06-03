import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
// No need to import globals.css here as it's handled by the root layout (src/app/layout.tsx)

// Remove Providers import if AppProviders from root layout is sufficient
// import { Providers } from "@/components/core/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Onboarding - AdHub",
  description: "Get started with AdHub by setting up your organization.",
}

export default function OnboardingRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Root AppProviders should cover necessary global contexts.
  // This layout can be simpler if it doesn't introduce new, overarching providers for this section.
  return (
    <div className={inter.className}>
      {children}
    </div>
  )
  // If a specific Providers wrapper was intended for onboarding:
  // return (
  //   <Providers>
  //     <div className={inter.className}>
  //       {children}
  //     </div>
  //   </Providers>
  // )
} 