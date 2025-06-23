import type { Metadata } from "next"
import { Suspense } from "react"
import AccountsClientPage from "./AccountsClientPage"
import { Loader2 } from "lucide-react"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Accounts | AdHub",
  description: "Manage your ad accounts and projects",
}

function AccountsPageLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">Loading accounts...</span>
    </div>
  )
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<AccountsPageLoading />}>
      <AccountsClientPage />
    </Suspense>
  )
} 