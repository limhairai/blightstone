"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { AdHubLogo } from "@/components/core/AdHubLogo"
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress"

interface OnboardingLayoutProps {
  children: ReactNode
  currentStep: number
  totalSteps: number
}

export function OnboardingLayout({ children, currentStep, totalSteps }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-background backdrop-blur">
        <div className="container flex h-16 items-center">
          <Link href="/">
            <AdHubLogo size="lg" />
          </Link>
          <div className="ml-auto text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 md:p-8">
        <div className="w-full max-w-[95%] sm:max-w-md md:max-w-2xl mx-auto">
          <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />

          <div className="mt-8 bg-card rounded-xl border border-border shadow-lg">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
