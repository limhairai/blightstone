"use client"

import { Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PricingPlanProps {
  title: string
  price: string
  features: string[]
  buttonText: string
  onButtonClick?: () => void
  isActive?: boolean
  trialEndDate?: string
}

export function PricingPlan({
  title,
  price,
  features,
  buttonText,
  onButtonClick,
  isActive,
  trialEndDate,
}: PricingPlanProps) {
  return (
    <Card className="overflow-hidden border-border">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-6">
        {/* Price Section */}
        <div className="py-4">
          <div className="text-5xl font-bold text-white mb-1">{price}</div>
          <div className="text-muted-foreground">per month</div>
        </div>

        {/* Features */}
        <div className="space-y-3 text-left">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-black" />
              </div>
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {/* Trial Warning */}
        {trialEndDate && (
          <div className="bg-orange-400/10 border border-orange-400/20 rounded-lg p-3">
            <div className="flex items-center gap-2 justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 text-sm">Trial ends {trialEndDate}</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={onButtonClick}
          className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90 font-medium"
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  )
}
