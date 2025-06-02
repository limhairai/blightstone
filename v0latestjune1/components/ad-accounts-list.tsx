"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Mock data for ad accounts
const mockAccounts = [
  {
    id: "acc_1",
    name: "Facebook Ad Account",
    status: "Active",
    balance: "$1,250.00",
    platform: "Facebook",
    lastUpdated: "2 hours ago",
  },
  {
    id: "acc_2",
    name: "Google Ads",
    status: "Active",
    balance: "$3,780.50",
    platform: "Google",
    lastUpdated: "1 day ago",
  },
  {
    id: "acc_3",
    name: "TikTok Ads",
    status: "Pending",
    balance: "$500.00",
    platform: "TikTok",
    lastUpdated: "3 days ago",
  },
  {
    id: "acc_4",
    name: "Instagram Promotion",
    status: "Inactive",
    balance: "$0.00",
    platform: "Instagram",
    lastUpdated: "1 week ago",
  },
]

export function AdAccountsList() {
  const [accounts] = useState(mockAccounts)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ad Accounts</h2>
        <Button>+ Add Account</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <Card key={account.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{account.name}</CardTitle>
              <CardDescription>Platform: {account.platform}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Balance:</span>
                <span className="font-medium">{account.balance}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge
                  variant={
                    account.status === "Active" ? "default" : account.status === "Pending" ? "outline" : "secondary"
                  }
                >
                  {account.status}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="pt-2 text-xs text-muted-foreground">Last updated: {account.lastUpdated}</CardFooter>
          </Card>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No ad accounts found. Create your first account to get started.</p>
          <Button className="mt-4">Create Account</Button>
        </div>
      )}
    </div>
  )
}

export default AdAccountsList
