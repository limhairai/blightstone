'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useSubscription } from "@/hooks/useSubscription"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { toast } from "sonner"

interface PlanUpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Plan {
  id: string
  name: string
  description: string
  monthly_subscription_fee_cents: number
  ad_spend_fee_percentage: number
  max_team_members: number
  max_businesses: number
  max_ad_accounts: number
  features: string[]
  stripe_price_id: string | null
}

export function PlanUpgradeDialog({ open, onOpenChange }: PlanUpgradeDialogProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const { currentPlan } = useSubscription()
  const { currentOrganizationId } = useOrganizationStore()

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/subscriptions/plans')
        if (!response.ok) throw new Error('Failed to fetch plans')
        
        const data = await response.json()
        // Filter out the free plan from upgrade options
        const paidPlans = data.plans.filter((plan: Plan) => plan.id !== 'free')
        setPlans(paidPlans)
      } catch (error) {
        console.error('Error fetching plans:', error)
        toast.error('Failed to load plans')
      } finally {
        setIsLoading(false)
      }
    }

    if (open) {
      fetchPlans()
    }
  }, [open])

  const handleSelectPlan = async (planId: string) => {
    if (isUpgrading || !currentOrganizationId) return
    
    setIsUpgrading(true)
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          organizationId: currentOrganizationId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const data = await response.json()
      
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
      
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast.error('Failed to start checkout process')
    } finally {
      setIsUpgrading(false)
    }
  }

  const isCurrentPlan = (planId: string) => {
    return currentPlan?.id === planId
  }

  const canUpgradeTo = (planId: string) => {
    if (!currentPlan || currentPlan.id === 'free') return true
    
    const planOrder = ['starter', 'growth', 'scale', 'enterprise']
    const currentIndex = planOrder.indexOf(currentPlan.id)
    const targetIndex = planOrder.indexOf(planId)
    
    return targetIndex > currentIndex
  }

  const formatFeatures = (plan: Plan): string[] => {
    const features = []
    
    if (plan.max_businesses === -1) {
      features.push('Unlimited Business Managers')
    } else {
      features.push(`${plan.max_businesses} Business Manager${plan.max_businesses > 1 ? 's' : ''}`)
    }
    
    if (plan.max_ad_accounts === -1) {
      features.push('Unlimited Ad Accounts')
    } else {
      features.push(`${plan.max_ad_accounts} Ad Accounts`)
    }
    
    if (plan.max_team_members === -1) {
      features.push('Unlimited Team Members')
    } else {
      features.push(`${plan.max_team_members} Team Members`)
    }
    
    // Add parsed features from database
    if (plan.features && Array.isArray(plan.features)) {
      features.push(...plan.features)
    }
    
    return features
  }

  const formatPrice = (cents: number): string => {
    if (typeof cents !== 'number' || isNaN(cents)) {
      return '0'
    }
    return Math.round(cents / 100).toString()
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Upgrade Plan</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading plans...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade Plan</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose a plan that fits your needs. You'll be redirected to Stripe for secure payment.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan.id)
            const canUpgrade = canUpgradeTo(plan.id)
            const isPopular = plan.id === 'growth' // Mark growth as popular
            const features = formatFeatures(plan)
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border p-6 ${
                  isCurrent 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                } ${isPopular ? 'ring-2 ring-primary' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">
                      ${formatPrice(plan.monthly_subscription_fee_cents)}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    + {plan.ad_spend_fee_percentage}% ad spend fee
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || !canUpgrade || isUpgrading || !plan.stripe_price_id}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {isCurrent 
                    ? "Current Plan" 
                    : !canUpgrade 
                      ? "Downgrade" 
                      : isUpgrading 
                        ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</>
                        : !plan.stripe_price_id
                          ? "Not Available"
                          : "Select Plan"
                  }
                </Button>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 