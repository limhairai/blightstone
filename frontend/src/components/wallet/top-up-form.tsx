"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Badge } from "../ui/badge"
import { CreditCard, DollarSign, Wallet } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { CryptoPaymentForm } from "./crypto-payment-form"
import { useToast } from "../../hooks/use-toast"

export function TopUpForm() {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("credit-card")
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle payment processing here
    toast({
      title: "Payment Processing",
      description: `Processing $${amount} payment...`,
    })
  }

  const predefinedAmounts = ["100", "500", "1000", "5000"]

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
                  ? "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
                  : "border-border text-foreground hover:bg-[#1A1A1A]"
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
              className="pl-9 bg-[#1A1A1A] border-border focus:border-gray-700 focus:ring-gray-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-muted-foreground">Payment Method</Label>
        <Tabs defaultValue="card" className="w-full">
          <TabsList className="grid grid-cols-3 bg-[#0a0812] p-1 h-auto">
            <TabsTrigger value="card" className="data-[state=active]:bg-[#1A1A1A] px-3 py-1.5 h-auto">
              <CreditCard className="h-4 w-4 mr-2" />
              Card
            </TabsTrigger>
            <TabsTrigger value="crypto" className="data-[state=active]:bg-[#1A1A1A] px-3 py-1.5 h-auto">
              <Wallet className="h-4 w-4 mr-2" />
              Crypto
            </TabsTrigger>
            <TabsTrigger value="bank" className="data-[state=active]:bg-[#1A1A1A] px-3 py-1.5 h-auto">
              <DollarSign className="h-4 w-4 mr-2" />
              Bank
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-number" className="text-muted-foreground">
                Card Number
              </Label>
              <Input
                id="card-number"
                placeholder="1234 5678 9012 3456"
                className="bg-[#1A1A1A] border-border focus:border-gray-700 focus:ring-gray-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry" className="text-muted-foreground">
                  Expiry Date
                </Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  className="bg-[#1A1A1A] border-border focus:border-gray-700 focus:ring-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc" className="text-muted-foreground">
                  CVC
                </Label>
                <Input
                  id="cvc"
                  placeholder="123"
                  className="bg-[#1A1A1A] border-border focus:border-gray-700 focus:ring-gray-500"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="crypto" className="mt-4">
            <CryptoPaymentForm amount={amount} />
          </TabsContent>

          <TabsContent value="bank" className="mt-4">
            <div className="space-y-4 p-4 border rounded-md border-border bg-[#1A1A1A]">
              <p className="text-sm text-muted-foreground">Please use the following details for bank transfer:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium text-muted-foreground">Account Name:</div>
                <div>AdHub Inc.</div>
                <div className="font-medium text-muted-foreground">Account Number:</div>
                <div className="font-mono">1234567890</div>
                <div className="font-medium text-muted-foreground">Routing Number:</div>
                <div className="font-mono">987654321</div>
                <div className="font-medium text-muted-foreground">Reference:</div>
                <div>Your account email</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Bank transfers may take 1-3 business days to process
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Button type="submit" className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black">
        Process Payment
      </Button>
    </form>
  )
}
