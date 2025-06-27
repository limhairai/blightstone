// types/transaction.ts
export type TransactionType = "deposit" | "withdrawal" | "spend" | "refund";

export type TransactionStatus = "completed" | "pending" | "failed" | "cancelled";

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

// Main transaction interface matching database schema
export interface Transaction {
  id: string;
  organization_id: string;
  wallet_id: string;
  business_id?: string;
  type: TransactionType;
  amount_cents: number;
  status: TransactionStatus;
  description?: string;
  metadata?: Record<string, any>;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

// Legacy interface for backward compatibility
export interface LegacyTransaction {
  id: string;
  type: "wallet_topup" | "wallet_withdrawal" | "business_transfer" | "account_topup" | "ad_spend" | "refund";
  amount: number;
  fee?: number;
  description: string;
  status: TransactionStatus;
  timestamp: string;
  reference?: string;
  businessId?: string;
  businessName?: string;
  accountId?: string;
  accountName?: string;
} 