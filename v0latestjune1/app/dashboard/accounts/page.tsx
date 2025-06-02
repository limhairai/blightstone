"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusIcon } from "lucide-react"
import { AccountsTab } from "@/components/accounts/accounts-tab"
import { ProjectsTab } from "@/components/accounts/projects-tab"
import { AccountsMetrics } from "@/components/accounts/accounts-metrics"
import { CreateAdAccountDialog } from "@/components/accounts/create-ad-account-dialog"
import { CreateProjectDialog } from "@/components/accounts/create-project-dialog"

// Mock data for accounts
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

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState("accounts")

  return (
    <div className="space-y-6">
      <AccountsMetrics />

      <Tabs defaultValue="accounts" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          {activeTab === "accounts" ? (
            <CreateAdAccountDialog
              trigger={
                <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-white border-0">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Ad Account
                </Button>
              }
            />
          ) : (
            <CreateProjectDialog
              trigger={
                <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-white border-0">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              }
            />
          )}
        </div>

        <TabsContent value="accounts" className="mt-0">
          <AccountsTab />
        </TabsContent>

        <TabsContent value="projects" className="mt-0">
          <ProjectsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
