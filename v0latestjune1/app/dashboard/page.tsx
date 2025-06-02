"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { ArrowRight, Users, Wallet, BarChart3, Plus } from "lucide-react"
import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import WelcomeHeader from "@/components/welcome-header"

// This is a mock function to check if the user has any accounts
// In a real app, this would come from your data fetching logic
const hasAccounts = false
const hasTransactions = false

export default function Dashboard() {
  return (
    <AppShell>
      <WelcomeHeader />

      {/* Net Worth Card */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">TOTAL BALANCE</CardTitle>
          <Button size="icon" variant="ghost" className="rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">$0</div>

          {!hasAccounts && (
            <div className="mt-6 bg-[#b4a0ff]/10 dark:bg-[#b4a0ff]/5 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-center mb-2">First step: Create your ad accounts</h3>
              <p className="text-center text-muted-foreground mb-4">
                Track and manage your advertising spend with AdHub
              </p>
              <div className="flex justify-center">
                <Button asChild className="bg-[#b4a0ff] hover:bg-[#a28eee] text-black">
                  <Link href="/accounts/apply">CREATE AD ACCOUNT</Link>
                </Button>
              </div>

              <div className="flex justify-center gap-8 mt-8">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-2">
                    <Users className="h-6 w-6 text-[#b4a0ff]" />
                  </div>
                  <span className="text-sm">Meta Ads</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-2">
                    <Wallet className="h-6 w-6 text-[#b4a0ff]" />
                  </div>
                  <span className="text-sm">Wallet</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-2">
                    <BarChart3 className="h-6 w-6 text-[#b4a0ff]" />
                  </div>
                  <span className="text-sm">Analytics</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          Quick Actions
          <StatusBadge status="new" className="ml-2">
            New
          </StatusBadge>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:border-[#b4a0ff]/50 transition-all cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#b4a0ff]/10 flex items-center justify-center mb-3 mt-3">
                <Users className="h-5 w-5 text-[#b4a0ff]" />
              </div>
              <h3 className="font-medium mb-1">Create Ad Account</h3>
              <p className="text-sm text-muted-foreground mb-3">Apply for Meta agency accounts</p>
              <Button variant="ghost" size="sm" className="mt-auto" asChild>
                <Link href="/accounts/apply">
                  Get Started <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-[#b4a0ff]/50 transition-all cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#b4a0ff]/10 flex items-center justify-center mb-3 mt-3">
                <Wallet className="h-5 w-5 text-[#b4a0ff]" />
              </div>
              <h3 className="font-medium mb-1">Fund Your Wallet</h3>
              <p className="text-sm text-muted-foreground mb-3">Add funds to your AdHub wallet</p>
              <Button variant="ghost" size="sm" className="mt-auto" asChild>
                <Link href="/wallet">
                  Top Up <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-[#b4a0ff]/50 transition-all cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#b4a0ff]/10 flex items-center justify-center mb-3 mt-3">
                <BarChart3 className="h-5 w-5 text-[#b4a0ff]" />
              </div>
              <h3 className="font-medium mb-1">View Help Center</h3>
              <p className="text-sm text-muted-foreground mb-3">Learn how to use AdHub</p>
              <Button variant="ghost" size="sm" className="mt-auto" asChild>
                <Link href="/help">
                  Learn More <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasTransactions ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[#b4a0ff]/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-[#b4a0ff]" />
                </div>
                <h3 className="font-medium mb-2">No activity yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-4">
                  Create an ad account and fund your wallet to see your activity here
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/accounts/apply">Create Ad Account</Link>
                </Button>
              </div>
            ) : (
              <div>
                {/* Transaction history would go here */}
                <p>Transaction history</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ad Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasAccounts ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[#b4a0ff]/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-[#b4a0ff]" />
                </div>
                <h3 className="font-medium mb-2">No ad accounts yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-4">
                  Create your first ad account to start advertising on Meta platforms
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/accounts/apply">Create Ad Account</Link>
                </Button>
              </div>
            ) : (
              <div>
                {/* Ad accounts would go here */}
                <p>Ad accounts list</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
