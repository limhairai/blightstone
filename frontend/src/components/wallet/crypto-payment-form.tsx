"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Card, CardContent } from "../ui/card"
import { Copy, ExternalLink } from "lucide-react"
import { Input } from "../ui/input"
import { useToast } from "../../hooks/use-toast"

interface CryptoPaymentFormProps {
  amount: string;
  orgId?: string; // Added orgId as it was passed from TopUpWallet
}

export function CryptoPaymentForm({ amount, orgId: _orgId }: CryptoPaymentFormProps) {
  const [selectedCrypto, setSelectedCrypto] = useState("btc")
  const { toast } = useToast()

  const cryptoOptions = [
    {
      id: "btc",
      name: "Bitcoin (BTC)",
      address: "3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5", // Example address
      rate: 0.000016, 
    },
    {
      id: "eth",
      name: "Ethereum (ETH)",
      address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Example address
      rate: 0.00025, 
    },
    {
      id: "usdt",
      name: "Tether (USDT)",
      address: "TKTcfBEKpp5ZRPwXxeJkRdJpUWSHG1xXNB", // Example address
      rate: 1,
    },
  ]

  const selectedOption = cryptoOptions.find((option) => option.id === selectedCrypto)
  const cryptoAmount = selectedOption ? Number.parseFloat(amount || "0") * selectedOption.rate : 0

  const handleCopyAddress = () => {
    if (selectedOption) {
      navigator.clipboard.writeText(selectedOption.address)
      toast({
        title: "Address copied",
        description: "Crypto address copied to clipboard",
        // variant: "success" // Assuming toast has a default variant if not specified or success is valid
      })
    }
  }

  return (
    <div className="space-y-6">
      <RadioGroup value={selectedCrypto} onValueChange={setSelectedCrypto}>
        <div className="grid grid-cols-1 gap-4">
          {cryptoOptions.map((option) => (
            <Card
              key={option.id}
              className={`cursor-pointer bg-card ${selectedCrypto === option.id ? "border-primary" : "border-border"}`}
            >
              <CardContent className="p-4 flex items-center space-x-4" onClick={() => setSelectedCrypto(option.id)}>
                <RadioGroupItem value={option.id} id={option.id} className="border-border text-primary" />
                <Label htmlFor={option.id} className="flex items-center cursor-pointer">
                  {option.name}
                </Label>
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>

      {selectedOption && (
        <div className="space-y-4 p-4 border rounded-md border-border bg-secondary/30">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-muted-foreground">Amount to Send</Label>
              <span className="text-sm font-medium">
                ≈ {cryptoAmount.toFixed(8)} {selectedOption.id.toUpperCase()}
              </span>
            </div>
            <div className="relative">
              <Input
                value={selectedOption.address}
                readOnly
                className="pr-20 bg-secondary/50 border-border font-mono text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6"
                onClick={handleCopyAddress}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-md">
              {/* QR code would go here - placeholder for now */}
              <div className="w-32 h-32 bg-black/10 flex items-center justify-center text-xs text-center">
                QR Code for {selectedOption.id.toUpperCase()} address
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>
              Send exactly {cryptoAmount.toFixed(8)} {selectedOption.id.toUpperCase()} to the address above.
            </p>
            <p className="mt-1">Your account will be credited once the transaction is confirmed on the blockchain.</p>
          </div>

          <Button variant="outline" className="w-full text-xs border-border bg-secondary/50">
            <ExternalLink className="h-3 w-3 mr-1" />
            View Transaction Status
          </Button>
        </div>
      )}
    </div>
  )
}
