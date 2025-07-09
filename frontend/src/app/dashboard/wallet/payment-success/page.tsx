'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSWRConfig } from 'swr'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { CheckCircle, ArrowLeft } from 'lucide-react'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { mutate } = useSWRConfig()
  const { currentOrganizationId } = useOrganizationStore()

  const sessionId = searchParams?.get('session_id')
  const amount = searchParams?.get('amount')

  useEffect(() => {
    // Refresh data when payment succeeds to update wallet balance using optimized SWR keys
    if (currentOrganizationId) {
      mutate(`org-${currentOrganizationId}`) // useCurrentOrganization key
      mutate('transactions') // useTransactions key
    }
  }, [currentOrganizationId, mutate])

  return (
    <div className="container max-w-md mx-auto py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-[#34D197]" />
          </div>
          <CardTitle className="text-2xl text-[#34D197]">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {amount && (
            <p className="text-lg">
              Your wallet has been topped up with <strong>${amount}</strong>
            </p>
          )}
          <p className="text-muted-foreground">
            Your payment has been processed successfully. Your wallet balance has been updated.
          </p>
          {sessionId && (
            <p className="text-xs text-muted-foreground">
              Transaction ID: {sessionId}
            </p>
          )}
          <div className="pt-4">
            <Button 
              onClick={() => router.push('/dashboard/wallet')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 