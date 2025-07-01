export type TransactionType =
  | "wallet_topup"
  | "wallet_withdrawal"
  | "business_transfer"
  | "account_topup"
  | "ad_spend"
  | "refund"

export type TransactionStatus = "completed" | "pending" | "failed" | "cancelled"

export interface TransactionSource {
  id: string
  name: string
  type: "wallet" | "business" | "account"
}

export interface TransactionDestination {
  id: string
  name: string
  type: "wallet" | "business" | "account" | "external"
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  fee?: number
  description: string
  status: TransactionStatus
  timestamp: string
  reference?: string
  source?: TransactionSource
  destination?: TransactionDestination
  businessId?: string
  businessName?: string
  accountId?: string
  accountName?: string
}
