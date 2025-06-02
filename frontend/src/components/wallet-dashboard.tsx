"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BalanceCard } from "@/components/balance-card"
import { AddFundsDialog } from "@/components/add-funds-dialog"
import { ConsolidateFundsDialog } from "@/components/consolidate-funds-dialog"
import { DistributeFundsDialog } from "@/components/distribute-funds-dialog"
import { ArrowUpDown, ArrowDownUp, ArrowDown, ArrowUp, Plus, Filter, Download } from "lucide-react"

export function WalletDashboard() {
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [consolidateOpen, setConsolidateOpen] = useState(false)
  const [distributeOpen, setDistributeOpen] = useState(false)

  // Wallet balance - ensure this is passed to BalanceCard
  const walletBalance = 5750.0

  // Get status dot color
  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-[#34D197]"
      case "pending":
        return "bg-[#FFC857]"
      case "failed":
        return "bg-[#F56565]"
      default:
        return "bg-gray-500"
    }
  }

  // Get amount color - mint green for credits, white for debits
  const getAmountColor = (amount: number) => {
    return amount > 0 ? "text-[#34D197]" : "text-foreground"
  }

  // Get transaction icon based on type
  const getTransactionIcon = (type: string, amount: number) => {
    switch (type) {
      case "deposit":
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-950/30 text-[#34D197]">
            <ArrowDown className="h-4 w-4" />
          </div>
        )
      case "withdrawal":
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-950/30 text-[#F56565]">
            <ArrowUp className="h-4 w-4" />
          </div>
        )
      case "transfer":
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-950/30 text-blue-400">
            {amount > 0 ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Removed title and subtitle completely */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-card dark:bg-[#0A0A0A] border-border dark:border-[#222222]">
          <CardHeader className="pb-2">
            <CardTitle>Balance</CardTitle>
            <CardDescription>Your current wallet balance</CardDescription>
          </CardHeader>
          <CardContent>
            <BalanceCard balance={walletBalance} />
            <div className="flex flex-wrap gap-3 mt-6">
              <Button
                onClick={() => setAddFundsOpen(true)}
                className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Funds
              </Button>
              <Button
                variant="outline"
                onClick={() => setConsolidateOpen(true)}
                className="border-border dark:border-[#222222] bg-background/50 dark:bg-[#0A0A0A]/50"
              >
                <ArrowDownUp className="mr-2 h-4 w-4" /> Consolidate
              </Button>
              <Button
                variant="outline"
                onClick={() => setDistributeOpen(true)}
                className="border-border dark:border-[#222222] bg-background/50 dark:bg-[#0A0A0A]/50"
              >
                <ArrowUpDown className="mr-2 h-4 w-4" /> Distribute
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-[#0A0A0A] border-border dark:border-[#222222]">
          <CardHeader className="pb-2">
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Overview of your wallet activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Total Accounts</div>
              <div className="font-medium">12</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Active Accounts</div>
              <div className="font-medium">8</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Pending Transactions</div>
              <div className="font-medium">3</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Monthly Spend</div>
              <div className="font-medium">$2,450.00</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card dark:bg-[#0A0A0A] border-border dark:border-[#222222]">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Recent activity in your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent">
            <TabsList className="bg-muted dark:bg-[#111111]">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="all">All Transactions</TabsTrigger>
            </TabsList>
            <TabsContent value="recent" className="mt-4">
              <Card className="bg-card dark:bg-[#0A0A0A] border-border dark:border-[#1A1A1A] overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4 border-b border-border dark:border-[#1A1A1A]">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 bg-background/50 dark:bg-[#0A0A0A] border-border dark:border-[#1A1A1A] hover:bg-muted dark:hover:bg-[#1A1A1A]"
                      >
                        <Filter className="h-3.5 w-3.5 mr-2" />
                        Filter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 bg-background/50 dark:bg-[#0A0A0A] border-border dark:border-[#1A1A1A] hover:bg-muted dark:hover:bg-[#1A1A1A]"
                      >
                        All Time
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 bg-background/50 dark:bg-[#0A0A0A] border-border dark:border-[#1A1A1A] hover:bg-muted dark:hover:bg-[#1A1A1A]"
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      Export
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border dark:border-[#1A1A1A] bg-muted/50 dark:bg-secondary/10">
                          <th className="text-left p-4 text-xs font-medium text-muted-foreground"></th>
                          <th className="text-left p-4 text-xs font-medium text-muted-foreground">Transaction</th>
                          <th className="text-right p-4 text-xs font-medium text-muted-foreground">Amount</th>
                          <th className="text-right p-4 text-xs font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border dark:border-[#1A1A1A] hover:bg-muted/50 dark:hover:bg-secondary/5">
                          <td className="pl-4 py-3 w-10">{getTransactionIcon("deposit", 500)}</td>
                          <td className="py-3 text-sm">
                            <div className="font-medium">Top up - Credit Card</div>
                            <div className="text-xs text-muted-foreground">Apr 28, 2025</div>
                          </td>
                          <td className="p-3 text-sm text-right">
                            <span className="text-[#34D197]">+$500.00</span>
                          </td>
                          <td className="p-3 text-sm text-right text-muted-foreground">
                            <div className="flex items-center justify-end gap-2">
                              <span>Completed</span>
                              <div className="w-2 h-2 rounded-full bg-[#34D197]"></div>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-border dark:border-[#1A1A1A] hover:bg-muted/50 dark:hover:bg-secondary/5">
                          <td className="pl-4 py-3 w-10">{getTransactionIcon("withdrawal", -120.5)}</td>
                          <td className="py-3 text-sm">
                            <div className="font-medium">Ad Account Spend</div>
                            <div className="text-xs text-muted-foreground">Apr 25, 2025</div>
                          </td>
                          <td className="p-3 text-sm text-right">
                            <span className="text-foreground">-$120.50</span>
                          </td>
                          <td className="p-3 text-sm text-right text-muted-foreground">
                            <div className="flex items-center justify-end gap-2">
                              <span>Completed</span>
                              <div className="w-2 h-2 rounded-full bg-[#34D197]"></div>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-border dark:border-[#1A1A1A] hover:bg-muted/50 dark:hover:bg-secondary/5">
                          <td className="pl-4 py-3 w-10">{getTransactionIcon("deposit", 1000)}</td>
                          <td className="py-3 text-sm">
                            <div className="font-medium">Top up - Bank Transfer</div>
                            <div className="text-xs text-muted-foreground">Apr 22, 2025</div>
                          </td>
                          <td className="p-3 text-sm text-right">
                            <span className="text-[#34D197]">+$1000.00</span>
                          </td>
                          <td className="p-3 text-sm text-right text-muted-foreground">
                            <div className="flex items-center justify-end gap-2">
                              <span>Pending</span>
                              <div className="w-2 h-2 rounded-full bg-[#FFC857]"></div>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-border dark:border-[#1A1A1A] hover:bg-muted/50 dark:hover:bg-secondary/5">
                          <td className="pl-4 py-3 w-10">{getTransactionIcon("withdrawal", -85.75)}</td>
                          <td className="py-3 text-sm">
                            <div className="font-medium">Ad Account Spend</div>
                            <div className="text-xs text-muted-foreground">Apr 20, 2025</div>
                          </td>
                          <td className="p-3 text-sm text-right">
                            <span className="text-foreground">-$85.75</span>
                          </td>
                          <td className="p-3 text-sm text-right text-muted-foreground">
                            <div className="flex items-center justify-end gap-2">
                              <span>Completed</span>
                              <div className="w-2 h-2 rounded-full bg-[#34D197]"></div>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-border dark:border-[#1A1A1A] hover:bg-muted/50 dark:hover:bg-secondary/5">
                          <td className="pl-4 py-3 w-10">{getTransactionIcon("deposit", 750)}</td>
                          <td className="py-3 text-sm">
                            <div className="font-medium">Top up - Credit Card</div>
                            <div className="text-xs text-muted-foreground">Apr 18, 2025</div>
                          </td>
                          <td className="p-3 text-sm text-right">
                            <span className="text-[#34D197]">+$750.00</span>
                          </td>
                          <td className="p-3 text-sm text-right text-muted-foreground">
                            <div className="flex items-center justify-end gap-2">
                              <span>Completed</span>
                              <div className="w-2 h-2 rounded-full bg-[#34D197]"></div>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-border dark:border-[#1A1A1A] last:border-0 hover:bg-muted/50 dark:hover:bg-secondary/5">
                          <td className="pl-4 py-3 w-10">{getTransactionIcon("withdrawal", -210.25)}</td>
                          <td className="py-3 text-sm">
                            <div className="font-medium">Ad Account Spend</div>
                            <div className="text-xs text-muted-foreground">Apr 15, 2025</div>
                          </td>
                          <td className="p-3 text-sm text-right">
                            <span className="text-foreground">-$210.25</span>
                          </td>
                          <td className="p-3 text-sm text-right text-muted-foreground">
                            <div className="flex items-center justify-end gap-2">
                              <span>Completed</span>
                              <div className="w-2 h-2 rounded-full bg-[#34D197]"></div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="pending" className="mt-4">
              {/* Similar structure for pending tab */}
              <Card className="bg-card dark:bg-[#0A0A0A] border-border dark:border-[#1A1A1A] overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4 border-b border-border dark:border-[#1A1A1A]">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 bg-background/50 dark:bg-[#0A0A0A] border-border dark:border-[#1A1A1A] hover:bg-muted dark:hover:bg-[#1A1A1A]"
                      >
                        <Filter className="h-3.5 w-3.5 mr-2" />
                        Filter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 bg-background/50 dark:bg-[#0A0A0A] border-border dark:border-[#1A1A1A] hover:bg-muted dark:hover:bg-[#1A1A1A]"
                      >
                        All Time
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 bg-background/50 dark:bg-[#0A0A0A] border-border dark:border-[#1A1A1A] hover:bg-muted dark:hover:bg-[#1A1A1A]"
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      Export
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border dark:border-[#1A1A1A] bg-muted/50 dark:bg-secondary/10">
                          <th className="text-left p-4 text-xs font-medium text-muted-foreground"></th>
                          <th className="text-left p-4 text-xs font-medium text-muted-foreground">Transaction</th>
                          <th className="text-right p-4 text-xs font-medium text-muted-foreground">Amount</th>
                          <th className="text-right p-4 text-xs font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border dark:border-[#1A1A1A] last:border-0 hover:bg-muted/50 dark:hover:bg-secondary/5">
                          <td className="pl-4 py-3 w-10">{getTransactionIcon("deposit", 1000)}</td>
                          <td className="py-3 text-sm">
                            <div className="font-medium">Top up - Bank Transfer</div>
                            <div className="text-xs text-muted-foreground">Apr 22, 2025</div>
                          </td>
                          <td className="p-3 text-sm text-right">
                            <span className="text-[#34D197]">+$1000.00</span>
                          </td>
                          <td className="p-3 text-sm text-right text-muted-foreground">
                            <div className="flex items-center justify-end gap-2">
                              <span>Pending</span>
                              <div className="w-2 h-2 rounded-full bg-[#FFC857]"></div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="all" className="mt-4">
              {/* Similar structure for all tab */}
              <Card className="bg-card dark:bg-[#0A0A0A] border-border dark:border-[#1A1A1A] overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4 border-b border-border dark:border-[#1A1A1A]">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 bg-background/50 dark:bg-[#0A0A0A] border-border dark:border-[#1A1A1A] hover:bg-muted dark:hover:bg-[#1A1A1A]"
                      >
                        <Filter className="h-3.5 w-3.5 mr-2" />
                        Filter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 bg-background/50 dark:bg-[#0A0A0A] border-border dark:border-[#1A1A1A] hover:bg-muted dark:hover:bg-[#1A1A1A]"
                      >
                        All Time
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 bg-background/50 dark:bg-[#0A0A0A] border-border dark:border-[#1A1A1A] hover:bg-muted dark:hover:bg-[#1A1A1A]"
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      Export
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border dark:border-[#1A1A1A] bg-muted/50 dark:bg-secondary/10">
                          <th className="text-left p-4 text-xs font-medium text-muted-foreground"></th>
                          <th className="text-left p-4 text-xs font-medium text-muted-foreground">Transaction</th>
                          <th className="text-right p-4 text-xs font-medium text-muted-foreground">Amount</th>
                          <th className="text-right p-4 text-xs font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* All transactions would be listed here */}
                        <tr className="border-b border-border dark:border-[#1A1A1A] hover:bg-muted/50 dark:hover:bg-secondary/5">
                          <td className="pl-4 py-3 w-10">{getTransactionIcon("deposit", 500)}</td>
                          <td className="py-3 text-sm">
                            <div className="font-medium">Top up - Credit Card</div>
                            <div className="text-xs text-muted-foreground">Apr 28, 2025</div>
                          </td>
                          <td className="p-3 text-sm text-right">
                            <span className="text-[#34D197]">+$500.00</span>
                          </td>
                          <td className="p-3 text-sm text-right text-muted-foreground">
                            <div className="flex items-center justify-end gap-2">
                              <span>Completed</span>
                              <div className="w-2 h-2 rounded-full bg-[#34D197]"></div>
                            </div>
                          </td>
                        </tr>
                        {/* More transactions would be listed here */}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddFundsDialog open={addFundsOpen} onOpenChange={setAddFundsOpen} />
      <ConsolidateFundsDialog open={consolidateOpen} onOpenChange={setConsolidateOpen} />
      <DistributeFundsDialog open={distributeOpen} onOpenChange={setDistributeOpen} walletBalance={walletBalance} />
    </div>
  )
}
