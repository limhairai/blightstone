interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <span className="text-xs sm:text-sm font-medium">Getting Started</span>
        <span className="text-xs sm:text-sm text-[#71717a]">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      <div className="w-full bg-[#222222] rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0]"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  )
}
