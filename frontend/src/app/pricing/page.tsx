'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, Loader2, Crown, Zap, Rocket, ArrowRight, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/hooks/useSubscription"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { toast } from "sonner"
import { PRICING_CONFIG } from "@/lib/config/pricing-config"
import Link from "next/link"

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

const planIcons = {
  starter: Crown,
  growth: Zap,
  scale: Rocket,
  plus: Rocket,
  custom: Rocket
}

export default function PricingPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const { currentPlan } = useSubscription()
  const { currentOrganizationId } = useOrganizationStore()

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

    fetchPlans()
  }, [])

  const handleSelectPlan = async (planId: string) => {
    // If user is not logged in, redirect to register
    if (!currentOrganizationId) {
      router.push('/register')
      return
    }

    if (isUpgrading) return
    
    const selectedPlan = plans.find(p => p.id === planId)
    if (selectedPlan?.isCustom) {
      toast.info('Please contact our sales team for custom pricing')
      return
    }
    
    setIsUpgrading(true)
    try {
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
    
    // Add unlimited replacements for all plans
    features.push('Unlimited Replacements')
    
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

  const getButtonText = (plan: Plan) => {
    const isCurrent = isCurrentPlan(plan.id)
    
    if (isCurrent) return "Current Plan"
    if (isUpgrading) return <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</>
    if (plan.isComingSoon) return "Coming Soon"
    if (plan.isCustom) return "Contact Sales"
    
    return currentOrganizationId ? "Get Started" : "Get Started"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-xl font-bold">
                <span className="text-foreground">Ad</span>
                <span className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] bg-clip-text text-transparent">
                  Hub
                </span>
              </div>
            </Link>
            <div className="flex items-center space-x-3">
              {currentOrganizationId ? (
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Scale your Facebook advertising
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Choose the right plan for your business. Get unlimited replacements, 
            dedicated support, and everything you need to succeed.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-6">
        <div className="container mx-auto max-w-5xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => {
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
                        <div className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg">
                          Most Popular
                        </div>
                      </div>
                    )}

                    <div className="p-8">
                      {/* Plan name */}
                      <div className="mb-8">
                        <h3 className="text-2xl font-bold mb-2 capitalize">{plan.name}</h3>
                        <p className="text-muted-foreground text-sm">{plan.description}</p>
                      </div>

                      {/* Price */}
                      <div className="mb-8">
                        <div className="flex items-baseline mb-2">
                          <span className="text-4xl font-bold">${formatPrice(plan.monthlyPrice)}</span>
                          <span className="text-muted-foreground ml-2">/month</span>
                        </div>
                        {shouldShowAdSpendFee(plan) && (
                          <p className="text-sm text-muted-foreground">
                            + {plan.adSpendFee}% ad spend fee
                          </p>
                        )}
                      </div>

                      {/* Features */}
                      <div className="mb-8">
                        <ul className="space-y-3">
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
                        className={`w-full h-12 font-medium ${
                          isCurrent
                            ? 'bg-green-500 hover:bg-green-600 text-white'
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
          )}
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
              ))}
            </div>
            <blockquote className="text-xl text-muted-foreground italic mb-8">
              "AdHub has completely transformed how we manage our Facebook campaigns. 
              The platform is intuitive, reliable, and their support team is incredible."
            </blockquote>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">JD</span>
              </div>
              <div className="text-left">
                <div className="font-semibold">John Doe</div>
                <div className="text-sm text-muted-foreground">Marketing Director</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of businesses scaling their Facebook advertising with AdHub.
          </p>
          {!currentOrganizationId && (
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0">
                Start Free Trial
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; 2024 AdHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
} 