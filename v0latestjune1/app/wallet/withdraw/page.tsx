import { DashboardLayout } from "@/components/dashboard-layout"
import { WithdrawFunds } from "@/components/withdraw-funds"

export default function WithdrawPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Withdraw Funds</h1>
        <WithdrawFunds />
      </div>
    </DashboardLayout>
  )
}
