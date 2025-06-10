// Utility functions for empty state logic

export interface EmptyStateConditions {
  noTransactions: boolean
  noAccounts: boolean
  noBalance: boolean
  emailNotVerified: boolean
}

export function checkEmptyState(
  transactionsCount: number,
  accountsCount: number,
  balance: number,
  emailVerified: boolean
): EmptyStateConditions {
  return {
    noTransactions: transactionsCount === 0,
    noAccounts: accountsCount === 0,
    noBalance: balance === 0,
    emailNotVerified: !emailVerified
  }
}

export function shouldShowSetupElements(conditions: EmptyStateConditions): boolean {
  return conditions.noTransactions && conditions.noAccounts && conditions.noBalance
}

export function shouldShowEmailBanner(conditions: EmptyStateConditions): boolean {
  return conditions.emailNotVerified
} 