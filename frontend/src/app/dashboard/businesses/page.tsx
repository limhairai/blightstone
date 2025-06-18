"use client"

import { useEffect } from "react"
import { BusinessesTable } from "../../../components/businesses/businesses-table"
import { CreateBusinessDialog } from "../../../components/businesses/create-business-dialog"
import { Button } from "../../../components/ui/button"
import { Plus, Building2, Loader2 } from "lucide-react"
import { useProductionData } from "../../../contexts/ProductionDataContext"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

export default function BusinessesPage() {
  const { state, fetchBusinesses } = useProductionData()
  
  // Use real-time data from production state
  const totalBusinesses = state.businesses.length
  const activeBusinesses = state.businesses.filter((b) => b.status === "active").length
  const pendingBusinesses = state.businesses.filter((b) => b.status === "pending").length
  const totalBalance = state.adAccounts.reduce((total, account) => total + account.balance, 0)

  useEffect(() => {
    // Ensure businesses are loaded
    if (state.currentOrganization?.id) {
      fetchBusinesses()
    }
  }, [state.currentOrganization?.id])

  if (state.loading.businesses) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading businesses...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Business Management</h1>
          <p className="text-muted-foreground">
            Manage your business profiles and ad account assignments
          </p>
        </div>
        
        <CreateBusinessDialog
          trigger={
            <Button className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0">
              <Plus className="mr-2 h-4 w-4" />
              Add Business
            </Button>
          }
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Businesses</p>
              <p className="text-2xl font-bold text-foreground">{totalBusinesses}</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <Building2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-foreground">{activeBusinesses}</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Building2 className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-foreground">{pendingBusinesses}</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Building2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="text-2xl font-bold text-foreground">
                ${totalBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Businesses Table */}
      <div className="bg-card rounded-lg border border-border">
        <BusinessesTable />
      </div>
    </div>
  )
} 