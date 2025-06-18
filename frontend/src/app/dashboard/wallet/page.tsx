"use client"

import { WalletView } from "../../../components/dashboard/wallet/wallet-view"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

export default function WalletPage() {
  return <WalletView />
} 