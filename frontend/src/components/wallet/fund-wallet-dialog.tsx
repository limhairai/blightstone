"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Building2, ArrowUpDown, Shuffle } from 'lucide-react'

interface FundWalletDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMode?: "add" | "withdraw"
  walletBalance?: number
}

export function FundWalletDialog({ open, onOpenChange, initialMode = "add", walletBalance = 5750 }: FundWalletDialogProps) {
  const [mode, setMode] = useState<"add" | "withdraw">(initialMode)
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("bank")
  
  // Update mode when initialMode changes
  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  // Handle preset amount selection
  const handlePresetAmount = (value: number) => {
    setAmount(value.toString())
  }

  // Handle max amount
  const handleMaxAmount = () => {
    if (mode === "withdraw") {
      setAmount(walletBalance.toString())
    } else {
      setAmount("10000") // Max add amount
    }
  }

  // Handle main action (Add/Withdraw)
  const handleMainAction = () => {
    if (!amount || Number.parseFloat(amount) <= 0) return

    if (mode === "add") {
      // Handle add funds
      console.log(`Adding $${amount} via ${paymentMethod}`)
    } else {
      // Handle withdrawal
      console.log(`Withdrawing $${amount}`)
    }
    
    // Close dialog after action
    onOpenChange(false)
  }

  // Handle consolidate funds
  const handleConsolidate = () => {
    // Open consolidate dialog or perform consolidation
    console.log('Opening consolidate dialog')
  }

  // Handle distribute funds
  const handleDistribute = () => {
    // Open distribute dialog
    console.log('Opening distribute dialog')
  }

  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case "bank": return "Bank"
      case "card": return "Card"
      case "crypto": return "Crypto"
      default: return "Bank"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-[#0a0a0a] border-[#222222] shadow-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">Fund Wallet</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className={mode === "add" ? "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black font-medium border-0 flex-1" : "bg-transparent text-white border-[#333333] flex-1"}
              onClick={() => setMode("add")}
            >
              <span className="mr-2">↗</span>
              Add Funds
            </Button>
            <Button
              variant="outline"
              className={mode === "withdraw" ? "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black font-medium border-0 flex-1" : "bg-transparent text-white border-[#333333] flex-1"}
              onClick={() => setMode("withdraw")}
            >
              <span className="mr-2">↘</span>
              Withdraw
            </Button>
          </div>

          {/* Amount Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Amount</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-xl font-semibold h-12 pl-8 bg-[#111111] border-[#333333] text-white"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 text-sm text-gray-300 hover:text-white"
                onClick={handleMaxAmount}
              >
                Max
              </Button>
            </div>

            {/* Preset Amounts */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-sm h-10 bg-[#111111] border-[#333333] text-white hover:bg-[#222222]"
                onClick={() => handlePresetAmount(100)}
              >
                $100
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-sm h-10 bg-[#111111] border-[#333333] text-white hover:bg-[#222222]"
                onClick={() => handlePresetAmount(500)}
              >
                $500
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-sm h-10 bg-[#111111] border-[#333333] text-white hover:bg-[#222222]"
                onClick={() => handlePresetAmount(1000)}
              >
                $1k
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-sm h-10 bg-[#111111] border-[#333333] text-white hover:bg-[#222222]"
                onClick={() => handlePresetAmount(5000)}
              >
                $5k
              </Button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Payment method</label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="bg-[#111111] border-[#333333] text-white">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Bank Transfer</span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#111111] border-[#333333] text-white">
                <SelectItem value="bank">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Bank Transfer</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Main Action Button */}
          <Button
            className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black font-medium h-12"
            disabled={!amount || Number.parseFloat(amount) <= 0}
            onClick={handleMainAction}
          >
            {mode === "add" ? `Add $${amount || "0"} via ${getPaymentMethodLabel()}` : `Withdraw $${amount || "0"}`}
          </Button>

          {/* Fund Management Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="text-sm bg-[#111111] border-[#333333] text-white hover:bg-[#222222]"
              onClick={handleConsolidate}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Consolidate
            </Button>
            <Button 
              variant="outline" 
              className="text-sm bg-[#111111] border-[#333333] text-white hover:bg-[#222222]"
              onClick={handleDistribute}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Distribute
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 