"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AccountsMetrics from "@/components/accounts/accounts-metrics"
import { AccountsTab } from "@/components/accounts/accounts-tab"       // This is the table view
import { ProjectsTab } from "@/components/accounts/projects-tab"     // To be created
import { CreateAdAccountDialog } from "@/components/accounts/create-ad-account-dialog" // To be created
import { Plus } from "lucide-react"

// Renamed function to avoid conflict if page.tsx also had a function named AccountsPage
export default function AccountsPageClient() { 
  const [activeTab, setActiveTab] = useState("accounts")

  return (
    // The page itself (this client component) won't be wrapped by AppShell directly.
    // The AppShell is provided by frontend/src/app/dashboard/layout.tsx
    // The <div className="space-y-6 p-6"> is the main content wrapper for this specific client page.
    <div className="space-y-6 p-6">
      {/* Metrics Cards */}
      <AccountsMetrics />

      {/* Tabs and Create Button */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>

            <CreateAdAccountDialog
              trigger={
                <Button className="gradient-button hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Ad Account
                </Button>
              }
            />
          </div>

          <TabsContent value="accounts" className="mt-6">
            <AccountsTab />
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <ProjectsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 