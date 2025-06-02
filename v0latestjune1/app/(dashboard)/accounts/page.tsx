import type { Metadata } from "next"
import AccountsClientPage from "./AccountsClientPage"

export const metadata: Metadata = {
  title: "Accounts | AdHub",
  description: "Manage your ad accounts",
}

export default function AccountsPage() {
  return <AccountsClientPage />
}
