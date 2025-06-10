"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MOCK_ACCOUNTS, formatCurrency } from "@/lib/mock-data"

export function AdAccountsList() {
  // Use centralized mock data and convert to the format expected by this component
  const accounts = MOCK_ACCOUNTS.slice(0, 4).map((account) => ({
    id: `acc_${account.id}`,
    name: account.name,
    status: account.status === "active" ? "Active" : 
            account.status === "pending" ? "Pending" : 
            account.status === "paused" ? "Paused" : "Inactive",
    balance: `$${formatCurrency(account.balance)}`,
    platform: account.platform,
    lastUpdated: account.dateAdded,
  }))

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
          <Button className="mt-4 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0">Request Account</Button>
        </div>
      )}
    </div>
  )
}

export default AdAccountsList 