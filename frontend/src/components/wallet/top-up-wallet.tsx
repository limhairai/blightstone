"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, DollarSign, Wallet } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CryptoPaymentForm } from "./crypto-payment-form"
import { useToast } from "@/components/ui/use-toast"

interface TopUpWalletProps {
  onTopUp: (amount: number, paymentMethod?: string, orgId?: string) => void
  orgId?: string
}

export function TopUpWallet({ onTopUp, orgId }: TopUpWalletProps) {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const idempotency_key = crypto.randomUUID()
    const numAmount = Number.parseFloat(amount)

    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive" })
      setLoading(false)
      return
    }

    try {
      console.log(`Attempting top-up of ${numAmount} via ${paymentMethod} for orgId: ${orgId}`)
      onTopUp(numAmount, paymentMethod, orgId)
      setAmount("")
    } catch (e: any) {
      toast({ title: "Top-up initiation failed", description: e.message || "An error occurred.", variant: "destructive" })
    } finally {
      setLoading(false)
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
                  ? "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
                  : "border-border text-foreground hover:bg-muted"
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
              className="pl-9 bg-muted border-border text-foreground focus:border-ring focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-muted-foreground">Payment Method</Label>
        <Tabs defaultValue="card" className="w-full" onValueChange={setPaymentMethod}>
          <TabsList className="grid grid-cols-3 bg-muted p-1 h-auto">
            <TabsTrigger value="card" className="data-[state=active]:bg-background px-3 py-1.5 h-auto">
              <CreditCard className="h-4 w-4 mr-2" />
              Card
            </TabsTrigger>
            <TabsTrigger value="crypto" className="data-[state=active]:bg-background px-3 py-1.5 h-auto">
              <Wallet className="h-4 w-4 mr-2" />
              Crypto
            </TabsTrigger>
            <TabsTrigger value="bank" className="data-[state=active]:bg-background px-3 py-1.5 h-auto">
              <DollarSign className="h-4 w-4 mr-2" />
              Bank
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-number" className="text-muted-foreground">Card Number</Label>
              <Input id="card-number" placeholder="1234 5678 9012 3456" className="bg-muted border-border text-foreground focus:border-ring focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry" className="text-muted-foreground">Expiry Date</Label>
                <Input id="expiry" placeholder="MM/YY" className="bg-muted border-border text-foreground focus:border-ring focus:ring-ring" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc" className="text-muted-foreground">CVC</Label>
                <Input id="cvc" placeholder="123" className="bg-muted border-border text-foreground focus:border-ring focus:ring-ring" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="crypto" className="mt-4">
            <CryptoPaymentForm amount={amount} orgId={orgId} />
          </TabsContent>

          <TabsContent value="bank" className="mt-4">
            <div className="space-y-4 p-4 border rounded-md border-border bg-muted">
              <p className="text-sm text-muted-foreground">Please use the following details for bank transfer:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium text-muted-foreground">Account Name:</div><div className="text-foreground">AdHub Inc.</div>
                <div className="font-medium text-muted-foreground">Account Number:</div><div className="font-mono text-foreground">1234567890</div>
                <div className="font-medium text-muted-foreground">Routing Number:</div><div className="font-mono text-foreground">987654321</div>
                <div className="font-medium text-muted-foreground">Reference:</div><div className="text-foreground">Your account email</div>
              </div>
              <p className="text-xs text-muted-foreground">Note: Bank transfers may take 1-3 business days to process</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Button type="submit" className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black" disabled={loading || !amount || Number.parseFloat(amount) <= 0}>
        {loading ? "Processing..." : "Process Payment"}
      </Button>
    </form>
  )
}
