import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Star } from 'lucide-react'
import { 
  getActivePricingPlans, 
  calculateTotalCost, 
  type PricingPlan 
} from '@/lib/config/pricing-management'
import { formatCurrency } from '@/lib/config/financial'

interface PricingPlansDisplayProps {
  onSelectPlan?: (planId: string) => void
  currentPlan?: string
  showTrialInfo?: boolean
}

export function PricingPlansDisplay({ 
  onSelectPlan, 
  currentPlan,
  showTrialInfo = true 
}: PricingPlansDisplayProps) {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const plans = getActivePricingPlans()

  const handlePlanSelect = (planId: string) => {
    if (onSelectPlan) {
      onSelectPlan(planId)
    }
  }

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-muted p-1 rounded-lg">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-4 py-2 rounded-md transition-colors ${
              billingInterval === 'monthly'
                ? 'bg-background shadow-sm'
                : 'hover:bg-background/50'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('yearly')}
            className={`px-4 py-2 rounded-md transition-colors ${
              billingInterval === 'yearly'
                ? 'bg-background shadow-sm'
                : 'hover:bg-background/50'
            }`}
          >
            Yearly
            <Badge variant="secondary" className="ml-2">Save 15%</Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id
          const totalCost = calculateTotalCost(plan, billingInterval === 'yearly')
          const monthlyDisplayPrice = billingInterval === 'yearly' 
            ? totalCost / 12 
            : totalCost

          return (
            <Card 
              key={plan.id}
              className={`relative ${
                plan.isPopular ? 'border-primary shadow-lg scale-105' : ''
              } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                
                <div className="space-y-2">
                  <div className="text-3xl font-bold">
                    {formatCurrency(monthlyDisplayPrice)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /month
                    </span>
                  </div>
                  
                  {billingInterval === 'yearly' && plan.basePrice > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(totalCost)} billed annually
                    </p>
                  )}
                  
                  {showTrialInfo && plan.trialDays && plan.trialDays > 0 && (
                    <Badge variant="outline">
                      {plan.trialDays}-day free trial
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features List */}
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limits Display */}
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground space-y-1">
                    {plan.limits.accountsLimit !== undefined && (
                      <div>
                        Ad Accounts: {plan.limits.accountsLimit === -1 ? 'Unlimited' : plan.limits.accountsLimit}
                      </div>
                    )}
                    {plan.limits.usersLimit !== undefined && (
                      <div>
                        Team Members: {plan.limits.usersLimit === -1 ? 'Unlimited' : plan.limits.usersLimit}
                      </div>
                    )}
                    {plan.limits.monthlySpend && (
                      <div>
                        Monthly Spend Limit: {formatCurrency(plan.limits.monthlySpend)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => handlePlanSelect(plan.id)}
                  variant={isCurrentPlan ? 'outline' : plan.isPopular ? 'default' : 'outline'}
                  className="w-full"
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? 'Current Plan' : 
                   plan.basePrice === 0 ? 'Get Started' : 
                   `Choose ${plan.name}`}
                </Button>

                {/* Fee Information */}
                {plan.feeRate > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    + {(plan.feeRate * 100).toFixed(1)}% processing fee
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Additional Information */}
      <div className="text-center text-sm text-muted-foreground space-y-2">
        <p>All plans include our core ad management features</p>
        <p>Cancel anytime • 30-day money back guarantee</p>
        <p>Need a custom plan? <a href="/contact" className="text-primary hover:underline">Contact us</a></p>
      </div>
    </div>
  )
} 