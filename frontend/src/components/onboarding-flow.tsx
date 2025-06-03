"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight, CheckCircle, Users, Wallet, BarChart3, Shield, Clock, Zap } from "lucide-react"
import { gradients } from "@/lib/design-tokens"

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  completed: boolean
  estimated: string
}

export function OnboardingFlow() {
  const [steps] = useState<OnboardingStep[]>([
    {
      id: "accounts",
      title: "Create Your First Ad Account",
      description: "Apply for Meta agency accounts to start advertising",
      icon: <Users className="h-5 w-5" />,
      href: "/accounts/apply",
      completed: false,
      estimated: "5 min",
    },
    {
      id: "wallet",
      title: "Fund Your Wallet",
      description: "Add funds to your wallet to manage ad spending",
      icon: <Wallet className="h-5 w-5" />,
      href: "/wallet",
      completed: false,
      estimated: "2 min",
    },
    {
      id: "dashboard",
      title: "Monitor Performance",
      description: "Track your ad accounts and spending analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      href: "/dashboard",
      completed: false,
      estimated: "1 min",
    },
  ])

  const features = [
    {
      icon: <Zap className="h-5 w-5 text-[#FFC857]" />,
      title: "Instant Approval",
      description: "Get your Meta agency accounts approved quickly",
    },
    {
      icon: <Shield className="h-5 w-5 text-[#34D197]" />,
      title: "Secure Platform",
      description: "Bank-level security for all your transactions",
    },
    {
      icon: <Clock className="h-5 w-5 text-[#F56565]" />,
      title: "24/7 Support",
      description: "Round-the-clock customer support when you need it",
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#333333] rounded-full px-4 py-2">
          <div className="w-2 h-2 bg-[#34D197] rounded-full animate-pulse" />
          <span className="text-sm text-[#9f9f9f]">Welcome to AdHub</span>
        </div>
        <h1 className="text-3xl font-bold">Let&apos;s Get You Started</h1>
        <p className="text-[#9f9f9f] max-w-2xl mx-auto">
          Follow these simple steps to set up your Meta agency account management platform and start advertising.
        </p>
      </div>

      {/* Progress Steps */}
      <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#333333]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Getting Started Checklist</span>
            <Badge variant="outline" className="border-[#333333] text-[#9f9f9f]">
              {steps.filter((s) => s.completed).length} of {steps.length} completed
            </Badge>
          </CardTitle>
          <CardDescription>Complete these steps to unlock the full potential of AdHub</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center gap-4 p-4 rounded-lg border border-[#333333] bg-[#111111] hover:bg-[#151515] transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.completed ? "bg-[#34D197] text-black" : "bg-[#1a1a1a] text-[#9f9f9f]"
                }`}
              >
                {step.completed ? <CheckCircle className="h-5 w-5" /> : step.icon}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{step.title}</h3>
                  <Badge variant="outline" className="border-[#333333] text-xs">
                    {step.estimated}
                  </Badge>
                </div>
                <p className="text-sm text-[#9f9f9f]">{step.description}</p>
              </div>

              <Link href={step.href}>
                <Button
                  variant={step.completed ? "outline" : "default"}
                  className={
                    step.completed
                      ? "border-[#333333] bg-[#1a1a1a] hover:bg-[#252525]"
                      : `${gradients.primaryButton} hover:opacity-90 text-black`
                  }
                >
                  {step.completed ? "Review" : "Start"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="bg-[#111111] border-[#333333]">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
                {feature.icon}
              </div>
              <h3 className="font-medium mb-2">{feature.title}</h3>
              <p className="text-sm text-[#9f9f9f]">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-[#0a0a0a] border-[#333333]">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-medium mb-1">Need Help Getting Started?</h3>
              <p className="text-sm text-[#9f9f9f]">Our support team is here to help you every step of the way.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-[#333333] bg-[#1a1a1a] hover:bg-[#252525]">
                View Documentation
              </Button>
              <Button className={`${gradients.primaryButton} hover:opacity-90 text-black`}>Contact Support</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
