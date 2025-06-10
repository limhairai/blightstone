"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpRight, ArrowDownLeft, CreditCard, Building2, Bitcoin, ArrowUpDown, Shuffle } from "lucide-react"
import { AddFundsDialog } from "./add-funds-dialog"
import { ConsolidateFundsDialog } from "./consolidate-funds-dialog"
import { DistributeFundsDialog } from "./distribute-funds-dialog"

export function WalletFundingPanel() {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("bank")
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [consolidateOpen, setConsolidateOpen] = useState(false)
  const [distributeOpen, setDistributeOpen] = useState(false)

  const presetAmounts = [100, 500, 1000, 5000]

  const handlePresetAmount = (value: number) => {
    setAmount(value.toString())
  }

  const handleAddFunds = () => {
    setAddFundsOpen(true)
  }

  return (
    <>
      <Card className="border-border h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Fund Wallet</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between space-y-4">
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black font-medium"
              size="sm"
              onClick={handleAddFunds}
            >
              <ArrowUpRight className="h-4 w-4 mr-1" />
              Add Funds
            </Button>
            <Button variant="outline" size="sm">
              <ArrowDownLeft className="h-4 w-4 mr-1" />
              Withdraw
            </Button>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-xl font-semibold h-10 pl-8 bg-background dark:bg-[#111111] border-border dark:border-[#333333]"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-xs"
                  onClick={() => setAmount("10000")}
                >
                  Max
                </Button>
              </div>
            </div>

            {/* Preset Amounts */}
            <div className="grid grid-cols-4 gap-1">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handlePresetAmount(preset)}
                >
                  ${preset >= 1000 ? `${preset / 1000}k` : preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment method</label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="bg-background dark:bg-[#111111] border-border dark:border-[#333333] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Bank Transfer</span>
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Credit/Debit Card</span>
                  </div>
                </SelectItem>
                <SelectItem value="crypto">
                  <div className="flex items-center gap-2">
                    <Bitcoin className="h-4 w-4" />
                    <span>Cryptocurrency</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Review Button */}
          <Button
            className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black font-medium h-9"
            disabled={!amount || Number.parseFloat(amount) <= 0}
            onClick={handleAddFunds}
          >
            Add ${amount || "0"} via {paymentMethod === "bank" ? "Bank" : paymentMethod === "card" ? "Card" : "Crypto"}
          </Button>

          {/* Fund Management Actions */}
          <div className="pt-2 border-t border-border">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setConsolidateOpen(true)}>
                <ArrowUpDown className="h-3 w-3 mr-1" />
                Consolidate
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setDistributeOpen(true)}>
                <Shuffle className="h-3 w-3 mr-1" />
                Distribute
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddFundsDialog
        open={addFundsOpen}
        onOpenChange={setAddFundsOpen}
        amount={amount}
        paymentMethod={paymentMethod}
      />
      <ConsolidateFundsDialog open={consolidateOpen} onOpenChange={setConsolidateOpen} />
      <DistributeFundsDialog open={distributeOpen} onOpenChange={setDistributeOpen} walletBalance={5750} />
    </>
  )
}
