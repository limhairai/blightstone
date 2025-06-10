"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/utils/format"
import { ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"

interface BusinessBalance {
  id: string
  name: string
  symbol: string
  logo: string
  balance: number
  allocationPercent: number
  accounts: number
  bmId: string
  isUnallocated?: boolean
}

export function BusinessBalancesTable() {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(true)

  const totalBalance = 5750.0

  const businesses: BusinessBalance[] = [
    {
      id: "unallocated",
      name: "Unallocated",
      symbol: "UNALLOC",
      logo: "/placeholder.svg?height=32&width=32&text=💰",
      balance: 1000.0,
      allocationPercent: 17.39,
      accounts: 0,
      bmId: "N/A",
      isUnallocated: true,
    },
    {
      id: "1",
      name: "TechFlow Solutions",
      symbol: "TFS",
      logo: "/placeholder.svg?height=32&width=32&text=TF",
      balance: 2800.0,
      allocationPercent: 48.7,
      accounts: 2,
      bmId: "BM-487291",
    },
    {
      id: "2",
      name: "Digital Marketing Co",
      symbol: "DMC",
      logo: "/placeholder.svg?height=32&width=32&text=DM",
      balance: 1200.0,
      allocationPercent: 20.87,
      accounts: 3,
      bmId: "BM-582947",
    },
    {
      id: "3",
      name: "StartupHub Inc",
      symbol: "SHI",
      logo: "/placeholder.svg?height=32&width=32&text=SH",
      balance: 750.0,
      allocationPercent: 13.04,
      accounts: 1,
      bmId: "BM-739284",
    },
  ]

  const handleBusinessClick = (business: BusinessBalance) => {
    if (!business.isUnallocated) {
      router.push(`/dashboard/wallet/business/${business.id}`)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Business balances</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-sm text-muted-foreground font-medium">
            <div className="col-span-6">Asset</div>
            <div className="col-span-3 text-right">Balance</div>
            <div className="col-span-2 text-right">Allocation %</div>
            <div className="col-span-1"></div>
          </div>

          {/* Business Rows */}
          <div className="divide-y divide-border">
            {businesses.map((business) => (
              <div
                key={business.id}
                className={`grid grid-cols-12 gap-4 px-6 py-4 transition-colors ${
                  business.isUnallocated ? "hover:bg-muted/20" : "hover:bg-muted/30 cursor-pointer"
                }`}
                onClick={() => handleBusinessClick(business)}
              >
                {/* Asset Info */}
                <div className="col-span-6 flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={business.logo || "/placeholder.svg"}
                      alt={business.name}
                      className="w-8 h-8 rounded-full"
                    />
                    {business.isUnallocated && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#b4a0ff] rounded-full text-[10px] flex items-center justify-center text-white">
                        💰
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{business.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {business.isUnallocated ? (
                        "Ready for distribution"
                      ) : (
                        <>
                          {business.accounts} account{business.accounts !== 1 ? "s" : ""} • {business.bmId}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Balance */}
                <div className="col-span-3 flex flex-col items-end justify-center">
                  <div className="font-medium text-foreground">${formatCurrency(business.balance)}</div>
                  <div className="text-xs text-muted-foreground">${formatCurrency(business.balance)} USD</div>
                </div>

                {/* Allocation % */}
                <div className="col-span-2 flex items-center justify-end">
                  <div className="font-medium text-foreground">{business.allocationPercent.toFixed(2)}%</div>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
