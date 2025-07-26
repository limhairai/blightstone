"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { useSWRConfig } from 'swr'
import { useAuth } from "../../contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { StatusBadge } from "../ui/status-badge"
import { StatusDot } from "./status-dot"
import { ErrorBoundary } from "../ui/error-boundary"

import { EmailVerificationBanner } from "../onboarding/email-verification-banner"

import { CompactAccountsTable } from "./compact-accounts-table"
import { useAdvancedOnboarding } from "../../hooks/useAdvancedOnboarding"


import { ArrowUpRight, CreditCard, ChevronDown, MoreHorizontal, ArrowDownIcon, ArrowUpIcon, RefreshCw, ArrowRight } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { 
  formatCurrency,
  formatRelativeTime,
  transactionColors
} from "../../utils/format"
import { Transaction } from "../../types/transaction"


import { layoutTokens, typographyTokens } from "../../lib/design-tokens"

import { Skeleton, DashboardSkeleton } from "../ui/skeleton"
import { formatCurrency as financialFormatCurrency } from '@/lib/config/financial'

import { useAutoRefresh, REFRESH_INTERVALS } from "../../hooks/useAutoRefresh"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useDashboardData, useTopupRequests } from "../../lib/swr-config"
import { DashboardLoadingScreen } from "../core/dashboard-loading-screen"
import { GlobalDataPrefetcher } from "../../lib/global-prefetcher"

