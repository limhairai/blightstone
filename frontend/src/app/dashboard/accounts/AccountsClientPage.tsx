"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, MoreHorizontal, ExternalLink, Settings, Wallet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AccountTopUpDialog } from "@/components/account-top-up-dialog"
import { cn } from "@/lib/utils"

// Mock data for accounts from AccountsClientPage.tsx
const accounts = [
  {
    id: "2498",
    name: "Meta Ads Primary",
    project: "Marketing Campaigns",
    adAccount: "123456789",
    status: "Active",
    balance: "$1,250.00",
    spendLimit: "$5,000.00",
    dateAdded: "04/15/2025",
    quota: 58,
  },
  {
    id: "3495",
    name: "Meta Ads Secondary",
    project: "Marketing Campaigns",
    adAccount: "987654321",
    status: "Active",
    balance: "$3,750.00",
    spendLimit: "$10,000.00",
    dateAdded: "04/10/2025",
    quota: 84,
  },
  {
    id: "5728",
    name: "Meta Ads Campaign",
    project: "Social Media",
    adAccount: "456789123",
    status: "Pending",
    balance: "$0.00",
    spendLimit: "$2,500.00",
    dateAdded: "04/18/2025",
    quota: 0,
  },
  {
    id: "1393",
    name: "Meta Ads Promotions",
    project: "Product Launch",
    adAccount: "789123456",
    status: "Active",
    balance: "$850.00",
    spendLimit: "$3,000.00",
    dateAdded: "04/05/2025",
    quota: 28,
  },
  {
    id: "2083",
    name: "Meta Ads Marketing",
    project: "Brand Awareness",
    adAccount: "321654987",
    status: "Inactive",
    balance: "$0.00",
    spendLimit: "$1,500.00",
    dateAdded: "03/22/2025",
    quota: 0,
  },
]

// Define a type for the account data, useful for state
interface AccountData {
  id: string;
  name: string;
  project: string;
  adAccount: string;
  status: string;
  balance: string;
  spendLimit: string;
  dateAdded: string;
  quota: number;
}

export default function AccountsClientPage() {
  const [activeTab, setActiveTab] = useState("accounts")
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const [selectedAccountForTopUp, setSelectedAccountForTopUp] = useState<AccountData | null>(null);

  const openTopUpDialog = (account: AccountData) => {
    setSelectedAccountForTopUp(account);
    setIsTopUpDialogOpen(true);
  };

  const closeTopUpDialog = () => {
    setSelectedAccountForTopUp(null);
    setIsTopUpDialogOpen(false);
  };

  // Optional: Define a handler if you need to do something after top-up
  // const handleSuccessfulTopUp = (amount: number) => {
  //   console.log(`Successfully topped up ${selectedAccountForTopUp?.name} with $${amount}`);
  //   // You might want to refresh account data or show a notification here
  //   closeTopUpDialog();
  // };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
        <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black">
          <Plus className="h-4 w-4 mr-2" />
          Create Ad Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222] rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total accounts</div>
          <div className="text-2xl font-bold">{accounts.length}</div>
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">Active accounts</div>
          <div className="text-lg font-semibold">{accounts.filter((a) => a.status === "Active").length}</div>
        </div>

        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222] rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total balance</div>
          <div className="text-2xl font-bold">$5,850.00</div> {/* This is hardcoded in v0, should ideally be calculated */}
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">Total spend limit</div>
          <div className="text-lg font-semibold">$21,500.00</div> {/* This is hardcoded in v0 */}
        </div>

        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222] rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Average quota usage</div>
          <div className="text-2xl font-bold">42%</div> {/* This is hardcoded in v0 */}
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">Accounts at risk</div>
          <div className="text-lg font-semibold text-orange-500">1</div> {/* This is hardcoded in v0 */}
        </div>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg truncate">{account.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {account.id}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-white dark:bg-[#0a0a0a] border-gray-100 dark:border-[#222]"
                    >
                      <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-[#1A1A1A] cursor-pointer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-[#1A1A1A] cursor-pointer">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                    <Badge
                      variant={account.status === "Active" ? "default" : "outline"}
                      className={cn(
                        account.status === "Active"
                          ? "bg-green-500/20 text-green-600 border-green-500"
                          : account.status === "Pending"
                            ? "bg-yellow-500/10 text-yellow-600 border-yellow-500"
                            : "bg-gray-500/10 text-gray-600 border-gray-500",
                      )}
                    >
                      {account.status}
                    </Badge>
                  </div>
                  {/* ... other account details ... */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Balance</span>
                    <span className="font-semibold">{account.balance}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Spend Limit</span>
                    <span className="font-semibold">{account.spendLimit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Quota Usage</span>
                    <div className="flex items-center gap-2">
                      <div className="relative h-4 w-4">
                        <svg className="h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" /><circle cx="12" cy="12" r="10" fill="none" stroke={account.quota >= 80 ? "#ef4444" : account.quota >= 50 ? "#f97316" : account.quota > 0 ? "#22c55e" : "#6b7280"} strokeWidth="2" strokeDasharray={`${account.quota * 0.628} 100`} strokeLinecap="round" transform="rotate(-90 12 12)" /></svg>
                      </div>
                      <span className="text-sm">{account.quota}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90"
                    size="sm"
                    onClick={() => openTopUpDialog(account)}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Top Up
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222] rounded-lg p-6 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400">Your projects will appear here.</p>
          </div>
        </TabsContent>
      </Tabs>

      {selectedAccountForTopUp && (
        <AccountTopUpDialog
          isOpen={isTopUpDialogOpen}
          onClose={closeTopUpDialog}
          accountId={selectedAccountForTopUp.adAccount}
          accountName={selectedAccountForTopUp.name}
          currentBalance={selectedAccountForTopUp.balance}
          // onTopUp={handleSuccessfulTopUp} // Uncomment if you have a handler
        />
      )}
    </div>
  )
} 