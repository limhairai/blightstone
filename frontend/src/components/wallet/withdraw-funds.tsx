"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, CreditCard, Building, Clock, Loader2 } from "lucide-react"
import { layout } from "@/lib/layout-utils"
import { contentTokens } from "@/lib/content-tokens"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export function WithdrawFunds() {
  const [amount, setAmount] = useState("")
  const [withdrawMethod, setWithdrawMethod] = useState("bank-transfer")
  const [bankAccount, setBankAccount] = useState("")
  const [accountName, setAccountName] = useState("")
  const [routingNumber, setRoutingNumber] = useState("")
  const [method, setMethod] = useState("bank")
  const [accountNumber, setAccountNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Mock data
  const availableBalance = 5750.0
  const quickAmounts = [100, 500, 1000, 2500]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle withdrawal logic
    alert(`Withdrawal of $${amount} initiated`)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Withdraw Funds</CardTitle>
        <CardDescription className="text-muted-foreground">
          Transfer funds from your wallet to your bank account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={layout.formGroups}>
          <div className={layout.stackMedium}>
            <div>
              <Label htmlFor="amount" className="text-foreground">
                {contentTokens.labels.amount}
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9 bg-background border-border text-foreground"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available balance: ${availableBalance.toFixed(2)}
              </p>
            </div>

            <div className={layout.stackSmall}>
              <Label className="text-foreground">Quick amounts</Label>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    ${quickAmount}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className={layout.stackMedium}>
            <div>
              <Label htmlFor="method" className="text-foreground">
                Withdrawal Method
              </Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder={contentTokens.placeholders.selectOption} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="bank" className="text-popover-foreground hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Bank Transfer
                    </div>
                  </SelectItem>
                  <SelectItem value="paypal" className="text-popover-foreground hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      PayPal
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {method === "bank" && (
              <div className={layout.stackMedium}>
                <div>
                  <Label htmlFor="accountNumber" className="text-foreground">
                    Account Number
                  </Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                    className="bg-background border-border text-foreground"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="routingNumber" className="text-foreground">
                    Routing Number
                  </Label>
                  <Input
                    id="routingNumber"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="Enter routing number"
                    className="bg-background border-border text-foreground"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <div className={layout.stackMedium}>
            <div className="bg-muted/50 p-3 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Processing Time</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {method === "bank" 
                  ? "Bank transfers typically take 1-3 business days to process"
                  : "PayPal transfers are usually processed within 24 hours"
                }
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAmount("")
                  setMethod("")
                  setAccountNumber("")
                  setRoutingNumber("")
                }}
                className="border-border text-foreground hover:bg-accent"
              >
                {contentTokens.actions.cancel}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !amount || !method}
                className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {contentTokens.loading.processing}
                  </>
                ) : (
                  "Withdraw Funds"
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
