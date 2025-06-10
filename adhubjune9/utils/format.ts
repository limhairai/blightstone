import { MOCK_ACCOUNTS } from "@/data/mock-accounts"

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getTotalAccountsBalance(): number {
  return MOCK_ACCOUNTS.reduce((total, account) => total + account.balance, 0)
}
