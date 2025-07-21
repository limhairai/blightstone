import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganizationStore } from '@/lib/stores/organization-store'

export function useWalletBalance() {
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()

  const fetchBalance = async () => {
    if (!session?.access_token || !currentOrganizationId) {
      setBalance(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/organizations/${currentOrganizationId}/wallet`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch wallet balance')
      }

      const data = await response.json()
      setBalance(data.balance || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance')
      setBalance(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [session?.access_token, currentOrganizationId])

  const refreshBalance = () => {
    fetchBalance()
  }

  return {
    balance,
    isLoading,
    error,
    refreshBalance
  }
} 