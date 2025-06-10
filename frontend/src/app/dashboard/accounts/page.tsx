import type { Metadata } from "next"
import AccountsPageV0 from "./accounts-page-v0"

export const metadata: Metadata = {
  title: "Accounts | AdHub",
  description: "Manage your ad accounts and projects",
}

export default function AccountsPage() {
  return <AccountsPageV0 />
} 