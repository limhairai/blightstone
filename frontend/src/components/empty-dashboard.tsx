"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Users, Wallet, Shield } from 'lucide-react'
import { gradients } from "~/lib/design-system"
import Image from "next/image"

export function EmptyDashboard() {
  const features = [
    {
      icon: <Users className="h-5 w-5 text-primary" />,
      title: "Create Ad Accounts",
      description: "Apply for single or batch Meta agency accounts through our streamlined process.",
      href: "/accounts/apply",
    },
    {
      icon: <Wallet className="h-5 w-5 text-primary" />,
      title: "Fund Your Wallet",
      description: "Top up your wallet to fund ad accounts and manage your advertising budget.",
      href: "/wallet",
    },
    {
      icon: <Shield className="h-5 w-5 text-primary" />,
      title: "Manage Access",
      description: "Control who has access to your Meta agency accounts and set permissions.",
      href: "/settings/access",
    },
  ]

  return (
    <div className="flex flex-col space-y-8 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center justify-center flex-1 max-w-5xl mx-auto px-4">
        {/* Hero section with improved design */}
        <div className="w-full bg-card rounded-2xl p-8 mb-10 border border-border shadow-xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
                <Image
                  src="/adhub-logo-placeholder.png"
                  alt="AdHub Logo"
                  width={120}
                  height={120}
                  className="object-contain p-4"
                  priority
                />
              </div>
            </div>

            <div className="text-center md:text-left">
              <h2
                className={`text-3xl font-bold mb-3 bg-clip-text text-transparent ${gradients.primaryButton.replace("bg-", "bg-")}`}
              >
                Welcome to AdHub!
              </h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Your self-service platform for Meta agency accounts. Get started by creating your first ad account or
                funding your wallet.
              </p>
              <Button className={`${gradients.primaryButton} hover:opacity-90 text-black px-6 py-2.5 h-auto`} asChild>
                <Link href="/accounts/apply">
                  <span className="font-medium">Create Your First Ad Account</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Features section with improved design */}
        <h3 className="text-xl font-semibold mb-6 self-start">Get Started</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card border border-border p-6 rounded-xl flex flex-col h-full shadow-md hover:shadow-lg transition-all hover:border-primary/30 group"
            >
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-5 group-hover:bg-accent transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm mb-5 flex-1">{feature.description}</p>
              <Link href={feature.href} className="mt-auto">
                <Button
                  variant="outline"
                  className="w-full border-border bg-muted hover:bg-accent group-hover:border-primary/30"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 