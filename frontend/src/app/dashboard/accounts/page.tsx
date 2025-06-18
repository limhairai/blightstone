import type { Metadata } from "next"
import AccountsPageV0 from "./accounts-page-v0"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Accounts | AdHub",
  description: "Manage your ad accounts and projects",
}

export default function AccountsPage() {
  return <AccountsPageV0 />
} 