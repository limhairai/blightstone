"use client"

import { useState } from "react"
import { Check, X, ChevronDown, ChevronRight, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SetupProgress, calculateSetupCompletion, getNextStep } from "@/lib/state-utils"

type WidgetState = "expanded" | "collapsed" | "closed"

interface SetupGuideWidgetProps {
  widgetState: WidgetState
  onStateChange: (state: WidgetState) => void
  setupProgress?: SetupProgress
}

export function SetupGuideWidget({ widgetState, onStateChange, setupProgress }: SetupGuideWidgetProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    )
  }

  if (widgetState === "closed") {
    return null // The button will be shown in the topbar
  }

  // Calculate progress
  const completion = setupProgress ? calculateSetupCompletion(setupProgress) : { percentage: 25, completedSteps: 1, totalSteps: 4 }
  const nextStep = setupProgress ? getNextStep(setupProgress) : null

  if (widgetState === "collapsed") {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Card className="w-80 border-border bg-card shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-base">Setup guide</h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onStateChange("expanded")}>
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onStateChange("closed")}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-1 mb-2">
              <div 
                className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] h-1 rounded-full transition-all duration-300" 
                style={{ width: `${completion.percentage}%` }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {nextStep ? (
                <>
                  <span className="text-[#b4a0ff]">Next:</span> {nextStep.name}
                </>
              ) : (
                <span className="text-green-500">Setup complete! 🎉</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-80 border-border bg-card shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base">Setup guide</h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onStateChange("collapsed")}>
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onStateChange("closed")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {setupProgress && Object.entries(setupProgress).map(([key, step]) => (
              <div key={step.id}>
                <div
                  className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleSection(step.id)}
                >
                  {expandedSections.includes(step.id) ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className={`text-sm ${step.completed ? 'font-medium' : 'text-muted-foreground'}`}>
                    {step.name}
                  </span>
                  {step.completed && (
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center ml-auto">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>

                {expandedSections.includes(step.id) && (
                  <div className="ml-6 space-y-2 mt-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        step.completed 
                          ? 'bg-green-500' 
                          : 'border border-muted-foreground/50'
                      }`}>
                        {step.completed && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <span className={`text-sm ${step.completed ? '' : 'text-muted-foreground'}`}>
                        {getStepDescription(step.id, step.completed)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getStepDescription(stepId: string, completed: boolean): string {
  const descriptions = {
    'email-verification': completed ? 'Email verified' : 'Verify your email address',
    'wallet-funding': completed ? 'Wallet funded' : 'Add funds to wallet',
    'business-setup': completed ? 'Business created' : 'Submit business application',
    'ad-account-setup': completed ? 'Ad account created' : 'Apply for ad account'
  }
  
  return descriptions[stepId as keyof typeof descriptions] || 'Complete this step'
} 