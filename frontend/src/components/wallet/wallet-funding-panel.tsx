"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Building2, ArrowUpDown, Shuffle, CreditCard, Wallet } from 'lucide-react'
import { toast } from "sonner"
import { ConsolidateFundsDialog } from "./consolidate-funds-dialog"
import { DistributeFundsDialog } from "./distribute-funds-dialog"
import { useAppData } from "../../contexts/AppDataContext"
import { formatCurrency } from "../../lib/mock-data"

export function WalletFundingPanel() {
  const { state, addTransaction, updateWalletBalance } = useAppData()
  const [mode, setMode] = useState<"add" | "withdraw">("add")
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("bank")
  const [showConsolidateDialog, setShowConsolidateDialog] = useState(false)
  const [showDistributeDialog, setShowDistributeDialog] = useState(false)

  // Handle preset amount selection
  const handlePresetAmount = (value: number) => {
    setAmount(value.toString())
  }

  // Handle max amount
  const handleMaxAmount = () => {
    if (mode === "withdraw") {
      setAmount(state.financialData.totalBalance.toString())
    } else {
      setAmount("10000") // Max add amount
    }
  }

  // Handle main action (Add/Withdraw)
  const handleMainAction = async () => {
    const numAmount = Number.parseFloat(amount)
    if (!amount || numAmount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    try {
      if (mode === "add") {
        // 1. Add funds to wallet balance
        await updateWalletBalance(numAmount, 'add')
        
        // 2. Add transaction record
        await addTransaction({
          type: 'topup',
          amount: numAmount,
          date: new Date().toISOString(),
          description: `Wallet funding via ${getPaymentMethodLabel()}`,
          status: 'completed'
        })
        toast.success(`Successfully added $${numAmount} to wallet`)
      } else {
        if (numAmount > state.financialData.totalBalance) {
          toast.error("Amount exceeds available balance")
          return
        }
        
        // 1. Subtract funds from wallet balance
        await updateWalletBalance(numAmount, 'subtract')
        
        // 2. Add transaction record
        await addTransaction({
          type: 'withdrawal',
          amount: numAmount,
          date: new Date().toISOString(),
          description: `Wallet withdrawal via ${getPaymentMethodLabel()}`,
          status: 'completed'
        })
        toast.success(`Successfully withdrew $${numAmount} from wallet`)
      }
      
      // Reset amount after successful action
      setAmount("")
    } catch (error) {
      toast.error(`Failed to ${mode === "add" ? "add funds" : "withdraw funds"}`)
    }
  }

  // Handle consolidate funds
  const handleConsolidate = () => {
    setShowConsolidateDialog(true)
  }

  // Handle distribute funds
  const handleDistribute = () => {
    setShowDistributeDialog(true)
  }

  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case "bank": return "Bank Transfer"
      case "card": return "Credit Card"
      case "crypto": return "Cryptocurrency"
      default: return "Bank Transfer"
    }
  }

  const getPaymentMethodIcon = () => {
    switch (paymentMethod) {
      case "bank": return Building2
      case "card": return CreditCard
      case "crypto": return Wallet
      default: return Building2
    }
  }

  const PaymentIcon = getPaymentMethodIcon()
  const isLoading = state.loading.actions

  return (
    <>
      <Card className="bg-card border-border flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-foreground">Fund Wallet</CardTitle>
          <div className="text-sm text-muted-foreground">
            Available: ${formatCurrency(state.financialData.totalBalance)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
          {/* Top Section */}
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className={mode === "add" ? "bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] text-black font-medium border-0 flex-1" : "bg-transparent text-foreground border-border flex-1"}
                onClick={() => setMode("add")}
                disabled={isLoading}
              >
                <span className="mr-2">↗</span>
                Add Funds
              </Button>
              <Button
                variant="outline"
                className={mode === "withdraw" ? "bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] text-black font-medium border-0 flex-1" : "bg-transparent text-foreground border-border flex-1"}
                onClick={() => setMode("withdraw")}
                disabled={isLoading}
              >
                <span className="mr-2">↘</span>
                Withdraw
              </Button>
            </div>

            {/* Amount Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Amount</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-xl font-semibold h-12 pl-8 bg-background border-border text-foreground"
                  disabled={isLoading}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 text-sm text-muted-foreground hover:text-foreground"
                  onClick={handleMaxAmount}
                  disabled={isLoading}
                >
                  Max
                </Button>
              </div>

              {/* Preset Amounts */}
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    className="text-sm h-9 bg-background border-border text-foreground hover:bg-accent"
                    onClick={() => handlePresetAmount(value)}
                    disabled={isLoading}
                  >
                    ${value >= 1000 ? `${value / 1000}k` : value}
                  </Button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Payment method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isLoading}>
                <SelectTrigger className="bg-background border-border text-foreground h-10">
                  <div className="flex items-center gap-2">
                    <PaymentIcon className="h-4 w-4" />
                    <span>{getPaymentMethodLabel()}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  <SelectItem value="bank">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>Bank Transfer</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Credit Card</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="crypto">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span>Cryptocurrency</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="space-y-4">
            {/* Main Action Button */}
            <Button
              className="w-full bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black font-medium h-12"
              disabled={!amount || Number.parseFloat(amount) <= 0 || isLoading}
              onClick={handleMainAction}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                mode === "add" ? `Add $${amount || "0"} via ${getPaymentMethodLabel()}` : `Withdraw $${amount || "0"}`
              )}
            </Button>

            {/* Fund Management Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="text-sm h-9 bg-background border-border text-foreground hover:bg-accent"
                onClick={handleConsolidate}
                disabled={isLoading}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Consolidate
              </Button>
              <Button 
                variant="outline" 
                className="text-sm h-9 bg-background border-border text-foreground hover:bg-accent"
                onClick={handleDistribute}
                disabled={isLoading}
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Distribute
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ConsolidateFundsDialog 
        open={showConsolidateDialog} 
        onOpenChange={setShowConsolidateDialog}
      />
      <DistributeFundsDialog 
        open={showDistributeDialog} 
        onOpenChange={setShowDistributeDialog}
        walletBalance={state.financialData.totalBalance}
      />
    </>
  )
} 