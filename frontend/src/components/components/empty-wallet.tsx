import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet } from "lucide-react"

export function EmptyWallet() {
  return (
    <Card className="airwallex-card">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Your Wallet is Empty</CardTitle>
        <CardDescription>Add funds to your wallet to start funding your ad accounts</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pb-6">
        <div className="w-64 h-64 flex items-center justify-center">
          <Wallet className="w-32 h-32 text-muted-foreground/20" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black">Add Funds</Button>
      </CardFooter>
    </Card>
  )
} 