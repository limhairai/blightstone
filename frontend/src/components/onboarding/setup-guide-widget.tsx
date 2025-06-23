"use client"

import { useState } from "react"
import { Check, X, ChevronDown, ChevronRight, Maximize2, Minimize2, Plus, CreditCard, Building2, Target } from 'lucide-react'
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { useAdvancedOnboarding } from "../../hooks/useAdvancedOnboarding"
import { useAppData } from "../../contexts/AppDataContext"
import { toast } from "../ui/use-toast"

type WidgetState = "expanded" | "collapsed" | "closed"

interface SetupGuideWidgetProps {
  widgetState: WidgetState
  onStateChange: (state: WidgetState) => void
}

export function SetupGuideWidget({ widgetState, onStateChange }: SetupGuideWidgetProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()
  const { createBusiness } = useAppData()
  
  // Use the advanced onboarding hook
  const {
    setupProgress,
    completion,
    nextStep,
    shouldShowOnboarding,
    loading,
    dismissOnboarding,
    markStepCompleted
  } = useAdvancedOnboarding()

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    )
  }

  const handleStepAction = async (stepId: string) => {
    setActionLoading(stepId)
    
    try {
      switch (stepId) {
        case 'wallet-funding':
          router.push('/dashboard/wallet')
          break
          
        case 'business-setup':
          // Create a quick business application
          await createBusiness({
            name: 'My Business',
            status: 'pending',
            balance: 0,
            website: '',
            description: 'Quick setup from widget'
          })
          
          // Mark step as completed
          await markStepCompleted(stepId)
          
          toast({
            title: "Business Application Submitted",
            description: "Your business application has been submitted for review.",
          })
          break
          
        case 'ad-account-setup':
          router.push('/dashboard/accounts')
          break
          
        default:
          break
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDismiss = async () => {
    try {
      await dismissOnboarding()
      onStateChange("closed")
      toast({
        title: "Setup Guide Dismissed",
        description: "You can always access the setup guide from your dashboard.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss setup guide. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Don't show if onboarding shouldn't be shown or if loading
  if (!shouldShowOnboarding || loading) {
    return null
  }

  if (widgetState === "closed") {
    return null // The button will be shown in the topbar
  }

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
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleDismiss}>
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

  // Expanded state
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-96 border-border bg-card shadow-lg max-h-[500px] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Setup Guide</h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onStateChange("collapsed")}>
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progress</span>
              <span className="text-muted-foreground">{completion.completedSteps}/{completion.totalSteps}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] h-2 rounded-full transition-all duration-500" 
                style={{ width: `${completion.percentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {completion.percentage}% complete
            </div>
          </div>

          <div className="space-y-2">
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
                    
                    {/* Action button for incomplete steps */}
                    {!step.completed && step.id !== 'email-verification' && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleStepAction(step.id)}
                          disabled={actionLoading === step.id}
                        >
                          {actionLoading === step.id ? (
                            "Loading..."
                          ) : (
                            <>
                              {getStepIcon(step.id)}
                              {getStepActionText(step.id)}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
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

function getStepIcon(stepId: string) {
  const icons = {
    'wallet-funding': <CreditCard className="h-3 w-3 mr-1" />,
    'business-setup': <Building2 className="h-3 w-3 mr-1" />,
    'ad-account-setup': <Target className="h-3 w-3 mr-1" />
  }
  
  return icons[stepId as keyof typeof icons] || <Plus className="h-3 w-3 mr-1" />
}

function getStepActionText(stepId: string): string {
  const actions = {
    'wallet-funding': 'Add Funds',
    'business-setup': 'Create Business',
    'ad-account-setup': 'Apply for Account'
  }
  
  return actions[stepId as keyof typeof actions] || 'Complete'
} 