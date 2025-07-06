√√∞ 8b
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check, X, ChevronRight, Building2, CreditCard, Target, Mail, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { toast } from 'sonner'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  isCompleted: boolean
  isOptional?: boolean
  action?: () => void
}

interface ModernOnboardingChecklistProps {
  isVisible: boolean
  onClose: () => void
  onComplete: () => void
}

export function ModernOnboardingChecklist({ 
  isVisible, 
  onClose, 
  onComplete 
}: ModernOnboardingChecklistProps) {
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()

  // Initialize steps based on user's current state
  useEffect(() => {
    const initializeSteps = async () => {
      // Fetch user's current progress
      const response = await fetch('/api/onboarding-progress')
      const data = await response.json()
      
      const initialSteps: OnboardingStep[] = [
        {
          id: 'account-created',
          title: 'Account Created',
          description: 'Welcome to AdHub!',
          icon: <Check className="h-4 w-4" />,
          isCompleted: true, // Always completed if they're here
        },
        {
          id: 'email-verified',
          title: 'Verify Email',
          description: 'Check your inbox and click the verification link',
          icon: <Mail className="h-4 w-4" />,
          isCompleted: data?.progress?.hasVerifiedEmail || false,
        },
        {
          id: 'business-created',
          title: 'Create Business Profile',
          description: 'Set up your first business for ad accounts',
          icon: <Building2 className="h-4 w-4" />,
          isCompleted: data?.progress?.hasCreatedBusiness || false,
          action: () => router.push('/dashboard/businesses?action=create')
        },
        {
          id: 'wallet-funded',
          title: 'Add Funds',
          description: 'Top up your wallet to start running ads',
          icon: <CreditCard className="h-4 w-4" />,
          isCompleted: data?.progress?.hasFundedWallet || false,
          action: () => router.push('/dashboard/wallet')
        },
        {
          id: 'ad-account-connected',
          title: 'Connect Ad Account',
          description: 'Link your Facebook ad account',
          icon: <Target className="h-4 w-4" />,
          isCompleted: data?.progress?.hasCreatedAdAccount || false,
          action: () => router.push('/dashboard/accounts?action=create')
        }
      ]

      setSteps(initialSteps)
      setCompletedCount(initialSteps.filter(step => step.isCompleted).length)
    }

    if (isVisible) {
      initializeSteps()
    }
  }, [isVisible, router])

  const handleStepAction = async (stepId: string) => {
    const step = steps.find(s => s.id === stepId)
    if (!step?.action) return

    setIsLoading(true)
    try {
      await step.action()
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    try {
      await fetch('/api/onboarding-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' })
      })
      onComplete()
      toast.success('Welcome to AdHub! 🎉', {
        description: 'You\'re all set to start managing your Facebook ads.'
      })
    } catch (error) {
      toast.error('Failed to complete onboarding')
    }
  }

  const handleDismiss = async () => {
    try {
      await fetch('/api/onboarding-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss' })
      })
      onClose()
    } catch (error) {
      toast.error('Failed to dismiss onboarding')
    }
  }

  const progressPercentage = steps.length > 0 ? (completedCount / steps.length) * 100 : 0
  const nextStep = steps.find(step => !step.isCompleted)
  const isComplete = completedCount === steps.length

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-80 border-border bg-card shadow-lg">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Get Started</h3>
                <p className="text-xs text-muted-foreground">
                  {completedCount}/{steps.length} completed
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0" 
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                  step.isCompleted 
                    ? 'bg-green-50 border border-green-200' 
                    : 'hover:bg-muted/50'
                }`}
              >
                {/* Icon */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step.isCompleted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-muted border-2 border-muted-foreground/30'
                }`}>
                  {step.isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${
                        step.isCompleted ? 'text-green-700' : 'text-foreground'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    
                    {/* Action Button */}
                    {!step.isCompleted && step.action && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handleStepAction(step.id)}
                        disabled={isLoading}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t">
            {isComplete ? (
              <Button 
                onClick={handleComplete}
                className="w-full h-8 text-xs bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                Complete Setup 🎉
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {nextStep ? (
                    <>Next: {nextStep.title}</>
                  ) : (
                    'Almost there! Complete the remaining steps.'
                  )}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 