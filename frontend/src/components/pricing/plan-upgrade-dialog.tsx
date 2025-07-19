'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Loader2, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/hooks/useSubscription"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { toast } from "sonner"
import { getPlanPricing } from "@/lib/config/pricing-config"

interface PlanUpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectToPage?: boolean
}

export function PlanUpgradeDialog({ open, onOpenChange, redirectToPage = false }: PlanUpgradeDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false)
  const [pendingDowngradePlan, setPendingDowngradePlan] = useState<string | null>(null)
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

  const canUpgradeTo = (planId: string) => {
    if (!currentPlan || currentPlan.id === 'free') return true
    
    const planOrder = ['starter', 'growth', 'scale']
    const currentIndex = planOrder.indexOf(currentPlan.id)
    const targetIndex = planOrder.indexOf(planId)
    
    return targetIndex > currentIndex
  }

  const isDowngrade = (planId: string) => {
    if (!currentPlan || currentPlan.id === 'free') return false
    
    const planOrder = ['starter', 'growth', 'scale']
    const currentIndex = planOrder.indexOf(currentPlan.id)
    const targetIndex = planOrder.indexOf(planId)
    
    return targetIndex < currentIndex
  }

  const getButtonText = (planId: string) => {
    const isCurrent = isCurrentPlan(planId)
    const isDowngradeAction = isDowngrade(planId)
    
    if (isCurrent) return "Current plan"
    if (isUpgrading) return <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</>
    
    if (isDowngradeAction) {
      const planName = planId.charAt(0).toUpperCase() + planId.slice(1)
      return `Downgrade to ${planName}`
    } else {
      return `Get Started`
    }
  }

  const handleSelectPlan = async (planId: string) => {
    if (isUpgrading || !currentOrganizationId) return
    
    const isDowngradeAction = isDowngrade(planId)
    
    if (isDowngradeAction) {
      // Show custom confirmation dialog instead of browser confirm
      setPendingDowngradePlan(planId)
      setShowDowngradeConfirm(true)
      return
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
        const planName = planId.charAt(0).toUpperCase() + planId.slice(1)
        toast.success(
          `Downgrade scheduled! Your plan will change to ${planName} at the end of your current billing cycle.`
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

  const handleConfirmDowngrade = async () => {
    if (!pendingDowngradePlan) return
    
    setShowDowngradeConfirm(false)
    setIsUpgrading(true)
    
    try {
      const response = await fetch('/api/subscriptions/schedule-downgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: pendingDowngradePlan,
          organizationId: currentOrganizationId,
          isDowngrade: true
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to schedule downgrade')
      }

      const planName = pendingDowngradePlan.charAt(0).toUpperCase() + pendingDowngradePlan.slice(1)
      toast.success(
        `Downgrade scheduled! Your plan will change to ${planName} at the end of your current billing cycle.`
      )
      onOpenChange(false)
      
    } catch (error) {
      console.error('Error scheduling downgrade:', error)
      toast.error('Failed to schedule downgrade')
    } finally {
      setIsUpgrading(false)
      setPendingDowngradePlan(null)
    }
  }

  const isCurrentPlan = (planId: string) => {
    return currentPlan?.id === planId
  }

  const formatPrice = (dollars: number): string => {
    return dollars.toString()
  }

  // Get plan data from pricing config
  const planIds = ['starter', 'growth', 'scale'] as const
  const plans = planIds.map(planId => {
    const pricing = getPlanPricing(planId)
    if (!pricing) return null
    
    return {
      id: planId,
      name: planId.charAt(0).toUpperCase() + planId.slice(1),
      description: '', // Removed descriptions
      ...pricing
    }
  }).filter(Boolean)

  function getFeatures(plan: any): string[] {
    const features = [
      plan.monthlyTopupLimit === -1 
        ? 'Unlimited ad spend' 
        : `Up to $${plan.monthlyTopupLimit.toLocaleString()}/month in ad spend`,
      `${plan.businessManagers} Active Business Manager${plan.businessManagers > 1 ? 's' : ''}`,
      `${plan.adAccounts} Active Ad Accounts`,
      `${plan.domainsPerBm} Promotion URLs per BM`,
      'Unlimited Replacements',
      ...getAdditionalFeatures(plan.id)
    ]
    
    // Only add pixel feature if plan has pixels (remove 0 pixel mentions)
    if (plan.pixels > 0) {
      features.splice(3, 0, `${plan.pixels} Facebook Pixels`)
    }
    
    return features
  }

  function getAdditionalFeatures(planId: string): string[] {
    switch (planId) {
      case 'starter':
        return ['Live chat support']
      case 'growth':
        return ['Priority support']
      case 'scale':
        return ['Dedicated Slack channel']
      default:
        return []
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl font-bold">Choose Your Plan</DialogTitle>
          <p className="text-muted-foreground mt-2">
            Scale your Facebook advertising with transparent pricing and no hidden fees
          </p>
        </DialogHeader>

        {/* Plans in 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            if (!plan) return null
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
                    {/* Removed description */}
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline mb-2">
                      <span className="text-3xl font-bold">${formatPrice(plan.price)}</span>
                      <span className="text-muted-foreground ml-2">/month</span>
                    </div>
                    {plan.adSpendFee > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        + {plan.adSpendFee}% ad spend fee
                      </p>
                    ) : (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        No ad spend fee
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <ul className="space-y-2.5">
                      {getFeatures(plan).map((feature, index) => (
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
                    disabled={isCurrent || isUpgrading}
                    className={`w-full h-11 font-medium ${
                      isCurrent
                        ? 'bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0'
                        : isPopular
                        ? 'bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0'
                        : 'bg-background hover:bg-accent text-foreground border border-border'
                    }`}
                    variant={isCurrent ? 'default' : isPopular ? 'default' : 'outline'}
                  >
                    {getButtonText(plan.id)}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Plus plan - horizontal layout */}
        <div className="border-t pt-8">
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Left side - Title and Button */}
              <div className="lg:min-w-[200px]">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2">PLUS</h3>
                </div>
                
                <Button
                  disabled={true}
                  className="w-full lg:w-auto lg:min-w-[140px] h-11 font-medium bg-background hover:bg-accent text-foreground border border-border"
                  variant="outline"
                >
                  Coming Soon
                </Button>
              </div>

              {/* Right side - Features */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Enterprise Features</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Unlimited Active Business Managers</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Unlimited Active Ad Accounts</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Unlimited Pixels & Domains</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">No monthly spend limits</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Premium Support</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Post-pay credit lines</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">White glove services</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Dedicated account manager</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Volume-based cashback</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {showDowngradeConfirm && (
      <Dialog open={showDowngradeConfirm} onOpenChange={setShowDowngradeConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="text-yellow-500 mr-2" />
              Confirm Downgrade
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to downgrade to {pendingDowngradePlan?.charAt(0).toUpperCase() + pendingDowngradePlan!.slice(1)}?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-lg my-4">
            <h3 className="font-semibold text-foreground mb-2">What happens next:</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Your current Scale plan remains active until the end of your billing cycle</li>
              <li>The downgrade takes effect on your next billing date</li>
              <li>You won’t be charged until then</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDowngradeConfirm(false)}>Cancel</Button>
            <Button variant="secondary" onClick={handleConfirmDowngrade}>
              {isUpgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Downgrade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
    </>
  )
} 