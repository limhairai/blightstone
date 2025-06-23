"use client"

import { useSearchParams } from "next/navigation"
import { AccountsTable } from "../../../components/dashboard/accounts-table"
import { CreateAdAccountDialog } from "../../../components/dashboard/create-ad-account-dialog"
import { Button } from "../../../components/ui/button"
import { Plus, LayoutGrid, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { layoutTokens } from "../../../lib/design-tokens"

export default function AccountsClientPage() {
  const searchParams = useSearchParams()
  const businessFilter = searchParams?.get("business")

  return (
    <div className={layoutTokens.spacing.container}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {businessFilter && (
            <Link href="/dashboard/businesses">
              <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Businesses
              </Button>
            </Link>
          )}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-foreground bg-accent">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Accounts
            </Button>
          </div>
        </div>

        <CreateAdAccountDialog
          trigger={
            <Button className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0">
              <Plus className="mr-2 h-4 w-4" />
              Request Account
            </Button>
          }
        />
      </div>

      {/* Accounts Table */}
      <AccountsTable initialBusinessFilter={businessFilter || "all"} />
    </div>
  )
} 