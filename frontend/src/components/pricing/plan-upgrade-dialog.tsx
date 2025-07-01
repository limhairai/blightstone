'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { useState } from "react"
import { useSubscription } from "@/hooks/useSubscription"

interface PlanUpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    adSpendFee: 6,
    features: [
      '1 Business Manager',
      '5 Ad Accounts',
      '2 Team Members included',
      'Additional team members: +$10/month each'
    ],
    isPopular: false
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 149,
    adSpendFee: 3,
    features: [
      '3 Business Managers',
      '21 Ad Accounts (7 per BM)',
      '5 Team Members included',
      'Additional team members: +$15/month each'
    ],
    isPopular: true
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 499,
    adSpendFee: 1.5,
    features: [
      '10 Business Managers',
      '70 Ad Accounts (7 per BM)',
      '15 Team Members included',
      'Additional team members: +$20/month each'
    ],
    isPopular: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 1499,
    adSpendFee: 1,
    features: [
      'Unlimited Business Managers',
      'Unlimited Ad Accounts',
      'Unlimited Team Members included',
      'White-label options',
      'Account Manager'
    ],
    isPopular: false
  }
]

export function PlanUpgradeDialog({ open, onOpenChange }: PlanUpgradeDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const { currentPlan, upgradePlan } = useSubscription()

  const handleSelectPlan = async (planId: string) => {
    if (isUpgrading) return
    
    setIsUpgrading(true)
    try {
      const success = await upgradePlan(planId)
      if (success) {
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error upgrading plan:', error)
    } finally {
      setIsUpgrading(false)
    }
  }

  const isCurrentPlan = (planId: string) => {
    return currentPlan?.id === planId
  }

  const canUpgradeTo = (planId: string) => {
    if (!currentPlan) return true
    
    const currentPlanIndex = plans.findIndex(p => p.id === currentPlan.id)
    const targetPlanIndex = plans.findIndex(p => p.id === planId)
    
    return targetPlanIndex > currentPlanIndex
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade Plan</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose a plan that fits your needs.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan.id)
            const canUpgrade = canUpgradeTo(plan.id)
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border p-6 ${
                  isCurrent 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                } ${plan.isPopular ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.isPopular && (
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
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    + {plan.adSpendFee}% ad spend fee
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || !canUpgrade || isUpgrading}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {isCurrent 
                    ? "Current Plan" 
                    : !canUpgrade 
                      ? "Downgrade" 
                      : isUpgrading 
                        ? "Processing..." 
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