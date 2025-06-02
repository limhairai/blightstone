"use client"

import { useState, useMemo, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  ChevronDown,
  MoreHorizontal,
  ArrowDownIcon,
  ArrowUpIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/status-badge"
import { StatusDot } from "@/components/status-dot"

export default function DashboardPage() {
  const [timeFilter, setTimeFilter] = useState("3 Months")
  const [activeTab, setActiveTab] = useState("balance")
  const [hoveredSpendIndex, setHoveredSpendIndex] = useState<number | null>(null)
  const [hoveredBalanceIndex, setHoveredBalanceIndex] = useState<number | null>(null)
  const balanceChartRef = useRef<HTMLDivElement>(null)

  // const currentDate = new Date().toLocaleDateString("en-US", { // Not used in current JSX
  //   month: "short",
  //   day: "numeric",
  //   year: "numeric",
  // })

  const userName = "Victor" // This would come from your user context/auth

  const balanceData = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => {
      const baseValue = 10000 + i * 100
      const dayVariation = Math.sin(i * 0.7) * 1500
      const weekVariation = Math.cos(i * 0.2) * 1000
      const trendVariation = i % 7 === 0 ? -800 : i % 5 === 0 ? 1200 : 0
      return {
        index: i,
        date:
          i < 10 ? `Feb ${23 + i}` : i < 25 ? `Mar ${i - 10 + 1}` : i < 40 ? `Apr ${i - 25 + 1}` : `May ${i - 40 + 1}`,
        value: Math.max(8000, Math.round(baseValue + dayVariation + weekVariation + trendVariation)),
      }
    })
  }, [])

  const spendData = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => {
      const dayOfMonth = i % 30
      const monthMultiplier = 1 + Math.floor(i / 20) * 0.2
      let baseValue = 200 + dayOfMonth * 50 * monthMultiplier
      if (dayOfMonth === 15 || dayOfMonth === 28) {
        baseValue *= 2.5
      } else if (dayOfMonth % 7 === 0) {
        baseValue *= 1.7
      } else if (dayOfMonth % 3 === 0) {
        baseValue *= 1.3
      }
      const noise = Math.sin(i * 3.7) * 300 + Math.cos(i * 2.3) * 200
      return {
        index: i,
        date:
          i < 10 ? `Feb ${23 + i}` : i < 25 ? `Mar ${i - 10 + 1}` : i < 40 ? `Apr ${i - 25 + 1}` : `May ${i - 40 + 1}`,
        value: Math.max(100, Math.round(baseValue + noise)),
      }
    })
  }, [])

  const transactions = [
    { id: 1, date: "May 22nd, 2025", name: "Ad Account Top-up", type: "May 22, 10:35 AM", account: "AdHub-Acme-01", amount: -251.77, },
    { id: 2, date: "May 21st, 2025", name: "Ad Account Top-up", type: "May 21, 02:15 PM", account: "AdHub-Acme-02", amount: -531.45, },
    { id: 3, date: "May 20th, 2025", name: "Ad Account Top-up", type: "May 20, 09:00 AM", account: "AdHub-Acme-03", amount: -213.52, },
    { id: 4, date: "May 19th, 2025", name: "Wallet Deposit", type: "May 19, 05:45 PM", account: "Main Wallet", amount: 1025.15, },
    { id: 5, date: "May 18th, 2025", name: "Ad Campaign Spend", type: "May 18, 11:20 AM", account: "AdHub-Acme-01", amount: -146.96, },
  ]

  const accounts = [
    { id: "AHAC01", name: "AdHub-Acme-01", project: "Acme Spring Promo", adAccount: "act_acme111", status: "Active", balance: "$1,250.00", spendLimit: "$2,000.00", dateAdded: "04/15/2025", quota: 63, partner: "Meta" },
    { id: "AHAC02", name: "AdHub-Acme-02", project: "Acme Summer Blast", adAccount: "act_acme222", status: "Active", balance: "$3,750.00", spendLimit: "$5,000.00", dateAdded: "04/10/2025", quota: 75, partner: "Meta" },
    { id: "AHAC03", name: "AdHub-Acme-03", project: "Acme Q3 Push", adAccount: "act_acme333", status: "Pending", balance: "$0.00", spendLimit: "$1,500.00", dateAdded: "04/18/2025", quota: 0, partner: "Meta" },
  ]

  const chartHoverBalance = hoveredBalanceIndex !== null 
    ? balanceData[hoveredBalanceIndex].value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "15,018.35"

  // Static value for "Available to spend"
  const currentAvailableToSpend = "15,018.35"

  return (
    // This component doesn't use AppShell directly, 
    // it expects to be rendered INSIDE an AppShell provided by a layout file for /dashboard route group
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold">Good evening, {userName}</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-border">
            <CardContent className="p-0">
              <Tabs defaultValue="balance" className="w-full" onValueChange={setActiveTab}>
                <div className="border-b px-6 pt-6">
                  <TabsList className="bg-transparent p-0 h-auto mb-2">
                    <TabsTrigger value="balance" className="text-sm data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-[#b4a0ff] data-[state=active]:shadow-none rounded-none px-2 py-1 h-8">
                      <ArrowUpRight className="mr-2 h-4 w-4 text-[#b4a0ff]" />
                      Balance
                    </TabsTrigger>
                    <TabsTrigger value="spend" className="text-sm data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-[#b4a0ff] data-[state=active]:shadow-none rounded-none px-2 py-1 h-8">
                      <CreditCard className="mr-2 h-4 w-4 text-[#b4a0ff]" />
                      Account Spend
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="balance" className="mt-0">
                  <div className="p-6 pt-4">
                    <div className="text-sm text-muted-foreground">
                      {hoveredBalanceIndex !== null ? balanceData[hoveredBalanceIndex].date : "May 22, 2025"}
                    </div>
                    <div className="text-4xl font-bold mt-1">
                      ${chartHoverBalance}
                    </div>
                    <div className="flex justify-end mb-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 px-3 rounded-md">
                            {timeFilter} <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                          <DropdownMenuItem onClick={() => setTimeFilter("1 Week")} className="flex justify-between"><span>1 Week</span><span className="text-xs bg-muted px-1.5 rounded">1</span></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTimeFilter("1 Month")} className="flex justify-between"><span>1 Month</span><span className="text-xs bg-muted px-1.5 rounded">2</span></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTimeFilter("3 Months")} className="flex justify-between"><span>3 Months</span><span className="text-xs bg-muted px-1.5 rounded">3</span></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTimeFilter("1 Year")} className="flex justify-between"><span>1 Year</span><span className="text-xs bg-muted px-1.5 rounded">4</span></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTimeFilter("This Week")} className="flex justify-between"><span>This Week</span><span className="text-xs bg-muted px-1.5 rounded">5</span></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2 h-[180px] w-full relative" ref={balanceChartRef}>
                      <div className="absolute inset-0 bottom-6">
                        <div className="absolute bottom-0 left-0 right-0 h-[100px] bg-gradient-to-t from-[#b4a0ff33] to-transparent rounded-md"></div>
                        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs><linearGradient id="balanceLineGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#b4a0ff" /><stop offset="100%" stopColor="#ffb4a0" /></linearGradient></defs>
                          <path d={`M 0,${100 - (balanceData[0].value / Math.max(...balanceData.map((d) => d.value))) * 100} ${balanceData.map((point, i) => { const x = (i / (balanceData.length - 1)) * 100; const y = 100 - (point.value / Math.max(...balanceData.map((d) => d.value))) * 100; return `L ${x},${y}` }).join(" ")}`} fill="none" stroke="url(#balanceLineGradient)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                        </svg>
                        {hoveredBalanceIndex !== null && (
                          <div className="absolute pointer-events-none" style={{ left: `${(hoveredBalanceIndex / (balanceData.length - 1)) * 100}%`, top: `${100 - (balanceData[hoveredBalanceIndex].value / Math.max(...balanceData.map((d) => d.value))) * 100}%`, transform: "translate(-50%, -50%)", }}>
                            <div className="w-3 h-3 rounded-full bg-[#b4a0ff] flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-white"></div></div>
                          </div>
                        )}
                        <div className="absolute inset-0 flex">
                          {balanceData.map((point, i) => (<div key={i} className="h-full flex-1" onMouseEnter={() => setHoveredBalanceIndex(i)} onMouseLeave={() => setHoveredBalanceIndex(null)} style={{ cursor: "pointer" }} />))}
                        </div>
                      </div>
                      <div className="absolute bottom-6 left-0 right-0 h-[1px] w-full bg-border"></div>
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2">
                        <span>Feb 23</span><span>Mar 10</span><span>Mar 25</span><span>Apr 09</span><span>Apr 24</span><span>May 09</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">Available to spend</div>
                      <div className="text-lg font-semibold">${currentAvailableToSpend}</div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="spend" className="mt-0">
                  <div className="p-6 pt-4">
                    <div className="text-sm text-muted-foreground">
                      {hoveredSpendIndex !== null ? spendData[hoveredSpendIndex].date : "May 22, 2025"}
                    </div>
                    <div className="text-4xl font-bold mt-1">
                      ${
                        hoveredSpendIndex !== null
                          ? spendData[hoveredSpendIndex].value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2, })
                          : "12,450.00"
                      }
                    </div>
                    <div className="flex justify-end mb-2">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 px-3 rounded-md">
                            {timeFilter} <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                          <DropdownMenuItem onClick={() => setTimeFilter("1 Week")} className="flex justify-between"><span>1 Week</span><span className="text-xs bg-muted px-1.5 rounded">1</span></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTimeFilter("1 Month")} className="flex justify-between"><span>1 Month</span><span className="text-xs bg-muted px-1.5 rounded">2</span></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTimeFilter("3 Months")} className="flex justify-between"><span>3 Months</span><span className="text-xs bg-muted px-1.5 rounded">3</span></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTimeFilter("1 Year")} className="flex justify-between"><span>1 Year</span><span className="text-xs bg-muted px-1.5 rounded">4</span></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTimeFilter("This Week")} className="flex justify-between"><span>This Week</span><span className="text-xs bg-muted px-1.5 rounded">5</span></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2 h-[180px] w-full relative">
                      <div className="absolute inset-0 bottom-6">
                        <div className="h-full flex items-end justify-between px-1">
                          {spendData.map((item, i) => {
                            const maxValue = Math.max(...spendData.map((d) => d.value))
                            const height = `${(item.value / maxValue) * 100}%`
                            return (
                              <div key={i} className="relative h-full flex items-end group" style={{ width: `${100 / spendData.length}%` }} onMouseEnter={() => setHoveredSpendIndex(i)} onMouseLeave={() => setHoveredSpendIndex(null)}>
                                <div className={`w-[60%] mx-auto rounded-sm transition-colors ${hoveredSpendIndex === i ? "bg-[#b4a0ff]" : "bg-muted-foreground/30"}`} style={{ height: height, minHeight: "4px", }} />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      <div className="absolute bottom-6 left-0 right-0 h-[1px] w-full bg-border"></div>
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2">
                        <span>Feb 23</span><span>Mar 10</span><span>Mar 25</span><span>Apr 09</span><span>Apr 24</span><span>May 09</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">Available to spend</div>
                      <div className="text-lg font-semibold">${currentAvailableToSpend}</div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-border h-full">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="font-semibold">Transactions</h3>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-sm">
                  See all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <div className="px-2 py-2">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 rounded-md">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const getTransactionIcon = (transactionName: string, amount: number) => {
                          if (transactionName.includes("Deposit")) {
                            return (<div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-950/30 text-[#34D197]"><ArrowDownIcon className="h-4 w-4" /></div>)
                          } else {
                            return (<div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-950/30 text-[#F56565]"><ArrowUpIcon className="h-4 w-4" /></div>)
                          }
                        }
                        return getTransactionIcon(transaction.name, transaction.amount)
                      })()}
                      <div>
                        <div className="font-medium text-sm">{transaction.name}</div>
                        <div className="text-xs text-muted-foreground">{transaction.type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${transaction.amount > 0 ? "text-[#34D197]" : ""}`}>
                        {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
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

      <div className="mt-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Accounts</h2>
            <span className="text-sm text-muted-foreground">3 / 8</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0">
              Request Account
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              See all accounts <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="rounded-md border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">NAME</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">PROJECT</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">AD ACCOUNT</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">STATUS</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">BALANCE</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">SPEND LIMIT</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">DATE ADDED</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">QUOTA</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b">
                  <td className="p-4 align-middle">
                    <div>
                      <div className="font-medium">{account.name}</div>
                      <div className="text-xs text-muted-foreground">{account.id}</div>
                    </div>
                  </td>
                  <td className="p-4 align-middle">{account.project}</td>
                  <td className="p-4 align-middle">{account.adAccount}</td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      <StatusDot status={account.status.toLowerCase() as any} />
                      <StatusBadge status={account.status.toLowerCase() as any} size="sm" />
                    </div>
                  </td>
                  <td className="p-4 align-middle font-medium">{account.balance}</td>
                  <td className="p-4 align-middle">{account.spendLimit}</td>
                  <td className="p-4 align-middle text-muted-foreground">{account.dateAdded}</td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      <div className="relative h-6 w-6">
                        <svg viewBox="0 0 100 100" className="h-6 w-6">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted-foreground/20" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray={`${account.quota * 2.51} 251`} strokeDashoffset="0" className={`${account.quota > 80 ? "text-[#F56565]" : account.quota > 60 ? "text-[#FFC857]" : account.quota > 0 ? "text-[#34D197]" : "text-gray-400"}`} transform="rotate(-90 50 50)" />
                        </svg>
                      </div>
                      <span>{account.quota}%</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Account</DropdownMenuItem>
                        <DropdownMenuItem>Top Up</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500">Delete Account</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 