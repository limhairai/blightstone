"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { CreditCard, DollarSign, Wallet, Shield } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { CryptoPaymentForm } from "./crypto-payment-form"
import { useToast } from "../../hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { TopUpForm } from "./top-up-form"
import { useWallet } from "../../contexts/WalletContext"
import { useAuth } from "../../contexts/AuthContext"
import { layout } from "../../lib/layout-utils"
import { contentTokens } from "../../lib/content-tokens"

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
      <div className={layout.stackLarge}>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Top Up Wallet</h3>
          <p className="text-sm text-muted-foreground">Add funds to your wallet to distribute to ad accounts</p>
        </div>

        <div className={layout.stackLarge}>
          <div>
            <Label htmlFor="amount" className="text-foreground">
              {contentTokens.labels.amount}
            </Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 bg-background border-border text-foreground"
                min="1"
                step="0.01"
              />
            </div>
          </div>

          <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="card" className="data-[state=active]:bg-background">
                Credit Card
              </TabsTrigger>
              <TabsTrigger value="crypto" className="data-[state=active]:bg-background">
                Crypto
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card" className={`mt-4 ${layout.stackLarge}`}>
              <div className={layout.stackMedium}>
                <div>
                  <Label htmlFor="cardNumber" className="text-foreground">
                    Card Number
                  </Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry" className="text-foreground">
                      Expiry
                    </Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvc" className="text-foreground">
                      CVC
                    </Label>
                    <Input
                      id="cvc"
                      placeholder="123"
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className={`${layout.stackLarge} p-4 border rounded-md border-border bg-muted`}>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-foreground">Secure Payment</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your payment information is encrypted and secure. We use industry-standard security measures.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="crypto" className="mt-4">
              <CryptoPaymentForm amount={amount} orgId={orgId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Button type="submit" className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black" disabled={loading || !amount || Number.parseFloat(amount) <= 0}>
        {loading ? contentTokens.loading.processing : "Process Payment"}
      </Button>
    </form>
  )
}
