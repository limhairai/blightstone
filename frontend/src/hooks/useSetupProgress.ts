import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAppData } from '../contexts/AppDataContext'
import { getSetupProgress, SetupProgress } from '../lib/state-utils'

export function useSetupProgress(): SetupProgress {
  const { user } = useAuth()
  const { state } = useAppData()

  return useMemo(() => {
    // Use app data state
    const walletBalance = state.financialData.totalBalance
    const accountsCount = state.accounts.length
    const businessesCount = state.businesses.length

    return getSetupProgress(
      !!user, // User is authenticated
      walletBalance > 0, // Has wallet balance
      businessesCount > 0, // Has businesses
      accountsCount > 0 // Has ad accounts
    )
  }, [user, state.financialData.totalBalance, state.businesses.length, state.accounts.length])
} 