"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, CreditCard, Building } from "lucide-react"

export function WithdrawFunds() {
  const [amount, setAmount] = useState("")
  const [withdrawMethod, setWithdrawMethod] = useState("bank-transfer")
  const [bankAccount, setBankAccount] = useState("")
  const [accountName, setAccountName] = useState("")
  const [routingNumber, setRoutingNumber] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle withdrawal logic
    alert(`Withdrawal of $${amount} initiated`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Label className="text-muted-foreground">Withdraw Amount</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="withdraw-amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-9 bg-secondary/50 border-border focus:border-primary focus:ring-primary"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-muted-foreground">Withdrawal Method</Label>
        <RadioGroup value={withdrawMethod} onValueChange={setWithdrawMethod}>
          <div className="grid grid-cols-1 gap-4">
            <Card
              className={`cursor-pointer bg-card ${withdrawMethod === "bank-transfer" ? "border-primary" : "border-border"}`}
            >
              <CardContent
                className="p-4 flex items-center space-x-4"
                onClick={() => setWithdrawMethod("bank-transfer")}
              >
                <RadioGroupItem value="bank-transfer" id="bank-transfer" className="border-border text-primary" />
                <Label htmlFor="bank-transfer" className="flex items-center cursor-pointer">
                  <Building className="h-5 w-5 mr-2 text-muted-foreground" />
                  Bank Transfer
                </Label>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer bg-card ${withdrawMethod === "credit-card" ? "border-primary" : "border-border"}`}
            >
              <CardContent className="p-4 flex items-center space-x-4" onClick={() => setWithdrawMethod("credit-card")}>
                <RadioGroupItem value="credit-card" id="credit-card" className="border-border text-primary" />
                <Label htmlFor="credit-card" className="flex items-center cursor-pointer">
                  <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                  Credit Card
                </Label>
              </CardContent>
            </Card>
          </div>
        </RadioGroup>
      </div>

      {withdrawMethod === "bank-transfer" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bank-account">Bank Account Number</Label>
            <Input
              id="bank-account"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              className="bg-secondary/50 border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-name">Account Holder Name</Label>
            <Input
              id="account-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="bg-secondary/50 border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="routing-number">Routing Number</Label>
            <Input
              id="routing-number"
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value)}
              className="bg-secondary/50 border-border"
            />
          </div>
        </div>
      )}

      {withdrawMethod === "credit-card" && (
        <div className="space-y-4">
          <div className="p-4 bg-secondary/20 rounded-md">
            <p className="text-sm text-muted-foreground">
              Funds will be returned to the original payment method used for deposit.
            </p>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black">
        Withdraw Funds
      </Button>
    </form>
  )
}
