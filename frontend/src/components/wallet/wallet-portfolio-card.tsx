"use client"

import { useState, useMemo } from "react"
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { formatCurrency } from "../../utils/format"
import { TrendingDown, TrendingUp, Wallet, RefreshCw, ChevronDown } from "lucide-react"
import { Skeleton } from "../ui/skeleton"
import { useCurrentOrganization, useTransactions } from '@/lib/swr-config'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"

interface WalletPortfolioCardProps {
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function WalletPortfolioCard({ onRefresh, isRefreshing = false }: WalletPortfolioCardProps) {
  const { currentOrganizationId } = useOrganizationStore()
  const [timeFilter, setTimeFilter] = useState("7 Days")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Use optimized hooks instead of direct SWR calls
  const { data, error, isLoading } = useCurrentOrganization(currentOrganizationId);
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions({});

  const organization = data?.organizations?.[0];
  const totalBalance = (organization?.balance_cents ?? 0) / 100;
  const reservedBalance = (organization?.reserved_balance_cents ?? 0) / 100;
  const transactions = transactionsData?.transactions || [];
  
  // Consider the component loading if either data source is loading OR if we have no organization data yet
  const isDataLoading = isLoading || transactionsLoading || !organization;
  
  // REAL performance calculation based on actual transaction history
  const performanceData = useMemo(() => {
    if (!organization || !transactions.length) {
      return { changeAmount: 0, changePercentage: 0, hasRealData: false };
    }

    // Calculate time boundary based on selected filter
    const now = new Date();
    const timeMap = {
      "7 Days": 7,
      "1 Month": 30,
      "3 Months": 90,
      "1 Year": 365
    };
    
    const daysBack = timeMap[timeFilter as keyof typeof timeMap] || 7;
    const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    // Filter transactions within the time period
    const periodTransactions = transactions.filter((tx: any) => {
      const txDate = new Date(tx.created_at);
      return txDate >= cutoffDate;
    });
    
    if (!periodTransactions.length) {
      return { changeAmount: 0, changePercentage: 0, hasRealData: false };
    }
    
    // Calculate net change from transactions in period
    const netChange = periodTransactions.reduce((sum: any, tx: any) => {
      const amount = tx.amount_cents / 100; // Convert to dollars
      return sum + amount; // Positive = money in, negative = money out
    }, 0);
    
    // Calculate percentage change
    const balanceAtStartOfPeriod = totalBalance - netChange;
    const changePercentage = balanceAtStartOfPeriod > 0 
      ? (netChange / balanceAtStartOfPeriod) * 100 
      : 0;
    
    return {
      changeAmount: netChange,
      changePercentage: changePercentage,
      hasRealData: true
    };
  }, [transactions, timeFilter, totalBalance, organization]);

  const { changeAmount, changePercentage, hasRealData } = performanceData;

  // Generate REAL balance data based on actual transaction history
  const balanceData = useMemo(() => {
    // Don't calculate chart data if we don't have organization data yet
    if (!organization) {
      return [];
    }
    
    // Use the same time range logic as dashboard
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
        if (transactions.length === 0) {
          // No transactions yet, show last 30 days as placeholder
          dataPoints = 30
          intervalType = "days"
          intervalSize = 1
        } else {
          const oldestTransaction = new Date(Math.min(...transactions.map((tx: any) => new Date(tx.created_at).getTime())))
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
    
    // If we have meaningful transaction history, calculate historical balance
    if (transactions.length > 0) {
      timePoints.forEach((point, i) => {
        // For each point, calculate balance by working backwards from current balance
        const transactionsAfterPoint = transactions.filter((tx: any) => {
          const txDate = new Date(tx.created_at);
          return txDate > point.pointDate;
        });
        
        // Current balance minus all transactions that happened after this point
        const balanceAtPoint = transactionsAfterPoint.reduce((balance: any, tx: any) => {
          return balance - (tx.amount_cents / 100); // Subtract future transactions
        }, totalBalance);
        
        point.value = Math.max(0, balanceAtPoint); // Ensure non-negative
      });
    } else {
      // For new accounts with no transaction history, show flat line at current balance
      timePoints.forEach((point, i) => {
        point.value = totalBalance;
      });
    }
    
    // Wallet chart data processed
    
    return timePoints
  }, [totalBalance, timeFilter, transactions, organization])

  // Time filter options (practical ranges)
  const timeFilterOptions = [
    { value: "1 Day", label: "24 Hours" },
    { value: "7 Days", label: "7 Days" },
    { value: "1 Month", label: "1 Month" },
    { value: "3 Months", label: "3 Months" },
    { value: "Lifetime", label: "All Time" }
  ]
  
  if (isDataLoading) {
    return (
      <Card className="flex-1">
        <CardContent className="p-6">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-10 w-1/2 mb-4" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) return <div>Failed to load wallet data.</div>

  const isPositive = changePercentage >= 0

  return (
    <Card className="bg-gradient-to-br from-card to-card/80 border-border overflow-hidden flex-1">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-foreground">
                {organization?.name || 'Wallet Portfolio'}
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground">
                    {timeFilter}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {timeFilterOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setTimeFilter(option.value)}
                      className={timeFilter === option.value ? "bg-accent" : ""}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(totalBalance)}</div>
            <div className="flex items-center gap-1 mt-1">
              {hasRealData ? (
                <>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                  <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(Math.abs(changeAmount))} ({isPositive ? '+' : ''}{changePercentage.toFixed(1)}%) {timeFilter.toLowerCase()}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No transaction history yet
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        {/* Balance Chart */}
        <div className="h-48 w-full relative">
          {!isDataLoading ? (
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
                </pattern>
                <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="balanceFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />

            {/* Balance line */}
            {balanceData.length > 0 && (
              <>
                <path
                  d={`M ${balanceData
                    .map(
                      (point, i) => {
                        const maxValue = Math.max(...balanceData.map((p) => p.value), 1); // Ensure at least 1 to avoid division by zero
                        const minValue = Math.min(...balanceData.map((p) => p.value), 0);
                        const range = maxValue - minValue;
                        
                        // Better Y positioning with proper scaling
                        let yPos;
                        if (range > 0) {
                          yPos = 100 - ((point.value - minValue) / range) * 80;
                        } else {
                          // If all values are the same, show line in middle
                          yPos = 50;
                        }
                        
                        return `${(i / Math.max(balanceData.length - 1, 1)) * 100},${yPos}`;
                      }
                    )
                    .join(" L ")}`}
                  fill="none"
                  stroke="url(#balanceGradient)"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />

                {/* Gradient fill */}
                <path
                  d={`M ${balanceData
                    .map(
                      (point, i) => {
                        const maxValue = Math.max(...balanceData.map((p) => p.value), 1); // Ensure at least 1 to avoid division by zero
                        const minValue = Math.min(...balanceData.map((p) => p.value), 0);
                        const range = maxValue - minValue;
                        
                        // Better Y positioning with proper scaling
                        let yPos;
                        if (range > 0) {
                          yPos = 100 - ((point.value - minValue) / range) * 80;
                        } else {
                          // If all values are the same, show line in middle
                          yPos = 50;
                        }
                        
                        return `${(i / Math.max(balanceData.length - 1, 1)) * 100},${yPos}`;
                      }
                    )
                    .join(" L ")} L 100,100 L 0,100 Z`}
                  fill="url(#balanceFill)"
                />
              </>
            )}

            {/* Invisible hover areas */}
            {balanceData.map((point, i) => {
              const maxValue = Math.max(...balanceData.map((p) => p.value), 1); // Ensure at least 1 to avoid division by zero
              const minValue = Math.min(...balanceData.map((p) => p.value), 0);
              const range = maxValue - minValue;
              
              // Better Y positioning with proper scaling
              let yPos;
              if (range > 0) {
                yPos = 100 - ((point.value - minValue) / range) * 80;
              } else {
                // If all values are the same, show line in middle
                yPos = 50;
              }
                              return (
                  <circle
                    key={`hover-${i}`}
                    cx={(i / Math.max(balanceData.length - 1, 1)) * 100}
                  cy={yPos}
                  r="3"
                  fill="transparent"
                  vectorEffect="non-scaling-stroke"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
            </svg>
          ) : (
            <div className="absolute inset-0 h-full w-full flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          )}

          {/* Hover dot - positioned outside SVG to maintain circular shape */}
          {!isDataLoading && hoveredIndex !== null && (
            <div
              className="absolute w-3 h-3 rounded-full bg-primary border-2 border-background pointer-events-none z-10 transition-all duration-200"
              style={{
                left: `${(hoveredIndex / Math.max(balanceData.length - 1, 1)) * 100}%`,
                top: `${(() => {
                  const maxValue = Math.max(...balanceData.map((p) => p.value), 1);
                  return maxValue > 0 ? 100 - (balanceData[hoveredIndex].value / maxValue) * 80 : 50;
                })()}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          )}

          {/* Hover tooltip */}
          {!isDataLoading && hoveredIndex !== null && (
            <div
              className="absolute bg-popover border border-border rounded-md px-2 py-1 text-xs shadow-lg pointer-events-none z-20"
              style={{
                left: `${(hoveredIndex / Math.max(balanceData.length - 1, 1)) * 100}%`,
                top: `${(() => {
                  const maxValue = Math.max(...balanceData.map((p) => p.value), 1);
                  return maxValue > 0 ? 100 - (balanceData[hoveredIndex].value / maxValue) * 80 : 50;
                })()}%`,
                transform: "translate(-50%, -100%)",
                marginTop: "-8px",
              }}
            >
              <div className="font-medium">{formatCurrency(balanceData[hoveredIndex].value)}</div>
              <div className="text-muted-foreground">{balanceData[hoveredIndex].date}</div>
            </div>
          )}
        </div>

        {/* Additional wallet info */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Balance</span>
            <span className="text-sm font-medium text-foreground">{formatCurrency(totalBalance)}</span>
          </div>
          {reservedBalance > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Processing</span>
              <span className="text-sm font-medium text-orange-400">
                -{formatCurrency(reservedBalance)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 