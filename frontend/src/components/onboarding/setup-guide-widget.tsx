"use client"

import { useState, useEffect, useRef } from "react"
import { Check, X, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react'
import { useRouter, usePathname } from "next/navigation"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { useAdvancedOnboarding } from "../../hooks/useAdvancedOnboarding"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { toast } from "sonner"
import { useSWRConfig } from "swr"
import { useAuth } from '@/contexts/AuthContext'
import { PlanUpgradeDialog } from '../pricing/plan-upgrade-dialog'
import useSWR from 'swr'

type WidgetState = "expanded" | "collapsed" | "closed"

interface SetupGuideWidgetProps {
  widgetState: WidgetState
  onStateChange: (state: WidgetState) => void
}

// Add interface for onboarding progress data
interface OnboardingProgressData {
  progress: {
    hasSetupOrganization: boolean
    hasSelectedPlan: boolean
    hasFundedWallet: boolean
    hasAppliedForBM: boolean
    hasActiveBM: boolean
    hasAddedPixel: boolean
    hasSubmittedTopup: boolean
  }
  persistence: {
    hasExplicitlyDismissed: boolean
    accountCreatedAt: string
  }
}

export function SetupGuideWidget({ widgetState, onStateChange }: SetupGuideWidgetProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [isInitialRender, setIsInitialRender] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const expandableContentRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { currentOrganizationId } = useOrganizationStore()
  const { mutate } = useSWRConfig()
  const { session } = useAuth()
  
  // FIXED: Use only the consolidated onboarding hook
  const {
    progressData,
    isLoading,
    isError,
    mutate: mutateOnboarding,
    dismissOnboarding,
    rawData: onboardingProgress
  } = useAdvancedOnboarding()

  // REMOVED: Duplicate SWR call - now using only useAdvancedOnboarding

  // Handle initial render animation
  useEffect(() => {
    if (widgetState !== "closed") {
      setIsInitialRender(false)
    }
    // Only refresh when widget is expanded AND we don't have data
    if (widgetState === "expanded" && !onboardingProgress) {
      mutateOnboarding()
    }
  }, [widgetState, mutateOnboarding, onboardingProgress])

  // Detect successful payment and refresh progress
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentSuccess = urlParams.get('success')
    
    if (paymentSuccess === 'true') {
      // Payment was successful, refresh onboarding progress with delay to ensure DB is updated
      setTimeout(() => {
        mutateOnboarding()
      }, 1000) // 1 second delay to ensure payment processing is complete
      
      // Clean up URL parameter
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('success')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [mutateOnboarding])

  // REMOVED: Automatic route-based refresh that was causing excessive API calls

  // Handle smooth expansion animation
  useEffect(() => {
    if (!expandableContentRef.current) return

    const element = expandableContentRef.current
    const isExpanded = widgetState === "expanded"
    
    if (isExpanded) {
      // Expanding: measure content height and animate to it
      setIsAnimating(true)
      element.style.height = 'auto'
      const targetHeight = element.scrollHeight
      element.style.height = '0px'
      
      // Force reflow
      element.offsetHeight
      
      // Animate to target height
      element.style.height = `${targetHeight}px`
      
      // Clean up after animation
      setTimeout(() => {
        element.style.height = 'auto'
        setIsAnimating(false)
      }, 400)
    } else {
      // Collapsing: animate from current height to 0
      setIsAnimating(true)
      const currentHeight = element.scrollHeight
      element.style.height = `${currentHeight}px`
      
      // Force reflow
      element.offsetHeight
      
      // Animate to 0
      element.style.height = '0px'
      
      setTimeout(() => {
        setIsAnimating(false)
      }, 400)
    }
  }, [widgetState])

  const { completionPercentage, hasCompletedOnboarding, nextStep } = progressData || { 
    completionPercentage: 0, 
    hasCompletedOnboarding: false, 
    nextStep: null 
  }

  // Create steps array based on practical setup requirements using real data
  const allSteps = [
    {
      id: 'choose-plan',
      title: 'Choose a Plan',
      description: 'Select a subscription plan that fits your advertising needs',
      isCompleted: onboardingProgress?.progress?.hasSelectedPlan || false,
      isRequired: true,
      isVisible: true,
    },
    {
      id: 'wallet-funding',
      title: 'Fund Wallet',
      description: 'Add funds to your wallet to start using ad accounts',
      isCompleted: onboardingProgress?.progress?.hasFundedWallet || false,
      isRequired: true,
      isVisible: true,
    },
    {
      id: 'business-setup',
      title: 'Apply for Business Manager',
      description: 'Submit your first business manager application',
      isCompleted: onboardingProgress?.progress?.hasAppliedForBM || false,
      isRequired: true,
      isVisible: true,
    },
    {
      id: 'pixel-setup',
      title: 'Add Pixel to BM',
      description: 'Connect a Facebook pixel to your business manager',
      isCompleted: onboardingProgress?.progress?.hasAddedPixel || false,
      isRequired: true,
      // Always show this step so clients know what to expect
      isVisible: true,
    },
    {
      id: 'ad-account-topup',
      title: 'Top up Ad Account',
      description: 'Fund your ad accounts to start running campaigns',
      isCompleted: onboardingProgress?.progress?.hasSubmittedTopup || false,
      isRequired: true,
      isVisible: true,
    },
  ]

  // Filter to only show visible steps
  const steps = allSteps.filter(step => step.isVisible)

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    )
  }

  const handleStepAction = async (stepId: string) => {
    setActionLoading(stepId)
    
    try {
      switch (stepId) {
        case 'choose-plan':
          setUpgradeDialogOpen(true)
          break
          
        case 'wallet-funding':
          router.push('/dashboard/wallet')
          break
          
        case 'business-setup':
          router.push('/dashboard/business-managers')
          break
          
        case 'pixel-setup':
          router.push('/dashboard/pixels')
          break
          
        case 'ad-account-topup':
          router.push('/dashboard/accounts')
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

  // Add effect to refresh onboarding progress when upgrade dialog closes
  useEffect(() => {
    if (!upgradeDialogOpen) {
      // Refresh onboarding progress data when dialog closes
      mutateOnboarding()
    }
  }, [upgradeDialogOpen, mutateOnboarding])

  const handleDismiss = async () => {
    try {
      // Store dismiss in localStorage for immediate future loads
      if (session?.user) {
        localStorage.setItem(`adhub_setup_dismissed_${session.user.id}`, 'true')
      }
      
      // Change state to closed first for immediate UI feedback
      onStateChange("closed")
      
      // Then dismiss the onboarding in the background
      await dismissOnboarding()
      
      toast.success("Setup Guide Dismissed", {
        description: "You can access this from the Setup Guide button in the topbar.",
      })
    } catch (error) {
      // If dismissing fails, we can still keep it closed since user requested it
      console.error("Failed to dismiss onboarding:", error)
      toast.success("Setup Guide Closed", {
        description: "You can access this from the Setup Guide button in the topbar.",
      })
    }
  }

  // Calculate actual progress based on our simplified steps
  const completedSteps = steps.filter(s => s.isCompleted).length
  const totalSteps = steps.length
  const actualProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  // Don't show widget if loading or if all steps are completed
  if (isLoading || actualProgress >= 100) {
    return null
  }

  if (widgetState === "closed") {
    return null 
  }

  const nextStepData = steps.find(s => !s.isCompleted);
  const isExpanded = widgetState === "expanded"

  // Single unified widget that expands/collapses like Stripe
  return (
    <div className="fixed bottom-6 right-6 z-50" key={`setup-widget-${widgetState}`}>
      <Card className={`
        w-80 border-border bg-card shadow-lg hover:shadow-xl 
        transition-all duration-500 ease-out
        ${isInitialRender ? 'animate-in fade-in slide-in-from-bottom-5 duration-300' : ''}
        ${isAnimating ? 'transition-all duration-400 ease-out' : ''}
      `}>
        <CardContent className="p-0">
          {/* Header - Always visible */}
          <div className="p-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-base">Setup guide</h3>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 transition-all duration-200 hover:scale-110" 
                  onClick={() => onStateChange(isExpanded ? "collapsed" : "expanded")}
                >
                  <ChevronUp className={`h-3 w-3 transition-transform duration-300 ease-out ${isExpanded ? 'rotate-180' : 'rotate-0'}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 transition-all duration-200 hover:scale-110 hover:text-red-500" 
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Progress bar - Always visible */}
            <div className="w-full bg-muted rounded-full h-1 mb-2">
              <div 
                className="h-1 rounded-full transition-all duration-300"
                style={{ 
                  width: `${actualProgress}%`,
                  background: 'linear-gradient(90deg, #b4a0ff 0%, #ffb4a0 100%)'
                }}
              />
            </div>
            
            {/* Next step info - Always visible */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {nextStepData ? (
                  <>
                    <span className="font-medium text-primary">Next:</span> {nextStepData.title}
                  </>
                ) : (
                  <span className="text-green-500">Setup complete! 🎉</span>
                )}
              </div>
              
              {/* Debug refresh button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                onClick={() => {
                  mutateOnboarding()
                  toast.success("Progress refreshed")
                }}
                title="Refresh progress"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Expandable content - Smooth natural animation */}
          <div 
            className={`
              transition-all duration-400 ease-out
              overflow-hidden
            `} 
            ref={expandableContentRef}
            style={{ 
              height: widgetState === "expanded" ? 'auto' : '0px',
              opacity: widgetState === "expanded" ? 1 : 0
            }}
          >
            <div className="px-4 pb-4">
              {/* Steps list */}
              <div className="space-y-2">
                {steps.map((step) => (
                  <div key={step.id}>
                    <div
                      className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors duration-150"
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
                        
                        {!step.isCompleted && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8 px-3 text-xs bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black font-medium border-0"
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
            </div>
          </div>
        </CardContent>
      </Card>
      
      <PlanUpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        redirectToPage={false}
      />
    </div>
  )
}

function getStepActionText(stepId: string): string {
  switch (stepId) {
    case 'choose-plan': return 'Choose Plan';
    case 'business-setup': return 'View Business Managers';
    case 'wallet-funding': return 'Fund Wallet';
    case 'pixel-setup': return 'Add Pixel';
    case 'ad-account-topup': return 'Top up Account';
    case 'ad-account-setup': return 'Create Ad Account';
    default: return 'Complete Step';
  }
} 