"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, CreditCard, Users, Wallet, BarChart3, Plus, Eye } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function DashboardClientPage() {
  const [userName, setUserName] = useState("Sammy")
  const [teamName, setTeamName] = useState("Acme Corp")

  // Mock data for the dashboard
  const currentMonth = "May 2025"
  const nextBillingDate = "5 days"

  const walletBalance = 8750.0
  const adSpend = 3450.0
  const remainingBalance = walletBalance - adSpend

  const monthlySpend = 4200.0

  return (
    <div className="min-h-screen bg-background p-8 space-y-6">
      {/* Header */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-full">
          <h2 className="text-2xl font-bold tracking-tight">Welcome to AdHub</h2>
          <p className="text-muted-foreground">Here's an overview of your ad accounts and performance.</p>
        </div>

        {/* Usage Snapshot */}
        <div className="bg-card border border-border rounded-lg mb-6 md:col-span-2 lg:col-span-4">
          <div className="flex justify-between items-center p-4 border-b border-border">
            <h2 className="text-lg font-medium">Usage Snapshot for {currentMonth}</h2>
            <p className="text-sm text-muted-foreground">Next billing period starts in {nextBillingDate}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* No Invoiced Billing */}
                <div className="bg-background border border-border rounded-lg p-4">
                  <h3 className="font-medium mb-1">No Invoiced Billing</h3>
                  <p className="text-xs text-muted-foreground mb-3">You haven't setup invoiced billing yet.</p>
                  <Button size="sm" className="bg-gradient-brand text-black text-sm h-8 hover:opacity-90">
                    Enable
                  </Button>
                </div>

                {/* Prepaid credits */}
                <div className="flex flex-col justify-center items-center">
                  <div className="w-24 h-24 rounded-full border-4 border-border flex flex-col justify-center items-center mb-2">
                    <span className="text-lg font-medium">{formatCurrency(walletBalance)}</span>
                  </div>
                  <h3 className="text-sm font-medium">Prepaid credits</h3>
                  <p className="text-xs text-muted-foreground">${formatCurrency(10000)}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(remainingBalance)} remaining</p>
                </div>

                {/* Free credits */}
                <div className="flex flex-col justify-center items-center">
                  <div className="w-24 h-24 rounded-full border-4 border-border flex flex-col justify-center items-center mb-2">
                    <span className="text-lg font-medium">$500</span>
                  </div>
                  <h3 className="text-sm font-medium">Free credits</h3>
                  <p className="text-xs text-muted-foreground">$500 total</p>
                  <p className="text-xs text-muted-foreground">$500 remaining</p>
                </div>
              </div>

              {/* Usage details */}
              <div className="border-t border-border pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Total usage</span>
                  <span>{formatCurrency(1250)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next invoice</span>
                  <span>{formatCurrency(0)}</span>
                </div>
              </div>
            </div>

            {/* Monthly snapshot */}
            <div className="bg-background border border-border rounded-lg p-4 flex flex-col justify-center">
              <h3 className="text-sm font-medium mb-2">Monthly snapshot</h3>
              <p>
                You spend roughly <span className="font-medium">{formatCurrency(monthlySpend)}</span> / month
              </p>

              {/* Overview Cards */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-card border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-[#b4a0ff]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ad Spend</p>
                      <p className="text-sm font-medium">{formatCurrency(adSpend)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                      <Users className="h-4 w-4 text-[#b4a0ff]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Accounts</p>
                      <p className="text-sm font-medium">12 active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Opt-in section */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6 md:col-span-2 lg:col-span-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium mb-1">Opt-in to AI-powered ad optimization</h3>
              <p className="text-sm text-muted-foreground">
                Get $150 worth of free ad credits by enabling our AI optimization engine to improve your ad performance.
                Once enabled, you cannot opt-out for 30 days.
              </p>
            </div>
            <Button className="bg-gradient-brand text-black hover:opacity-90">Enable AI Optimization</Button>
          </div>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-2 lg:col-span-4">
          <Card className="bg-card border-border hover:border-border/80 transition-all">
            <CardContent className="p-6">
              <div className="flex flex-col h-full">
                <div className="mb-4 p-2 w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Plus className="h-5 w-5 text-[#b4a0ff]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Create an Ad Account</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">
                  Start integrating with our API to create and manage Meta ad accounts
                </p>
                <Link href="/accounts/apply" className="flex items-center text-sm text-[#b4a0ff]">
                  Start creating
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-border/80 transition-all">
            <CardContent className="p-6">
              <div className="flex flex-col h-full">
                <div className="mb-4 p-2 w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Users className="h-5 w-5 text-[#b4a0ff]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Invite your team</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">
                  Collaborate with your team members to manage ad accounts and campaigns
                </p>
                <Link href="/settings/team" className="flex items-center text-sm text-[#b4a0ff]">
                  Manage team
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-border/80 transition-all">
            <CardContent className="p-6">
              <div className="flex flex-col h-full">
                <div className="mb-4 p-2 w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Eye className="h-5 w-5 text-[#b4a0ff]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">View invoices</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">
                  Track your spending and view detailed invoices for your ad accounts
                </p>
                <Link href="/wallet/transactions" className="flex items-center text-sm text-[#b4a0ff]">
                  View transactions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 md:col-span-2 lg:col-span-4">
          <Card className="bg-card border-border hover:border-border/80 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Top up your wallet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add funds to your wallet to ensure your ad campaigns run without interruption
                  </p>
                  <Button className="bg-gradient-brand text-black hover:opacity-90">
                    <Wallet className="mr-2 h-4 w-4" />
                    Add Funds
                  </Button>
                </div>
                <div className="p-3 rounded-full bg-secondary flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-[#b4a0ff]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-border/80 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">View performance metrics</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Analyze your ad performance and optimize your campaigns for better results
                  </p>
                  <Button className="bg-gradient-brand text-black hover:opacity-90">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                </div>
                <div className="p-3 rounded-full bg-secondary flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-[#b4a0ff]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
