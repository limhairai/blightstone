"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, DollarSign } from "lucide-react"

interface TopUpWalletProps {
  onTopUp: (amount: number) => void
}

export function TopUpWallet({ onTopUp }: TopUpWalletProps) {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("credit-card")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = Number.parseFloat(amount)
    if (!isNaN(numAmount) && numAmount > 0) {
      onTopUp(numAmount)
    }
  }

  const predefinedAmounts = ["100", "250", "500", "1000"]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Label className="text-muted-foreground">Select Amount</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {predefinedAmounts.map((value) => (
            <Button
              key={value}
              type="button"
              variant={amount === value ? "default" : "outline"}
              onClick={() => setAmount(value)}
              className={`h-12 ${
                amount === value
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "border-border dark:border-border text-foreground hover:bg-secondary"
              }`}
            >
              ${value}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom-amount" className="text-muted-foreground">
            Custom Amount
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="custom-amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-9 bg-muted/50 dark:bg-secondary/50 border-border dark:border-border focus:border-primary focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-muted-foreground">Payment Method</Label>
        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className={`cursor-pointer bg-card ${paymentMethod === "credit-card" ? "border-primary" : "border-border dark:border-border"}`}
            >
              <CardContent className="p-4 flex items-center space-x-4" onClick={() => setPaymentMethod("credit-card")}>
                <RadioGroupItem
                  value="credit-card"
                  id="credit-card"
                  className="border-border dark:border-border text-primary"
                />
                <Label htmlFor="credit-card" className="flex items-center cursor-pointer">
                  <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                  Credit Card
                </Label>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer bg-card ${paymentMethod === "bank-transfer" ? "border-primary" : "border-border dark:border-border"}`}
            >
              <CardContent
                className="p-4 flex items-center space-x-4"
                onClick={() => setPaymentMethod("bank-transfer")}
              >
                <RadioGroupItem
                  value="bank-transfer"
                  id="bank-transfer"
                  className="border-border dark:border-border text-primary"
                />
                <Label htmlFor="bank-transfer" className="flex items-center cursor-pointer">
                  <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
                  Bank Transfer
                </Label>
              </CardContent>
            </Card>
          </div>
        </RadioGroup>
      </div>

      <Button type="submit" className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black">
        Add Funds
      </Button>
    </form>
  )
}
