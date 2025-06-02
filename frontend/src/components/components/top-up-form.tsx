"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function TopUpForm() {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("credit-card")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log({ amount, paymentMethod })
  }

  return (
    <Card className="airwallex-card">
      <CardHeader>
        <CardTitle>Top Up Wallet</CardTitle>
        <CardDescription>Add funds to your wallet balance.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                className="pl-8"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem value="credit-card" id="credit-card" />
                <Label htmlFor="credit-card" className="flex-1 cursor-pointer">
                  Credit Card
                </Label>
                <div className="flex space-x-1">
                  <div className="h-5 w-8 rounded bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0]"></div>
                </div>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                <Label htmlFor="bank-transfer" className="flex-1 cursor-pointer">
                  Bank Transfer
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem value="crypto" id="crypto" />
                <Label htmlFor="crypto" className="flex-1 cursor-pointer">
                  Cryptocurrency
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button">
            Cancel
          </Button>
          <Button type="submit" className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black">
            Top Up
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 