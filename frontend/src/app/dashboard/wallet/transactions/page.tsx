"use client"

import { TransactionHistory } from "@/components/transaction-history"
// import { AppShell } from "@/components/app-shell"; // No longer needed here

export default function TransactionsPage() {
  // AppShell is provided by layout.tsx
  // The TransactionHistory component from v0-frontend didn't use a hideHeader prop.
  return <TransactionHistory /> 
} 