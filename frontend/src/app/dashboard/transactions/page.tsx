"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TransactionsRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the new combined transactions page
    router.replace("/dashboard/topup-requests")
  }, [router])
  
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-muted-foreground">Redirecting to Transactions...</div>
      </div>
    </div>
  )
} 