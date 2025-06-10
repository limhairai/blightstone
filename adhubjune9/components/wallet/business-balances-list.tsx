"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/utils/format"
import { Search, Filter, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface BusinessBalance {
  id: string
  name: string
  logo: string
  allocated: number
  spent: number
  remaining: number
  accounts: number
  monthlySpend: number
  change24h: number
  change7d: number
  status: "active" | "warning" | "critical"
  utilization: number
}

export function BusinessBalancesList() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"allocated" | "remaining" | "change24h">("allocated")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const businesses: BusinessBalance[] = [
    {
      id: "1",
      name: "TechFlow Solutions",
      logo: "/placeholder.svg?height=32&width=32&text=TF",
      allocated: 2800.0,
      spent: 1850.0,
      remaining: 950.0,
      accounts: 2,
      monthlySpend: 1250.0,
      change24h: 2.4,
      change7d: 15.2,
      status: "active",
      utilization: 66,
    },
    {
      id: "2",
      name: "Digital Marketing Co",
      logo: "/placeholder.svg?height=32&width=32&text=DM",
      allocated: 1200.0,
      spent: 980.0,
      remaining: 220.0,
      accounts: 2,
      monthlySpend: 890.0,
      change24h: -1.2,
      change7d: -8.5,
      status: "warning",
      utilization: 82,
    },
    {
      id: "3",
      name: "StartupHub Inc",
      logo: "/placeholder.svg?height=32&width=32&text=SH",
      allocated: 750.0,
      spent: 680.0,
      remaining: 70.0,
      accounts: 1,
      monthlySpend: 420.0,
      change24h: 5.8,
      change7d: 22.1,
      status: "critical",
      utilization: 91,
    },
    {
      id: "4",
      name: "E-commerce Plus",
      logo: "/placeholder.svg?height=32&width=32&text=EP",
      allocated: 500.0,
      spent: 320.0,
      remaining: 180.0,
      accounts: 1,
      monthlySpend: 280.0,
      change24h: 0.8,
      change7d: 4.2,
      status: "active",
      utilization: 64,
    },
  ]

  const filteredBusinesses = businesses
    .filter((business) => business.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]
      return sortOrder === "desc" ? bValue - aValue : aValue - bValue
    })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-950/50 text-emerald-400 border-emerald-700 text-xs">Healthy</Badge>
      case "warning":
        return <Badge className="bg-yellow-950/50 text-yellow-400 border-yellow-700 text-xs">Low Funds</Badge>
      case "critical":
        return <Badge className="bg-red-950/50 text-red-400 border-red-700 text-xs">Critical</Badge>
      default:
        return null
    }
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return "bg-red-500"
    if (utilization >= 75) return "bg-yellow-500"
    return "bg-emerald-500"
  }

  const handleBusinessClick = (businessId: string) => {
    router.push(`/dashboard/wallet/business/${businessId}`)
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Business Balances</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-background border-border"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-border">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSort("allocated")}>Sort by Allocated</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("remaining")}>Sort by Remaining</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("change24h")}>Sort by 24h Change</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-sm text-muted-foreground font-medium">
          <div className="col-span-3">#</div>
          <div
            className="col-span-2 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => handleSort("allocated")}
          >
            <div className="flex items-center gap-1">
              Allocated
              <ArrowUpDown className="h-3 w-3" />
            </div>
          </div>
          <div
            className="col-span-2 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => handleSort("remaining")}
          >
            <div className="flex items-center gap-1">
              Remaining
              <ArrowUpDown className="h-3 w-3" />
            </div>
          </div>
          <div className="col-span-1 text-center">Accounts</div>
          <div
            className="col-span-2 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => handleSort("change24h")}
          >
            <div className="flex items-center gap-1">
              24h Change
              <ArrowUpDown className="h-3 w-3" />
            </div>
          </div>
          <div className="col-span-2">Utilization</div>
        </div>

        {/* Business Rows */}
        <div className="divide-y divide-border">
          {filteredBusinesses.map((business, index) => (
            <div
              key={business.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/30 cursor-pointer transition-colors group"
              onClick={() => handleBusinessClick(business.id)}
            >
              {/* Business Info */}
              <div className="col-span-3 flex items-center gap-3">
                <span className="text-muted-foreground text-sm w-4">{index + 1}</span>
                <img src={business.logo || "/placeholder.svg"} alt={business.name} className="w-8 h-8 rounded-full" />
                <div>
                  <div className="font-medium text-foreground">{business.name}</div>
                  <div className="flex items-center gap-2">{getStatusBadge(business.status)}</div>
                </div>
              </div>

              {/* Allocated */}
              <div className="col-span-2 flex items-center">
                <div>
                  <div className="font-medium text-foreground">${formatCurrency(business.allocated)}</div>
                  <div className="text-xs text-muted-foreground">Total allocated</div>
                </div>
              </div>

              {/* Remaining */}
              <div className="col-span-2 flex items-center">
                <div>
                  <div
                    className={cn(
                      "font-medium",
                      business.status === "critical"
                        ? "text-red-400"
                        : business.status === "warning"
                          ? "text-yellow-400"
                          : "text-emerald-400",
                    )}
                  >
                    ${formatCurrency(business.remaining)}
                  </div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
              </div>

              {/* Accounts */}
              <div className="col-span-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-medium text-foreground">{business.accounts}</div>
                  <div className="text-xs text-muted-foreground">accounts</div>
                </div>
              </div>

              {/* 24h Change */}
              <div className="col-span-2 flex items-center">
                <div
                  className={cn(
                    "flex items-center gap-1 font-medium",
                    business.change24h > 0 ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {business.change24h > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {business.change24h > 0 ? "+" : ""}
                  {business.change24h.toFixed(1)}%
                </div>
              </div>

              {/* Utilization */}
              <div className="col-span-2 flex items-center">
                <div className="w-full">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{business.utilization}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={cn("h-2 rounded-full transition-all", getUtilizationColor(business.utilization))}
                      style={{ width: `${business.utilization}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredBusinesses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">No businesses found matching your search.</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
