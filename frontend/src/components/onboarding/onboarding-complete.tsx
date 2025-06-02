"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

interface OnboardingCompleteProps {
  organizationName: string
  redirectTo: string
}

export function OnboardingComplete({ organizationName, redirectTo }: OnboardingCompleteProps) {
  const router = useRouter()

  return (
    <div className="p-4 sm:p-6 md:p-8 text-center">
      <div className="flex justify-center mb-4 sm:mb-6">
        <div className="rounded-full bg-green-500/20 p-2 sm:p-3">
          <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 text-green-500" />
        </div>
      </div>

      <div className="space-y-2 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold">Setup Complete!</h1>
        <p className="text-xs sm:text-sm text-[#71717a]">
          Welcome to AdHub{organizationName ? `, ${organizationName}` : ""}! Your account is now ready to use.
        </p>
      </div>

      <div className="space-y-4 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#222222] p-4 sm:p-6 rounded-xl">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">What's next?</h3>
          <ul className="space-y-3 text-left">
            <li className="flex items-start gap-2">
              <div className="rounded-full bg-[#b4a0ff]/20 p-1 mt-0.5">
                <span className="text-xs font-bold text-[#b4a0ff]">1</span>
              </div>
              <span>Explore your dashboard and get familiar with the platform</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="rounded-full bg-[#b4a0ff]/20 p-1 mt-0.5">
                <span className="text-xs font-bold text-[#b4a0ff]">2</span>
              </div>
              <span>Top up your account balance to start using ad accounts</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="rounded-full bg-[#b4a0ff]/20 p-1 mt-0.5">
                <span className="text-xs font-bold text-[#b4a0ff]">3</span>
              </div>
              <span>Apply for your first ad account and start advertising</span>
            </li>
          </ul>
        </div>
      </div>

      <Button
        onClick={() => router.push(redirectTo)}
        className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
      >
        Go to Dashboard
      </Button>
    </div>
  )
}
