"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useAppData } from "../../contexts/AppDataContext"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { StatusBadge } from "../ui/status-badge"
import { StatusDot } from "../ui/status-dot"
import { SetupGuideWidget } from "../onboarding/setup-guide-widget"
import { EmailVerificationBanner } from "../onboarding/email-verification-banner"
import { AccountsTable } from "./accounts-table"
import { useSetupWidget } from "../layout/app-shell"
import { ArrowUpRight, CreditCard, ChevronDown, MoreHorizontal, ArrowRight, ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { 
  formatCurrency,
  formatRelativeTime,
  transactionColors,
  APP_CONSTANTS
} from "@/lib/mock-data"
import { checkEmptyState, shouldShowSetupElements, shouldShowEmailBanner } from "../../lib/state-utils"
import { getSetupProgress, shouldShowOnboarding } from "../../lib/state-utils"
import { layoutTokens, typographyTokens } from "../../lib/design-tokens"
import { useDemoState } from "../../contexts/DemoStateContext"
import { ErrorBoundary } from "../ui/error-boundary"
import { FullPageLoading } from "../ui/enhanced-loading"

export function DashboardView() {
  const { user } = useAuth()
  const { currentOrg, organizations, createOrganization, loading } = useAppData()
  const { state } = useDemoState()
  const { theme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("balance")
  const [timeFilter, setTimeFilter] = useState("3 Months")
  const [hoveredBalanceIndex, setHoveredBalanceIndex] = useState<number | null>(null)
  const [hoveredSpendIndex, setHoveredSpendIndex] = useState<number | null>(null)
  const [isCreatingOrg, setIsCreatingOrg] = useState(false)
  const { setupWidgetState, setSetupWidgetState, showEmptyStateElements, setShowEmptyStateElements } = useSetupWidget()
  const balanceChartRef = useRef<HTMLDivElement>(null)

  // Get user's first name for greeting
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  // Use real-time balance from state management
  const realBalance = state.financialData.walletBalance
  const monthlySpend = state.financialData.monthlyAdSpend

  // Generate balance data that varies by organization and uses real balance as current value
  const balanceData = useMemo(() => {
    const orgMultiplier = (currentOrg && currentOrg.id) ? (currentOrg.id.length % 3) + 1 : 1
    
    // Determine data points based on time filter
    let dataPoints = 60
    let dateRange = { start: 40, increment: 1 }
    
    switch (timeFilter) {
      case "1 Week":
        dataPoints = 7
        dateRange = { start: 16, increment: 1 }
        break
      case "1 Month":
        dataPoints = 30
        dateRange = { start: 1, increment: 1 }
        break
      case "3 Months":
        dataPoints = 60
        dateRange = { start: 40, increment: 1 }
        break
      case "1 Year":
        dataPoints = 365
        dateRange = { start: 1, increment: 12 }
        break
      case "This Week":
        dataPoints = 7
        dateRange = { start: 16, increment: 1 }
        break
    }
    
    return Array.from({ length: dataPoints }).map((_, i) => {
      // For the last point, use the actual current balance
      if (i === dataPoints - 1) {
        return {
          index: i,
          date: `May ${Math.min(31, dateRange.start + i)}`,
          value: realBalance,
        }
      }
      
      const baseValue = (8000 + i * 80) * orgMultiplier
      const dayVariation = Math.sin(i * 0.7) * 1200 * orgMultiplier
      const weekVariation = Math.cos(i * 0.2) * 800 * orgMultiplier
      const trendVariation = i % 7 === 0 ? -600 : i % 5 === 0 ? 1000 : 0

      return {
        index: i,
        date: timeFilter === "1 Year" 
          ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i % 12]} ${Math.floor(i / 12) + 2024}`
          : i < 10 ? `Feb ${23 + i}` : i < 25 ? `Mar ${i - 10 + 1}` : i < 40 ? `Apr ${i - 25 + 1}` : `May ${i - 40 + 1}`,
        value: Math.max(6000, Math.round(baseValue + dayVariation + weekVariation + trendVariation)),
      }
    })
  }, [currentOrg?.id, realBalance, timeFilter])

  // Generate spend data that uses real monthly spend
  const spendData = useMemo(() => {
    const orgMultiplier = (currentOrg && currentOrg.id) ? (currentOrg.id.length % 2) + 1 : 1
    
    // Determine data points based on time filter
    let dataPoints = 60
    
    switch (timeFilter) {
      case "1 Week":
        dataPoints = 7
        break
      case "1 Month":
        dataPoints = 30
        break
      case "3 Months":
        dataPoints = 60
        break
      case "1 Year":
        dataPoints = 365
        break
      case "This Week":
        dataPoints = 7
        break
    }
    
    return Array.from({ length: dataPoints }).map((_, i) => {
      // For recent points, incorporate actual monthly spend
      if (i >= dataPoints - 5) {
        const recentSpendBase = monthlySpend / 30 * (i - (dataPoints - 6)) // Daily average for recent days
        const noise = Math.sin(i * 3.7) * 50 + Math.cos(i * 2.3) * 30
        return {
          index: i,
          date: timeFilter === "1 Year" 
            ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i % 12]} ${Math.floor(i / 12) + 2024}`
            : `May ${Math.min(31, i - (dataPoints - 31) + 1)}`,
          value: Math.max(50, Math.round(recentSpendBase + noise)),
        }
      }
      
      const dayOfMonth = i % 30
      const monthMultiplier = 1 + Math.floor(i / 20) * 0.2
      let baseValue = (150 + dayOfMonth * 40) * monthMultiplier * orgMultiplier

      if (dayOfMonth === 15 || dayOfMonth === 28) {
        baseValue *= 2.2
      } else if (dayOfMonth % 7 === 0) {
        baseValue *= 1.5
      } else if (dayOfMonth % 3 === 0) {
        baseValue *= 1.2
      }

      const noise = Math.sin(i * 3.7) * 250 + Math.cos(i * 2.3) * 150

      return {
        index: i,
        date: timeFilter === "1 Year" 
          ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i % 12]} ${Math.floor(i / 12) + 2024}`
          : i < 10 ? `Feb ${23 + i}` : i < 25 ? `Mar ${i - 10 + 1}` : i < 40 ? `Apr ${i - 25 + 1}` : `May ${i - 40 + 1}`,
        value: Math.max(80, Math.round(baseValue + noise)),
      }
    })
  }, [currentOrg?.id, monthlySpend, timeFilter])

  // Use real-time transactions and accounts from state
  const transactions = state.transactions.slice(0, 5).map(tx => ({
    id: tx.id.toString(),
    name: tx.name,
    amount: tx.amount,
    type: tx.type,
    date: tx.date,
    account: tx.account,
    timestamp: tx.timestamp
  }))

  const transformedAccounts = state.accounts.slice(0, 5).map(account => ({
    id: account.id.toString(),
    name: account.name,
    accountId: account.adAccount,
    business: account.business,
    status: account.status === "paused" ? "inactive" : account.status as "active" | "pending" | "inactive" | "suspended",
    balance: account.balance,
    spendLimit: account.spendLimit,
    dateAdded: account.dateAdded,
    quota: Math.round((account.spent / account.quota) * 100),
    spent: account.spent,
    platform: account.platform,
  }))
  const accounts = transformedAccounts

  // Setup progress tracking - always show as if we have data for demo
  const setupProgress = useMemo(() => 
    getSetupProgress(
      !!user?.email_confirmed_at, // Email verified
      realBalance > 0, // Has wallet balance (always true for demo)
      true, // Has businesses (always true for demo)
      accounts.length > 0 // Has ad accounts (always true for demo)
    ), [user?.email_confirmed_at, realBalance, accounts.length])

  const shouldShowOnboardingElements = useMemo(() => 
    shouldShowOnboarding(setupProgress)
  , [setupProgress])

  // Create empty state conditions for banners
  const emptyStateConditions = useMemo(() => 
    checkEmptyState(
      transactions.length,
      accounts.length, 
      realBalance,
      !!user?.email_confirmed_at
    ), [transactions.length, accounts.length, realBalance, user?.email_confirmed_at])

  // Update context when onboarding state changes
  useEffect(() => {
    setShowEmptyStateElements(shouldShowOnboardingElements)
  }, [shouldShowOnboardingElements, setShowEmptyStateElements])

  // Handle email resend
  const handleResendEmail = async () => {
    // TODO: Implement email resend logic
    console.log('Resending verification email...')
  }

  // Handle organization creation
  const handleCreateOrganization = async () => {
    if (!user?.email) return
    
    setIsCreatingOrg(true)
    try {
      // Extract company name from email domain or use a default
      const emailDomain = user.email.split('@')[1]
      const orgName = emailDomain ? emailDomain.split('.')[0] : 'My Organization'
      
      await createOrganization(orgName)
    } catch (error) {
      console.error('Failed to create organization:', error)
    } finally {
      setIsCreatingOrg(false)
    }
  }

  // Show loading while data is being fetched
  if (loading) {
    return (
      <FullPageLoading 
        title="Loading Dashboard"
        description="Please wait while we load your dashboard data..."
      />
    )
  }

  // Always show filled dashboard for demo - no empty state
  const getTransactionIcon = (type: string, amount: number) => {
    if (type === "deposit" || amount > 0) {
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${transactionColors.deposit.bg}`}>
          <ArrowDownIcon className={`h-4 w-4 ${transactionColors.deposit.icon}`} />
        </div>
      )
    } else {
      return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${transactionColors.withdrawal.bg}`}>
          <ArrowUpIcon className={`h-4 w-4 ${transactionColors.withdrawal.icon}`} />
        </div>
      )
    }
  }

  return (
    <ErrorBoundary>
      <div className={layoutTokens.spacing.container}>
        {/* Email verification banner */}
        {shouldShowEmailBanner(emptyStateConditions) && (
          <EmailVerificationBanner onResendEmail={handleResendEmail} />
        )}

        {/* Setup Guide Widget */}
        {showEmptyStateElements && (
          <SetupGuideWidget
            widgetState={setupWidgetState === "expanded" ? "expanded" : "collapsed"}
            onStateChange={(state) => setSetupWidgetState(state)}
            setupProgress={setupProgress}
          />
        )}

        {/* Main dashboard layout - split into two columns */}
        <div className={`grid ${layoutTokens.gridCols.dashboardMain} ${layoutTokens.gaps.gridMedium}`}>
          {/* Left column - Balance/Spend */}
          <div className="lg:col-span-2">
            <Card className="border-border">
              <CardContent className="p-0">
                <Tabs defaultValue="balance" className="w-full" onValueChange={setActiveTab}>
                  <div className="border-b px-4 pt-4">
                    <TabsList className="bg-transparent p-0 h-auto mb-2">
                      <TabsTrigger
                        value="balance"
                        className="text-sm data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-[#b4a0ff] data-[state=active]:shadow-none rounded-none px-2 py-1 h-8"
                      >
                        <ArrowUpRight className="mr-2 h-4 w-4 text-[#b4a0ff]" />
                        Balance
                      </TabsTrigger>
                      <TabsTrigger
                        value="spend"
                        className="text-sm data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-[#b4a0ff] data-[state=active]:shadow-none rounded-none px-2 py-1 h-8"
                      >
                        <CreditCard className="mr-2 h-4 w-4 text-[#b4a0ff]" />
                        Account Spend
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="balance" className="mt-0">
                    <div className="p-4 pt-3">
                      <div className={typographyTokens.patterns.mutedMedium}>May 22, 2025</div>
                      <div className={typographyTokens.patterns.balanceLarge}>${formatCurrency(realBalance)}</div>

                      {/* Time filter dropdown */}
                      <div className="flex justify-end mb-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 px-3 rounded-md">
                              {timeFilter} <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px]">
                            {APP_CONSTANTS.TIME_FILTER_OPTIONS.map((option) => (
                              <DropdownMenuItem key={option.value} onClick={() => setTimeFilter(option.value)}>
                                <span>{option.label}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Interactive balance chart with real data */}
                      <div className="mt-2 h-[160px] w-full relative" ref={balanceChartRef}>
                        <div className="absolute inset-0 bottom-5">
                          {/* Gradient background */}
                          <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-[#b4a0ff33] to-transparent rounded-md"></div>
                          
                          {/* Interactive balance line chart */}
                          <svg className="absolute inset-0 h-full w-full z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path
                              d={`M ${balanceData.map((point, i) => `${(i / (balanceData.length - 1)) * 100},${100 - (point.value / Math.max(...balanceData.map(p => p.value))) * 60}`).join(' L ')}`}
                              fill="none"
                              stroke="url(#balanceLineGradient)"
                              strokeWidth="1.5"
                              vectorEffect="non-scaling-stroke"
                            />
                            <defs>
                              <linearGradient id="balanceLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#b4a0ff" />
                                <stop offset="100%" stopColor="#ffb4a0" />
                              </linearGradient>
                            </defs>
                          </svg>

                          {/* Interactive hover points - positioned exactly on the line */}
                          {balanceData.map((point, i) => {
                            const yPosition = 100 - (point.value / Math.max(...balanceData.map(p => p.value))) * 60;
                            return (
                              <div
                                key={i}
                                className="absolute w-8 h-8 -translate-x-4 -translate-y-4 cursor-pointer z-20 flex items-center justify-center"
                                style={{
                                  left: `${(i / (balanceData.length - 1)) * 100}%`,
                                  top: `${yPosition}%`,
                                }}
                                onMouseEnter={() => setHoveredBalanceIndex(i)}
                                onMouseLeave={() => setHoveredBalanceIndex(null)}
                              >
                                {/* Dot only visible on hover */}
                                <div className={`w-2 h-2 rounded-full transition-all ${
                                  hoveredBalanceIndex === i 
                                    ? 'bg-[#b4a0ff] scale-150 shadow-lg opacity-100' 
                                    : 'opacity-0'
                                }`} />
                                {hoveredBalanceIndex === i && (
                                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg z-30">
                                    <div className="font-medium">${formatCurrency(point.value)}</div>
                                    <div className="text-muted-foreground">{point.date}</div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Bottom axis line */}
                        <div className="absolute bottom-5 left-0 right-0 h-[1px] w-full bg-border z-5"></div>

                        {/* Month markers */}
                        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2 z-5">
                          <span>Feb 23</span>
                          <span>Mar 10</span>
                          <span>Mar 25</span>
                          <span>Apr 09</span>
                          <span>Apr 24</span>
                          <span>May 09</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-3 border-t">
                        <div className={typographyTokens.patterns.mutedMedium}>Available to spend</div>
                        <div className={typographyTokens.patterns.balanceSmall}>${formatCurrency(realBalance)}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="spend" className="mt-0">
                    <div className="p-4 pt-3">
                      <div className={typographyTokens.patterns.mutedMedium}>May 22, 2025</div>
                      <div className={typographyTokens.patterns.balanceLarge}>${formatCurrency(monthlySpend)}</div>

                      {/* Time filter dropdown */}
                      <div className="flex justify-end mb-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 px-3 rounded-md">
                              {timeFilter} <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px]">
                            {APP_CONSTANTS.TIME_FILTER_OPTIONS.map((option) => (
                              <DropdownMenuItem key={option.value} onClick={() => setTimeFilter(option.value)}>
                                <span>{option.label}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Interactive spend bar chart with real data */}
                      <div className="mt-2 h-[160px] w-full relative">
                        <div className="absolute inset-0 bottom-5">
                          <div className="h-full flex items-end justify-between px-1">
                            {/* Interactive spend bars */}
                            {spendData.map((point, i) => (
                              <div
                                key={i}
                                className="relative h-full flex items-end group cursor-pointer z-10"
                                style={{ width: `${100 / spendData.length}%` }}
                                onMouseEnter={() => setHoveredSpendIndex(i)}
                                onMouseLeave={() => setHoveredSpendIndex(null)}
                              >
                                <div
                                  className={`w-[60%] mx-auto rounded-sm transition-all ${
                                    hoveredSpendIndex === i 
                                      ? 'bg-gradient-to-t from-[#b4a0ff] to-[#ffb4a0] shadow-lg' 
                                      : 'bg-gradient-to-t from-[#b4a0ff]/70 to-[#ffb4a0]/70'
                                  }`}
                                  style={{ 
                                    height: `${Math.max(4, (point.value / Math.max(...spendData.map(p => p.value))) * 100)}%` 
                                  }}
                                />
                                {hoveredSpendIndex === i && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-background border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg z-20">
                                    <div className="font-medium">${formatCurrency(point.value)}</div>
                                    <div className="text-muted-foreground">{point.date}</div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bottom axis line */}
                        <div className="absolute bottom-5 left-0 right-0 h-[1px] w-full bg-border z-5"></div>

                        {/* Month markers */}
                        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2 z-5">
                          <span>Feb 23</span>
                          <span>Mar 10</span>
                          <span>Mar 25</span>
                          <span>Apr 09</span>
                          <span>Apr 24</span>
                          <span>May 09</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-3 border-t">
                        <div className={typographyTokens.patterns.mutedMedium}>Total spend this month</div>
                        <div className={typographyTokens.patterns.balanceSmall}>${formatCurrency(monthlySpend)}</div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Transactions */}
          <div className="lg:col-span-1">
            <Card className="border-border h-full">
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h3 className="font-semibold text-base">Transactions</h3>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-sm" onClick={() => router.push('/dashboard/transactions')}>
                    See all <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <div className="px-2 py-2">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.type, transaction.amount)}
                        <div>
                          <div className="font-medium text-sm">{transaction.name}</div>
                          <div className="text-xs text-muted-foreground">{transaction.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium text-sm ${transaction.amount > 0 ? transactionColors.deposit.text : "text-foreground"}`}>
                          {transaction.amount > 0 ? "+$" : "$"}{formatCurrency(Math.abs(transaction.amount))}
                        </div>
                        <div className="text-xs text-muted-foreground">{transaction.account}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Accounts</h2>
              <span className="text-sm text-muted-foreground">{state.accounts.length} / 100</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => router.push('/dashboard/accounts')}>
                See all accounts <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <AccountsTable />
        </div>
      </div>
    </ErrorBoundary>
  )
} 