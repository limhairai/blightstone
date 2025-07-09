import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface TopupLimitInfo {
  allowed: boolean
  reason: string
  currentUsage: number
  limit: number | null
  available: number | null
  planName: string
  hasLimit: boolean
  isUnlimited: boolean
}

export function useTopupLimits(organizationId: string | null, amount?: number) {
  const [limitInfo, setLimitInfo] = useState<TopupLimitInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { session } = useAuth()

  useEffect(() => {
    if (!organizationId || !session?.access_token) {
      setLimitInfo(null)
      return
    }

    const fetchLimitInfo = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          organizationId
        })
        
        if (amount && amount > 0) {
          params.append('amount', amount.toString())
        }

        const response = await fetch(`/api/topup-limits?${params}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch limit information')
        }

        const data = await response.json()
        setLimitInfo(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLimitInfo(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLimitInfo()
  }, [organizationId, amount, session?.access_token])

  return { limitInfo, isLoading, error }
} 