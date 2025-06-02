import { TransactionHistory } from "@/components/transaction-history"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Transactions | AdHub",
  description: "View your transaction history",
}

export default function Page() {
  return (
    <div className="px-4 pt-2">
      <TransactionHistory />
    </div>
  )
}
