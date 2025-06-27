"use client"

import { useState } from "react"
import { Check, X, ChevronDown, ChevronRight, Maximize2, Minimize2, Plus, CreditCard, Building2, Target } from 'lucide-react'
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { useAdvancedOnboarding } from "../../hooks/useAdvancedOnboarding"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { toast } from "sonner"
import { useSWRConfig } from "swr"

type WidgetState = "expanded" | "collapsed" | "closed"

interface SetupGuideWidgetProps {
  widgetState: WidgetState
  onStateChange: (state: WidgetState) => void
}

export function SetupGuideWidget({ widgetState, onStateChange }: SetupGuideWidgetProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()
  const { currentOrganizationId } = useOrganizationStore()
  const { mutate } = useSWRConfig()
  
  const {
    progressData,
    isLoading,
    isError,
    mutate: mutateOnboarding,
    dismissOnboarding,
  } = useAdvancedOnboarding()

  const { completionPercentage, steps, isComplete } = progressData || { completionPercentage: 0, steps: [], isComplete: false };


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
          if (!currentOrganizationId) {
              toast.error("Organization not found. Please refresh.")
              return;
          }
          const res = await fetch('/api/businesses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'My First Business',
              organization_id: currentOrganizationId
            }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to create business");
          }
          
          toast.success("Business Application Submitted", {
            description: "Your business application has been submitted for review.",
          })
          
          // Revalidate onboarding progress to reflect the new business
          mutateOnboarding();
          // Also revalidate businesses list if it's displayed elsewhere
          mutate(`/api/businesses?organization_id=${currentOrganizationId}`);
          break
          
        case 'ad-account-setup':
          router.push('/dashboard/accounts?action=create')
          break
          
        default:
          break
      }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast.error("Error", { description: errorMessage });
    } finally {
      setActionLoading(null)
    }
  }

  const handleDismiss = async () => {
    try {
      await dismissOnboarding()
      onStateChange("closed")
      toast.success("Setup Guide Dismissed", {
        description: "You can always access this from your user menu.",
      })
    } catch (error) {
      toast.error("Error", {
        description: "Failed to dismiss setup guide. Please try again.",
      })
    }
  }

  if (isLoading || isComplete) {
    return null
  }

  if (widgetState === "closed") {
    return null 
  }

  const nextStep = steps.find(s => !s.isCompleted);

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
                className="bg-gradient-to-r from-violet-400 to-pink-400 h-1 rounded-full transition-all duration-300" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {nextStep ? (
                <>
                  <span className="font-medium text-primary">Next:</span> {nextStep.title}
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
              <span className="text-muted-foreground">{steps.filter(s => s.isCompleted).length}/{steps.length}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-violet-400 to-pink-400 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {completionPercentage}% complete
            </div>
          </div>

          <div className="space-y-2">
            {steps.map((step) => (
              <div key={step.id}>
                <div
                  className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleSection(step.id)}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      step.isCompleted 
                        ? 'bg-green-500' 
                        : 'border-2 border-muted-foreground/50'
                    }`}>
                      {step.isCompleted && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className={`text-sm font-medium ${!step.isCompleted && 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                  {expandedSections.includes(step.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                  )}
                </div>

                {expandedSections.includes(step.id) && (
                  <div className="ml-5 pl-4 border-l-2 border-muted-foreground/20 pb-2">
                    <p className="text-sm text-muted-foreground mt-1 mb-3">{step.description}</p>
                    
                    {!step.isCompleted && step.id !== 'email-verification' && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8 px-3 text-xs"
                        onClick={() => handleStepAction(step.id)}
                        disabled={actionLoading === step.id}
                      >
                        {actionLoading === step.id ? "Loading..." : getStepActionText(step.id)}
                      </Button>
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

function getStepActionText(stepId: string): string {
  switch (stepId) {
    case 'business-setup': return 'Create Business';
    case 'wallet-funding': return 'Fund Wallet';
    case 'ad-account-setup': return 'Create Ad Account';
    default: return 'Complete Step';
  }
} 