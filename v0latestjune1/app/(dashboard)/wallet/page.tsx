import { WalletDashboard } from "@/components/wallet-dashboard"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Wallet | AdHub",
  description: "Manage your wallet and transactions",
}

export default function WalletPage() {
  return <WalletDashboard />
}
