'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, Loader2, AlertTriangle, Info } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/hooks/useSubscription"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { toast } from "sonner"
import { getPlanPricing, getBmApplicationFee } from "@/lib/config/pricing-config"

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

  function getFeatures(plan: any): Array<{ text: string; hasTooltip?: boolean; tooltipText?: string }> {
    const bmFee = getBmApplicationFee(plan.id as 'starter' | 'growth' | 'scale')
    
    const features = [
      { text: plan.monthlyTopupLimit === -1 
        ? 'Unlimited ad spend' 
        : `Up to $${plan.monthlyTopupLimit.toLocaleString()}/month in ad spend` },
      { text: `${plan.businessManagers} Active Business Manager${plan.businessManagers > 1 ? 's' : ''}` },
      { text: `${plan.adAccounts} Active Ad Accounts` },
      { text: `${plan.domainsPerBm} Promotion URLs per BM` },
      { text: 'Unlimited Replacements' },
      // BM Application Fee with tooltip
      bmFee === 0 
        ? { text: 'Free additional Business Managers' }
        : { 
            text: `Additional BMs: $${bmFee} each (1st free)`,
            hasTooltip: true,
            tooltipText: "Your first Business Manager is always free. Additional Business Managers require a one-time application fee."
          },
      ...getAdditionalFeatures(plan.id).map(text => ({ text }))
    ]
    
    // Only add pixel feature if plan has pixels (remove 0 pixel mentions)
    if (plan.pixels > 0) {
      features.splice(4, 0, { text: `${plan.pixels} Facebook Pixels` })
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
    <TooltipProvider>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl font-bold">Choose Your Plan</DialogTitle>
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
                    <div className="bg-primary text-black px-4 py-1.5 rounded-full text-sm font-medium shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan name */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-2 capitalize">{plan.name}</h3>
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
                      <p className="text-sm text-foreground dark:text-foreground">
                        No ad spend fee
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <ul className="space-y-2.5">
                      {getFeatures(plan).map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 text-foreground mr-3 mt-0.5 flex-shrink-0" />
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">{feature.text}</span>
                            {feature.hasTooltip && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-xs">{feature.tooltipText}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
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
                        ? 'bg-background hover:bg-accent text-foreground border border-border'
                        : isPopular
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-0'
                        : 'bg-background hover:bg-accent text-foreground border border-border'
                    }`}
                    variant={isCurrent ? 'outline' : isPopular ? 'default' : 'outline'}
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
          <div className="bg-card rounded-2xl border border-[#b4a0ff]/30 shadow-md ring-1 ring-[#b4a0ff]/10 p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Left side - Title and Button */}
              <div className="lg:min-w-[200px]">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2">PLUS</h3>
                </div>
                
                <Button
                  onClick={() => {
                    // TODO: Open contact form or redirect to contact page
                    toast.info("Contact us for Plus plan pricing and setup")
                  }}
                  className="w-full lg:w-auto lg:min-w-[140px] h-11 font-medium bg-primary hover:bg-primary/90 text-primary-foreground border-0"
                  variant="default"
                >
                  Contact Us
                </Button>
              </div>

              {/* Right side - Features */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Enhanced Features</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-foreground mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Unlimited Active Business Managers</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-foreground mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Unlimited Active Ad Accounts</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-foreground mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Unlimited Pixels & Domains</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-foreground mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">No monthly spend limits</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Premium Support</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-foreground mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Connect your own credit card</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-foreground mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">White glove services</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-foreground mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Dedicated account manager</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-foreground mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Attach your BMs and ad accounts</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Downgrade Confirmation Dialog */}
    <Dialog open={showDowngradeConfirm} onOpenChange={setShowDowngradeConfirm}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-5 w-5" />
            Confirm Downgrade
          </DialogTitle>
          <DialogDescription className="text-left">
            Are you sure you want to downgrade to {pendingDowngradePlan ? (pendingDowngradePlan.charAt(0).toUpperCase() + pendingDowngradePlan.slice(1)) : 'selected plan'}?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div className="p-3 bg-muted rounded-lg border">
            <p className="text-sm text-foreground">
              <strong>What happens next:</strong>
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Your current {currentPlan?.name} plan remains active until the end of your billing cycle</li>
              <li>• The downgrade takes effect on your next billing date</li>
              <li>• You won't be charged until then</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setShowDowngradeConfirm(false)
              setPendingDowngradePlan(null)
            }}
            disabled={isUpgrading}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirmDowngrade}
            disabled={isUpgrading}
          >
            {isUpgrading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Confirm Downgrade'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </TooltipProvider>
    </>
  )
} 