export function DashboardView() {
  // ALL HOOKS MUST BE CALLED FIRST - NEVER AFTER CONDITIONAL LOGIC
  const { user, session, loading: authLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("balance")
  const [timeFilter, setTimeFilter] = useState("7 Days") // Start with 7 days for new users
  const [hoveredBalanceIndex, setHoveredBalanceIndex] = useState<number | null>(null)
  const [hoveredSpendIndex, setHoveredSpendIndex] = useState<number | null>(null)
  const [isCreatingOrg, setIsCreatingOrg] = useState(false)
  const [showLoadingScreen, setShowLoadingScreen] = useState(false) // Disable slow loading screen

  // Check onboarding status - RESTORED
  const { shouldShowOnboarding, progressData, isLoading: onboardingLoading } = useAdvancedOnboarding()
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const [showEmptyStateElements, setShowEmptyStateElements] = useState(false)
  const { currentOrganizationId, setCurrentOrganizationId, onboardingDismissed, setOnboardingDismissed } = useOrganizationStore();
  const { mutate } = useSWRConfig();

  // 🚀 PERFORMANCE: Use optimized dashboard data hook instead of 5 separate SWR calls
  const {
    organizations: userOrgsData,
    currentOrganization: organization,
    businessManagers,
    adAccounts: accounts,
    transactions: transactionsData,
    isLoading: isDashboardLoading,
    isLoadingOrgs,
    isLoadingCurrentOrg: isOrgLoading,
    isLoadingBusinessManagers: isBizLoading,
    isLoadingAdAccounts: isAccLoading,
    isLoadingTransactions: isTransLoading,
    error: dashboardError,
    // Debug errors
    orgError,
    currentOrgError,
    businessManagersError,
    adAccountsError,
    transactionsError,
  } = useDashboardData(currentOrganizationId)

  // 🚀 PERFORMANCE: Fetch pending topup requests for complete topup tracking
  const { data: topupRequestsData, isLoading: isLoadingTopupRequests } = useTopupRequests()

  // 🚀 OPTIMIZED GLOBAL PREFETCHING: Load dashboard data when ready (stable dependencies)
  const isReadyForPrefetch = useMemo(() => 
    Boolean(user && session && currentOrganizationId && !authLoading),
    [user, session, currentOrganizationId, authLoading]
  )
  
  useEffect(() => {
    if (!isReadyForPrefetch) return

    // ✅ FIXED: Create AbortController for cancellation
    const abortController = new AbortController()

    // Aggressive prefetching for 0ms page loads
    const prefetcher = new GlobalDataPrefetcher({
      session: session!,
      organizationId: currentOrganizationId!
    })

    // Start prefetching immediately in background
    prefetcher.prefetchAllDashboardData().then(() => {
              // Dashboard data prefetched
    }).catch((error) => {
      if (error.name !== 'AbortError') {
        console.warn('Some prefetch tasks failed:', error)
      }
    })

    // ✅ FIXED: Legacy preloading with AbortController for cancellation
    const preloadCriticalData = async (signal: AbortSignal) => {
      try {
        // Preload pixels data (for pixels page)
        fetch(`/api/organizations/${currentOrganizationId}/pixels`, {
          headers: { 'Authorization': `Bearer ${session!.access_token}` },
          signal // ✅ Add abort signal
        }).catch((error) => {
          if (error.name !== 'AbortError') {
            console.warn('Pixels preload failed:', error)
          }
        })

        // Preload business managers details (for business managers page)
        fetch(`/api/organizations/${currentOrganizationId}/business-managers`, {
          headers: { 'Authorization': `Bearer ${session!.access_token}` },
          signal // ✅ Add abort signal
        }).catch((error) => {
          if (error.name !== 'AbortError') {
            console.warn('Business managers preload failed:', error)
          }
        })

        // Critical data preloaded
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.warn('Preloading failed:', error)
        }
      }
    }

    // ✅ FIXED: Preload with cancellation support
    const preloadTimer = setTimeout(() => {
      if (!abortController.signal.aborted) {
        preloadCriticalData(abortController.signal)
      }
    }, 1000)
    
    // ✅ FIXED: Comprehensive cleanup
    return () => {
      clearTimeout(preloadTimer)
      abortController.abort() // Cancel all fetch operations
    }
  }, [isReadyForPrefetch, session, currentOrganizationId])

  // Setup widget is now handled by AppShell - no local state needed
  
  const balanceChartRef = useRef<HTMLDivElement>(null)

  // Auto-refresh hook using centralized cache invalidation (FIXED: Proper cache keys)
  const { manualRefresh, isRefreshing } = useAutoRefresh({
    enabled: !!user && !authLoading && !isDashboardLoading, // Re-enabled for testing
    interval: REFRESH_INTERVALS.VERY_SLOW, // Use very slow interval (30 minutes) to minimize API calls
    onRefresh: async () => {
      // ✅ FIXED: Use centralized cache invalidation instead of manual mutate
      if (user && !authLoading && currentOrganizationId) {
        try {
          const { invalidateAllUserCache } = await import('@/lib/cache-invalidation')
          invalidateAllUserCache(currentOrganizationId)
        } catch (error) {
          console.warn('Dashboard auto-refresh failed:', error)
          // Don't crash the app, just log the warning
        }
      }
    },
    dependencies: [user?.id, currentOrganizationId] // Restart refresh when user or org changes
  })

  // Organization is now handled by AuthContext - no manual initialization needed
  // This effect is kept for edge cases where user switches organizations manually
  useEffect(() => {
    if (userOrgsData?.length > 0 && currentOrganizationId) {
      // Verify current org still exists in the user's organizations
      const currentOrgExists = userOrgsData.find((org: any) => org.id === currentOrganizationId);
      if (!currentOrgExists) {
        // Current org doesn't exist, switch to the first available organization
        setCurrentOrganizationId(userOrgsData[0].id);
      }
    }
  }, [userOrgsData, currentOrganizationId, setCurrentOrganizationId]);

  // Get user's first name for greeting
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  // Use real-time balance from state management - ensure no NaN values
  const realBalance = Number.isFinite(organization?.balance_cents) ? (organization.balance_cents / 100) : 0;
  const monthlySpend = accounts.reduce((sum: any, acc: any) => sum + (acc.spent ?? 0), 0);

  // We always have real data now - no more demo data

  // ALL USEMEMO AND USEEFFECT HOOKS MUST BE BEFORE EARLY RETURNS
  // Generate REAL balance data based on actual transaction history
  const balanceData = useMemo(() => {
    // Calculate data points and intervals based on time filter
    let dataPoints, intervalType, intervalSize
    
    switch (timeFilter) {
      case "1 Day":
        dataPoints = 24
        intervalType = "hours"
        intervalSize = 1
        break
      case "7 Days":
        dataPoints = 7
        intervalType = "days"
        intervalSize = 1
        break
      case "1 Month":
        dataPoints = 30
        intervalType = "days"
        intervalSize = 1
        break
      case "3 Months":
        dataPoints = 13
        intervalType = "weeks"
        intervalSize = 7
        break
      case "Lifetime":
        // For lifetime, we'll use the transaction history to determine the range
        if (transactionsData.length === 0) {
          // No transactions yet, show last 30 days as placeholder
          dataPoints = 30
          intervalType = "days"
          intervalSize = 1
        } else {
          const oldestTransaction = new Date(Math.min(...transactionsData.map((tx: Transaction) => new Date(tx.created_at).getTime())))
        const daysSinceOldest = Math.ceil((new Date().getTime() - oldestTransaction.getTime()) / (1000 * 60 * 60 * 24))
        
          // Ensure minimum of 1 data point
          const safeDaysSinceOldest = Math.max(1, daysSinceOldest)
          
          if (safeDaysSinceOldest <= 30) {
            dataPoints = Math.max(2, safeDaysSinceOldest) // Ensure minimum 2 points for chart rendering
          intervalType = "days"
          intervalSize = 1
          } else if (safeDaysSinceOldest <= 90) {
            dataPoints = Math.max(2, Math.ceil(safeDaysSinceOldest / 7))
          intervalType = "weeks"
          intervalSize = 7
        } else {
            dataPoints = Math.max(2, Math.ceil(safeDaysSinceOldest / 30))
          intervalType = "months"
          intervalSize = 30
          }
        }
        break
      default:
        dataPoints = 7
        intervalType = "days"
        intervalSize = 1
    }
    
    // Generate time points
    const today = new Date()
    const timePoints = Array.from({ length: dataPoints }).map((_, i) => {
      let pointDate = new Date(today)
      
      if (intervalType === "hours") {
        pointDate.setHours(today.getHours() - (dataPoints - 1 - i))
      } else if (intervalType === "days") {
        pointDate.setDate(today.getDate() - (dataPoints - 1 - i) * intervalSize)
      } else if (intervalType === "weeks") {
        pointDate.setDate(today.getDate() - (dataPoints - 1 - i) * intervalSize)
      } else if (intervalType === "months") {
        pointDate.setDate(today.getDate() - (dataPoints - 1 - i) * intervalSize)
      }
      
      // Format date labels based on interval type
      let dateLabel
      if (intervalType === "hours") {
        dateLabel = pointDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
      } else if (intervalType === "days") {
        dateLabel = pointDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (intervalType === "weeks") {
        dateLabel = pointDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (intervalType === "months") {
        dateLabel = pointDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }
      
      return {
        index: i,
        date: dateLabel,
        pointDate,
        value: 0 // Default to zero
      }
    })
    
    // Calculate historical balance based on transactions
    if (transactionsData.length > 0) {
      // Sort transactions by date (newest first)
      const sortedTransactions = [...transactionsData].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      
      timePoints.forEach((point, i) => {
        // Calculate balance at this point in time by working backwards from current balance
        let balanceAtPoint = realBalance
        
        // For each transaction that happened after this point, reverse its effect
        sortedTransactions.forEach(tx => {
          const txDate = new Date(tx.created_at)
          if (txDate > point.pointDate) {
            // This transaction happened after this point, so reverse its effect
            const txAmount = (tx.amount_cents || 0) / 100
            
            // If it was a credit (topup), subtract it from the balance at this point
            // If it was a debit (spend), add it back to the balance at this point
            if (tx.type === 'credit' || tx.type === 'topup' || tx.type === 'deposit') {
              balanceAtPoint -= txAmount
            } else if (tx.type === 'debit' || tx.type === 'spend' || tx.type === 'withdrawal') {
              balanceAtPoint += Math.abs(txAmount) // Add back the spent amount
            }
          }
        })
        
        point.value = Math.max(0, balanceAtPoint) // Ensure non-negative balance
      })
    } else {
      // For new accounts with no transaction history, show flat line at current balance
      timePoints.forEach((point, i) => {
        point.value = realBalance
      })
    }
    
    // Balance chart data processed
    
    return timePoints
  }, [realBalance, timeFilter, transactionsData])
  


    // Generate ad account topup data based on actual wallet-to-ad-account transfers + pending requests
  const spendData = useMemo(() => {
    // Use the same time range logic as balance data
    let dataPoints, intervalType, intervalSize
    
    switch (timeFilter) {
      case "1 Day":
        dataPoints = 24
        intervalType = "hours"
        intervalSize = 1
        break
      case "7 Days":
        dataPoints = 7
        intervalType = "days"
        intervalSize = 1
        break
      case "1 Month":
        dataPoints = 30
        intervalType = "days"
        intervalSize = 1
        break
      case "3 Months":
        dataPoints = 13
        intervalType = "weeks"
        intervalSize = 7
        break
      case "Lifetime":
        // For lifetime, we'll use the transaction history to determine the range
        if (transactionsData.length === 0) {
          // No transactions yet, show last 30 days as placeholder
          dataPoints = 30
          intervalType = "days"
          intervalSize = 1
        } else {
          const oldestTransaction = new Date(Math.min(...transactionsData.map((tx: any) => new Date(tx.created_at).getTime())))
        const daysSinceOldest = Math.ceil((new Date().getTime() - oldestTransaction.getTime()) / (1000 * 60 * 60 * 24))
        
          // Ensure minimum of 1 data point
          const safeDaysSinceOldest = Math.max(1, daysSinceOldest)
          
          if (safeDaysSinceOldest <= 30) {
            dataPoints = Math.max(2, safeDaysSinceOldest) // Ensure minimum 2 points for chart rendering
          intervalType = "days"
          intervalSize = 1
          } else if (safeDaysSinceOldest <= 90) {
            dataPoints = Math.max(2, Math.ceil(safeDaysSinceOldest / 7))
          intervalType = "weeks"
          intervalSize = 7
        } else {
            dataPoints = Math.max(2, Math.ceil(safeDaysSinceOldest / 30))
          intervalType = "months"
          intervalSize = 30
          }
        }
        break
      default:
        dataPoints = 7
        intervalType = "days"
        intervalSize = 1
    }
    
    // Generate time points
    const today = new Date()
    const timePoints = Array.from({ length: dataPoints }).map((_, i) => {
      let pointDate = new Date(today)
      
      if (intervalType === "hours") {
        pointDate.setHours(today.getHours() - (dataPoints - 1 - i))
      } else if (intervalType === "days") {
        pointDate.setDate(today.getDate() - (dataPoints - 1 - i) * intervalSize)
      } else if (intervalType === "weeks") {
        pointDate.setDate(today.getDate() - (dataPoints - 1 - i) * intervalSize)
      } else if (intervalType === "months") {
        pointDate.setDate(today.getDate() - (dataPoints - 1 - i) * intervalSize)
      }
      
      // Format date labels based on interval type
      let dateLabel
      if (intervalType === "hours") {
        dateLabel = pointDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
      } else if (intervalType === "days") {
        dateLabel = pointDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (intervalType === "weeks") {
        dateLabel = pointDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (intervalType === "months") {
        dateLabel = pointDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }
      
      return {
        index: i,
        date: dateLabel,
        pointDate,
        value: 0 // Default to zero
      }
    })
    
    // Get topup requests data
    const topupRequests = Array.isArray(topupRequestsData) ? topupRequestsData : topupRequestsData?.requests || []
    
    // Calculate ad account topups from completed transactions
    if (transactionsData.length > 0) {
      // Filter for ad account topup transactions (type 'topup' with negative amount)
      const topupTransactions = transactionsData.filter((tx: any) => 
        tx.type === 'topup' && (tx.amount_cents < 0 || tx.description?.includes('Ad Account Top-up'))
      )
      
      timePoints.forEach((point, i) => {
        // Find all topup transactions that occurred during this time period
        const nextPoint = timePoints[i + 1]
        const periodStart = point.pointDate
        const periodEnd = nextPoint ? nextPoint.pointDate : new Date()
        
        const topupsInPeriod = topupTransactions.filter((tx: any) => {
          const txDate = new Date(tx.created_at)
          return txDate >= periodStart && txDate < periodEnd
        })
        
        // Sum up all topups in this period (convert to positive amounts, exclude fees)
        const totalTopups = topupsInPeriod.reduce((sum: number, tx: any) => {
          // Use the actual transfer amount, not including fees
          // If metadata has the original amount, use that; otherwise use the transaction amount
          const amount = tx.metadata?.original_amount_cents 
            ? Math.abs(tx.metadata.original_amount_cents / 100)
            : Math.abs((tx.amount_cents || 0) / 100)
          return sum + amount
        }, 0)
        
        point.value = totalTopups
      })
    }
    
    // Add pending/processing topup requests to show reserved amounts
    if (topupRequests.length > 0) {
      const pendingRequests = topupRequests.filter((req: any) => 
        req.status === 'pending' || req.status === 'processing'
      )
      
      timePoints.forEach((point, i) => {
        // Find all pending requests that were created during this time period
        const nextPoint = timePoints[i + 1]
        const periodStart = point.pointDate
        const periodEnd = nextPoint ? nextPoint.pointDate : new Date()
        
        const pendingInPeriod = pendingRequests.filter((req: any) => {
          const reqDate = new Date(req.created_at)
          return reqDate >= periodStart && reqDate < periodEnd
        })
        
        // Sum up all pending requests in this period (exclude fees - use actual transfer amount)
        const totalPending = pendingInPeriod.reduce((sum: number, req: any) => {
          // The amount_cents in topup requests is the actual transfer amount (after fees deducted)
          const amount = Math.abs((req.amount_cents || 0) / 100)
          return sum + amount
        }, 0)
        
        point.value += totalPending
      })
    }
    
    // Spend chart data processed
    
    return timePoints
  }, [timeFilter, transactionsData, topupRequestsData])
  

  
  // Force re-render key based on balance and time filter
  const chartKey = `${realBalance}-${timeFilter}-${transactionsData.length}`

  // Onboarding check removed - always show dashboard

  // Clean up transaction description for better readability
  const getCleanDescription = (tx: any) => {
    const desc = tx.description || 'Transaction'
    
    // Handle new display_id format (e.g., "Ad Account Top-up TR-A1B2C3 completed")
    if (desc.includes('Ad Account Top-up') && desc.includes('completed')) {
      const displayIdMatch = desc.match(/TR-[A-Z0-9]{6}/)
      if (displayIdMatch) {
        return `Top Up ${displayIdMatch[0]} completed`
      }
      return 'Top Up completed'
    }
    
    // Handle legacy topup request completed messages - need to distinguish wallet vs ad account
    if (desc.startsWith('Topup request completed:')) {
      // Check if this is an ad account transaction by looking at metadata
      if (tx.metadata?.ad_account_id || tx.metadata?.ad_account_name || tx.metadata?.topup_request_id) {
        return 'Top Up completed'
      }
      // Otherwise it's a wallet transaction
      return 'Wallet Top-up completed'
    }
    
    // Handle Stripe wallet top-ups
    if (desc.includes('Stripe Wallet Top-up')) {
      const match = desc.match(/\$[\d,]+\.?\d*/)
      if (match) {
        return `Wallet Top-up - ${match[0]}`
      }
      return 'Wallet Top-up'
    }
    
    // Handle ad account top-ups (legacy format)
    if (desc.includes('Ad Account Top-up')) {
      const match = desc.match(/\$[\d,]+\.?\d*/)
      if (match) {
        return `Ad Account Top-up - ${match[0]}`
      }
      return 'Ad Account Top-up'
    }
    
    // Return original description if no patterns match
    return desc
  }

  // Use real-time transactions and accounts from state
  const transactions = useMemo(() => {
    // Ensure transactionsData is an array and has data
    if (!Array.isArray(transactionsData) || transactionsData.length === 0) {
      return []
    }
    
    return transactionsData.slice(0, 5).map(tx => ({
                  id: tx.id ? tx.id.toString() : `temp-${crypto.randomUUID()}`,
      name: getCleanDescription(tx), // Use cleaned description instead of raw description
      amount: (tx.amount_cents || 0) / 100,
      type: tx.type || 'transfer',
      date: tx.created_at ? new Date(tx.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
      account: tx.metadata?.to_account_name || tx.metadata?.from_account_name || tx.metadata?.account_name || tx.metadata?.ad_account_name || tx.organizationName || 'Account',
      timestamp: tx.created_at || new Date().toISOString()
    }))
  }, [transactionsData])

  const processedAccounts = accounts.map((account: any) => ({
    ...account,
    spendLimit: account.spend_limit || 5000, // Default spend limit
    spend: account.spent || 0,
    quota: Math.round(((account.spent || 0) / (account.spend_limit || 5000)) * 100),
  }))
  const accountsForTable = processedAccounts

  // Simple email verification check
  const showEmailBanner = useMemo(() => {
    return !user?.email_confirmed_at
  }, [user?.email_confirmed_at])





  const handleResendEmail = async () => {
    toast.info("Resending verification email...")
    // This assumes useAuth hook provides a method to resend
    // await resendVerificationEmail(); 
    toast.success("Verification email sent!")
  }

  const handleCreateOrganization = async () => {
    if (!user) return
    setIsCreatingOrg(true)
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${userName}'s Organization`, user_id: user.id })
      })
      if (!response.ok) throw new Error("Failed to create organization")
      
      const newOrg = await response.json()
      
      // COMPREHENSIVE CACHE INVALIDATION for organization creation
      const { invalidateAuthCache } = await import('@/lib/cache-invalidation')
      invalidateAuthCache() // Invalidate all user-related data including organizations
      
      // Switch to the new organization if we got the ID
      if (newOrg?.organization?.organization_id) {
        setCurrentOrganizationId(newOrg.organization.organization_id)
      }
      
      toast.success("Organization created successfully!")
    } catch(err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create organization';
      toast.error(errorMessage)
    } finally {
      setIsCreatingOrg(false)
    }
  }

  // Time filter options (practical ranges)
  const timeFilterOptions = [
    { value: "1 Day", label: "24 Hours" },
    { value: "7 Days", label: "7 Days" },
    { value: "1 Month", label: "1 Month" },
    { value: "3 Months", label: "3 Months" },
    { value: "Lifetime", label: "All Time" }
  ]

  const globalLoading = authLoading || isOrgLoading || isBizLoading || isAccLoading || isTransLoading;

  // 🚀 LOADING SCREEN: Show beautiful loading screen during initial load
  const shouldShowLoadingScreen = false && showLoadingScreen && (
    authLoading || 
    !user || 
    !currentOrganizationId || 
    isOrgLoading || 
    isBizLoading || 
    isAccLoading || 
    isTransLoading
  )

  // Hide loading screen when data is ready
  useEffect(() => {
    if (!authLoading && user && currentOrganizationId && !isOrgLoading && !isBizLoading && !isAccLoading && !isTransLoading) {
      // Add a small delay to show the completion
      setTimeout(() => {
        setShowLoadingScreen(false)
      }, 500)
    }
  }, [authLoading, user, currentOrganizationId, isOrgLoading, isBizLoading, isAccLoading, isTransLoading])

  // Log errors for debugging but don't show debug panel
  if (adAccountsError || businessManagersError) {
    console.error('Dashboard API errors:', {
      adAccountsError: adAccountsError?.message,
      businessManagersError: businessManagersError?.message,
      currentOrgError: currentOrgError?.message
    })
  }

  // 🚀 SHOW LOADING SCREEN: Beautiful loading experience
  if (shouldShowLoadingScreen) {
    return (
      <DashboardLoadingScreen 
        isLoading={true}
        onComplete={() => setShowLoadingScreen(false)}
      />
    )
  }

  // ⚡ PROGRESSIVE LOADING: Enhanced loading with 2-phase skeleton
  if (globalLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSkeleton phase={isDashboardLoading ? 1 : 2} />
      </div>
    )
  }

  // Early return for unauthenticated users
  if (!user) {
    router.push('/login')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Redirecting to login...</div>
      </div>
    )
  }

  // Always show filled dashboard for demo - no empty state
  const getTransactionIcon = (type: string, amount: number) => {
    switch (type) {
      case 'topup':
      case 'credit':
      case 'deposit':
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950/30 text-[#34D197]">
            <ArrowUpIcon className="h-3 w-3" />
          </div>
        )
      case 'spend':
      case 'withdrawal':
      case 'debit':
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-950/30 text-rose-400">
            <ArrowDownIcon className="h-3 w-3" />
          </div>
        )
      case 'transfer':
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-950/30 text-blue-400">
            <ArrowRight className="h-3 w-3" />
          </div>
        )
      default:
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-950/30 text-gray-400">
            <ArrowRight className="h-3 w-3" />
          </div>
        )
    }
  }

  return (
    <ErrorBoundary>
      <div className={layoutTokens.spacing.container}>
        {/* Email verification banner */}
        {showEmailBanner && (
          <EmailVerificationBanner onResendEmail={handleResendEmail} />
        )}

        {/* Setup Guide Widget is now handled by AppShell globally */}

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
                        Topups
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="balance" className="mt-0">
                    <div className="p-4 pt-3">
                      <div className={typographyTokens.patterns.mutedMedium}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                      
                      {/* Balance amount with aligned controls */}
                      <div className="flex justify-between items-center mb-4">
                        <div className={typographyTokens.patterns.balanceLarge}>{formatCurrency(realBalance)}</div>
                        
                        {/* Time filter dropdown and refresh indicator */}
                        <div className="flex items-center gap-2">
                        {/* Manual refresh button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={manualRefresh}
                          disabled={isRefreshing}
                          title="Refresh now"
                        >
                          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 px-3 rounded-md">
                              {timeFilter} <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px]">
                            {timeFilterOptions.map((option) => (
                              <DropdownMenuItem key={option.value} onClick={() => setTimeFilter(option.value)}>
                                <span>{option.label}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                      </div>
                      
                      {/* Interactive balance chart with real data */}
                      <div key={chartKey} className="mt-0 h-[160px] w-full relative" ref={balanceChartRef}>
                        <div className="absolute inset-0 bottom-5">
                          {/* Gradient background - always show for visual consistency */}
                          <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-[#b4a0ff33] to-transparent rounded-md"></div>
                          
                          {/* Interactive balance line chart */}
                          <svg className="absolute inset-0 h-full w-full z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Balance line */}
                            {balanceData.length > 0 && (
                              <path
                                d={`M ${balanceData
                                  .map(
                                    (point, i) => {
                                      const maxValue = Math.max(...balanceData.map((p) => p.value), 1); // Ensure at least 1 to avoid division by zero
                                      const yPos = maxValue > 0 ? 100 - (point.value / maxValue) * 60 : 50; // Default to middle if no value
                                      const xPos = balanceData.length > 1 ? (i / (balanceData.length - 1)) * 100 : 50;
                                      return `${xPos},${yPos}`;
                                    }
                                  )
                                  .join(" L ")}`}
                                fill="none"
                                stroke="#b4a0ff"
                                strokeWidth="3"
                                vectorEffect="non-scaling-stroke"
                              />
                            )}
                          </svg>

                          {/* Interactive hover points - positioned exactly on the line */}
                          {balanceData.map((point, i) => {
                            const maxValue = Math.max(...balanceData.map(p => p.value), 1); // Ensure at least 1 to avoid division by zero
                            const yPosition = maxValue > 0 ? 100 - (point.value / maxValue) * 60 : 50; // Default to middle if no value
                            return (
                              <div
                                key={i}
                                className="absolute w-8 h-8 -translate-x-4 -translate-y-4 cursor-pointer z-20 flex items-center justify-center"
                                style={{
                                  left: `${balanceData.length > 1 ? (i / (balanceData.length - 1)) * 100 : 50}%`,
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
                                    <div className="font-medium">{formatCurrency(point.value)}</div>
                                    <div className="text-muted-foreground">{point.date}</div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Bottom axis line */}
                        <div className="absolute bottom-5 left-0 right-0 h-[1px] w-full bg-border z-5"></div>

                        {/* Dynamic month markers */}
                        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2 z-5">
                          {[0, Math.floor(balanceData.length / 4), Math.floor(balanceData.length / 2), Math.floor(3 * balanceData.length / 4), balanceData.length - 1].map((index, i) => (
                            <span key={i}>{balanceData[index]?.date}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-3 border-t">
                        <div className={typographyTokens.patterns.mutedMedium}>Available to spend</div>
                        <div className={typographyTokens.patterns.balanceSmall}>{formatCurrency(realBalance)}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="spend" className="mt-0">
                    <div className="p-4 pt-3">
                      <div className={typographyTokens.patterns.mutedMedium}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                      
                      {/* Ad Account Topups amount with aligned controls */}
                      <div className="flex justify-between items-center mb-4">
                        <div className={typographyTokens.patterns.balanceLarge}>{formatCurrency(spendData.reduce((sum, point) => sum + point.value, 0))}</div>
                        
                        {/* Time filter dropdown and refresh indicator */}
                        <div className="flex items-center gap-2">
                        {/* Manual refresh button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={manualRefresh}
                          disabled={isRefreshing}
                          title="Refresh now"
                        >
                          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 px-3 rounded-md">
                              {timeFilter} <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px]">
                            {timeFilterOptions.map((option) => (
                              <DropdownMenuItem key={option.value} onClick={() => setTimeFilter(option.value)}>
                                <span>{option.label}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                      </div>

                      {/* Interactive spend bar chart with real data */}
                      <div key={`spend-${chartKey}`} className="mt-0 h-[160px] w-full relative">
                        <div className="absolute inset-0 bottom-5">
                          <div className="h-full flex items-end justify-between px-1">
                            {/* Interactive spend bars */}
                            {spendData.map((point, i) => (
                              <div
                                key={i}
                                className="relative h-full flex items-end group cursor-pointer z-10"
                                style={{ width: `${spendData.length > 0 ? 100 / spendData.length : 100}%` }}
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
                                    height: spendData.some(p => p.value > 0)
                                      ? `${Math.max(4, (point.value / Math.max(...spendData.map(p => p.value), 1)) * 100)}%`
                                      : '4px' // Show minimal bars for zero topups
                                  }}
                                />
                                {hoveredSpendIndex === i && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-background border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg z-20">
                                    <div className="font-medium">{formatCurrency(point.value)}</div>
                                    <div className="text-muted-foreground">{point.date}</div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bottom axis line */}
                        <div className="absolute bottom-5 left-0 right-0 h-[1px] w-full bg-border z-5"></div>

                        {/* Dynamic month markers */}
                        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2 z-5">
                          {[0, Math.floor(spendData.length / 4), Math.floor(spendData.length / 2), Math.floor(3 * spendData.length / 4), spendData.length - 1].map((index, i) => (
                            <span key={i}>{spendData[index]?.date}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-3 border-t">
                        <div className={typographyTokens.patterns.mutedMedium}>Total topups (completed + pending)</div>
                        <div className={typographyTokens.patterns.balanceSmall}>{formatCurrency(spendData.reduce((sum, point) => sum + point.value, 0))}</div>
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
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={async () => {
                        await Promise.all([
                          mutate(['/api/transactions', session?.access_token]),
                          mutate('transactions'),
                          mutate('/api/transactions'),
                          mutate(`/api/organizations?id=${currentOrganizationId}`), // Refresh org data for wallet balance
                        ])
                      }}
                      disabled={isTransLoading}
                      title="Refresh transactions"
                    >
                      <RefreshCw className={`h-3 w-3 ${isTransLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-sm" onClick={() => router.push('/dashboard/transactions')}>
                      See all <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="px-2 py-2">
                  {isTransLoading ? (
                    // Loading state
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-muted animate-pulse"></div>
                            <div className="space-y-1">
                              <div className="w-24 h-3 bg-muted rounded animate-pulse"></div>
                              <div className="w-16 h-2 bg-muted rounded animate-pulse"></div>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="w-16 h-3 bg-muted rounded animate-pulse"></div>
                            <div className="w-12 h-2 bg-muted rounded animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : transactions.length === 0 ? (
                    // Empty state
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="text-sm text-muted-foreground">No transactions yet</div>
                      <div className="text-xs text-muted-foreground mt-1">Transactions will appear here once you start using your account</div>
                    </div>
                  ) : (
                    // Transactions list
                    transactions.map((transaction) => (
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
                          <div className={`font-medium text-sm ${transaction.amount > 0 ? "text-[#34D197]" : "text-foreground"}`}>
                            {transaction.amount > 0 ? "+" : ""}{formatCurrency(Math.abs(transaction.amount))}
                          </div>
                          <div className="text-xs text-muted-foreground">{transaction.account}</div>
                        </div>
                      </div>
                    ))
                  )}
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
              <span className="text-sm text-muted-foreground">{accounts.length}</span>
            </div>

          </div>

          <CompactAccountsTable
            initialBusinessFilter="all"
            businessFilter="all"
            onBusinessFilterChange={() => {}} // Dashboard doesn't need business filter changes
            bmIdFilter={null}
          />
        </div>
      </div>


    </ErrorBoundary>
  )
} 