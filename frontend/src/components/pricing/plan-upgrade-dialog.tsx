'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/hooks/useSubscription"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { toast } from "sonner"
import { PRICING_CONFIG } from "@/lib/config/pricing-config"

interface PlanUpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectToPage?: boolean
}

interface Plan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  adSpendFee: number
  maxTeamMembers: number
  maxBusinesses: number
  maxAdAccounts: number
  monthlyTopupLimit?: number | null
  features: string[]
  stripe_price_id?: string | null
  isCustom?: boolean
  isComingSoon?: boolean
}

export function PlanUpgradeDialog({ open, onOpenChange, redirectToPage = false }: PlanUpgradeDialogProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const { currentPlan } = useSubscription()
  const { currentOrganizationId } = useOrganizationStore()
  const router = useRouter()

  useEffect(() => {
    if (open && redirectToPage) {
      onOpenChange(false)
      router.push('/pricing')
    }
  }, [open, redirectToPage, onOpenChange, router])

  if (redirectToPage) {
    return null
  }

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/subscriptions/plans')
        if (!response.ok) throw new Error('Failed to fetch plans')
        
        const data = await response.json()
        setPlans(data.plans)
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

  const canUpgradeTo = (planId: string) => {
    if (!currentPlan || currentPlan.id === 'free') return true
    
    const planOrder = ['starter', 'growth', 'scale', 'plus']
    const currentIndex = planOrder.indexOf(currentPlan.id)
    const targetIndex = planOrder.indexOf(planId)
    
    return targetIndex > currentIndex
  }

  const isDowngrade = (planId: string) => {
    if (!currentPlan || currentPlan.id === 'free') return false
    
    const planOrder = ['starter', 'growth', 'scale', 'plus']
    const currentIndex = planOrder.indexOf(currentPlan.id)
    const targetIndex = planOrder.indexOf(planId)
    
    return targetIndex < currentIndex
  }

  const getButtonText = (plan: Plan) => {
    const isCurrent = isCurrentPlan(plan.id)
    const isDowngradeAction = isDowngrade(plan.id)
    
    if (isCurrent) return "Current plan"
    if (isUpgrading) return <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</>
    if (plan.isComingSoon) return "Coming Soon"
    if (plan.isCustom) return "Contact Us"
    
    if (isDowngradeAction) {
      return `Downgrade to ${plan.name}`
    } else {
      return `Get Started`
    }
  }

  const handleSelectPlan = async (planId: string) => {
    if (isUpgrading || !currentOrganizationId) return
    
    const selectedPlan = plans.find(p => p.id === planId)
    if (selectedPlan?.isCustom) {
      toast.info('Please contact our sales team for custom pricing')
      return
    }

    const isDowngradeAction = isDowngrade(planId)
    
    if (isDowngradeAction) {
      const confirmed = confirm(
        `Are you sure you want to downgrade to ${selectedPlan?.name}?\n\n` +
        `Your current ${currentPlan?.name} plan will remain active until the end of your billing cycle. ` +
        `The downgrade will take effect on your next billing date, and you won't be charged until then.`
      )
      
      if (!confirmed) return
    }
    
    setIsUpgrading(true)
    try {
      const endpoint = isDowngradeAction ? '/api/subscriptions/schedule-downgrade' : '/api/subscriptions/checkout'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          organizationId: currentOrganizationId,
          isDowngrade: isDowngradeAction
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${isDowngradeAction ? 'schedule downgrade' : 'create checkout session'}`)
      }

      const data = await response.json()
      
      if (isDowngradeAction) {
        toast.success(
          `Downgrade scheduled! Your plan will change to ${selectedPlan?.name} at the end of your current billing cycle.`
        )
        onOpenChange(false)
      } else {
        if (data.url) {
          window.location.href = data.url
        } else {
          throw new Error('No checkout URL returned')
        }
      }
      
    } catch (error) {
      console.error('Error processing plan change:', error)
      toast.error(`Failed to ${isDowngradeAction ? 'schedule downgrade' : 'start checkout process'}`)
    } finally {
      setIsUpgrading(false)
    }
  }

  const isCurrentPlan = (planId: string) => {
    return currentPlan?.id === planId
  }

  const formatFeatures = (plan: Plan): string[] => {
    if (PRICING_CONFIG.newPricingModel.enabled && plan.features) {
      return plan.features
    }

    const features = []
    
    if (plan.maxBusinesses === -1) {
      features.push('Unlimited Business Managers')
    } else {
      features.push(`${plan.maxBusinesses} Business Manager${plan.maxBusinesses > 1 ? 's' : ''}`)
    }
    
    if (plan.maxAdAccounts === -1) {
      features.push('Unlimited Ad Accounts')
    } else {
      features.push(`${plan.maxAdAccounts} Ad Accounts`)
    }
    
    if (plan.maxTeamMembers === -1) {
      features.push('Unlimited Team Members')
    } else {
      features.push(`${plan.maxTeamMembers} Team Members`)
    }
    
    if (PRICING_CONFIG.enableTopupLimits) {
      const getTopupLimit = (planId: string) => {
        switch (planId) {
          case 'starter':
            return 3000
          case 'growth':
            return 6000
          case 'scale':
          case 'custom':
          case 'enterprise':
            return null
          default:
            return plan.monthlyTopupLimit
        }
      }
      
      const topupLimit = plan.monthlyTopupLimit !== undefined ? plan.monthlyTopupLimit : getTopupLimit(plan.id)
      
      if (topupLimit === null || topupLimit === undefined) {
        features.push('Unlimited Monthly Top-ups')
      } else {
        features.push(`$${topupLimit.toLocaleString()} Monthly Top-up Limit`)
      }
    }
    
    if (plan.features && Array.isArray(plan.features)) {
      features.push(...plan.features)
    }
    
    return features
  }

  const formatPrice = (dollars: number): string => {
    if (typeof dollars !== 'number' || isNaN(dollars)) {
      return '0'
    }
    return dollars.toString()
  }

  const shouldShowAdSpendFee = (plan: Plan): boolean => {
    return PRICING_CONFIG.enableAdSpendFees && plan.adSpendFee > 0
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl">
          <DialogHeader className="text-center pb-6">
            <DialogTitle className="text-2xl font-bold">Choose Your Plan</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Separate Plus plan from other plans
  const regularPlans = plans.filter(plan => plan.id !== 'plus')
  const plusPlan = plans.find(plan => plan.id === 'plus')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl font-bold">Choose Your Plan</DialogTitle>
          <p className="text-muted-foreground mt-2">
            Scale your Facebook advertising with the right plan for your business
          </p>
        </DialogHeader>

        {/* Regular plans in 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {regularPlans.map((plan) => {
            const isCurrent = isCurrentPlan(plan.id)
            const isPopular = plan.id === 'growth'
            
            return (
              <div
                key={plan.id}
                className={`relative bg-card rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                  isPopular 
                    ? 'border-[#b4a0ff]/30 shadow-md ring-1 ring-[#b4a0ff]/10' 
                    : 'border-border hover:border-border/60'
                }`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black px-4 py-1.5 rounded-full text-sm font-medium shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrent && (
                  <div className="absolute -top-3 right-4 z-10">
                    <div className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                      Current
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan name */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-2 capitalize">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-muted-foreground text-sm">{plan.description}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline mb-2">
                      <span className="text-3xl font-bold">${formatPrice(plan.monthlyPrice)}</span>
                      <span className="text-muted-foreground ml-2">/month</span>
                    </div>
                    {shouldShowAdSpendFee(plan) && (
                      <p className="text-sm text-muted-foreground">
                        + {plan.adSpendFee}% ad spend fee
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <ul className="space-y-2.5">
                      {formatFeatures(plan).map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrent || isUpgrading || plan.isComingSoon}
                    className={`w-full h-11 font-medium ${
                      isCurrent
                        ? 'bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0'
                        : isPopular
                        ? 'bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0'
                        : 'bg-background hover:bg-accent text-foreground border border-border'
                    }`}
                    variant={isCurrent ? 'default' : isPopular ? 'default' : 'outline'}
                  >
                    {getButtonText(plan)}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Plus plan - horizontal layout */}
        {plusPlan && (
          <div className="border-t pt-8">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Left side - Title and Features */}
                <div className="flex-1">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground mb-2">PLUS</h3>
                    <p className="text-sm text-muted-foreground">
                      For large-scale applications running Internet scale workloads.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {formatFeatures(plusPlan).map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right side - CTA only */}
                <div className="lg:text-right lg:min-w-[200px]">
                  <Button
                    onClick={() => handleSelectPlan(plusPlan.id)}
                    disabled={isCurrentPlan(plusPlan.id) || isUpgrading || plusPlan.isComingSoon}
                    className={`w-full lg:w-auto lg:min-w-[140px] h-11 font-medium ${
                      isCurrentPlan(plusPlan.id)
                        ? 'bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0'
                        : 'bg-background hover:bg-accent text-foreground border border-border'
                    }`}
                    variant={isCurrentPlan(plusPlan.id) ? 'default' : 'outline'}
                  >
                    {getButtonText(plusPlan)}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include unlimited replacements and 24/7 support.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
} 