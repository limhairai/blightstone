import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAppData } from '../contexts/ProductionDataContext'
import { getSetupProgress, SetupProgress } from '../lib/state-utils'
import { MOCK_FINANCIAL_DATA, MOCK_ACCOUNTS } from '../lib/mock-data'

export function useSetupProgress(): SetupProgress {
  const { user } = useAuth()
  const { currentOrg, organizations } = useAppData()

  return useMemo(() => {
    // Use real data where available, fallback to mock data
    const realBalance = currentOrg?.balance || MOCK_FINANCIAL_DATA.walletBalance
    const accountsCount = MOCK_ACCOUNTS.length // In real app, this would come from API

    return getSetupProgress(
      !!user?.email_confirmed_at, // Email verified
      realBalance > 0, // Has wallet balance
      organizations.length > 0, // Has businesses (using organizations as proxy)
      accountsCount > 0 // Has ad accounts
    )
  }, [user?.email_confirmed_at, currentOrg?.balance, organizations.length])
} 