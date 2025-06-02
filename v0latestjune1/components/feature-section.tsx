import type React from "react"

interface FeatureSectionProps {
  title: string
  description: string
  illustration?: React.ReactNode
  reversed?: boolean
}

export function FeatureSection({ title, description, illustration, reversed = false }: FeatureSectionProps) {
  return (
    <div className="py-16 border-b border-border">
      <div className="container mx-auto px-4">
        <div
          className={`flex flex-col ${reversed ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-8 md:gap-16`}
        >
          {illustration && <div className="w-full md:w-1/2">{illustration}</div>}

          <div className={`w-full ${illustration ? "md:w-1/2" : ""} space-y-6`}>
            <h2 className="text-3xl font-bold">
              <span className="fey-gradient">{title}</span>
            </h2>
            <p className="text-white/60 text-lg">{description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
