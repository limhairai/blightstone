"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState } from "react"
import { BatchApplicationForm } from "./batch-application-form" // Updated import path

export function AccountApplicationDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (_formData: unknown) => {
    setError(null)
    try {
      setIsSubmitting(true)
      // Simulate API call
      await new Promise((res) => setTimeout(res, 1000))
      setIsSubmitting(false)
      if (onSuccess) onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unknown error occurred")
      }
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient">
            Ad Account Application
          </DialogTitle>
        </DialogHeader>
        {error && <div className="bg-red-900 text-red-200 rounded p-3 mb-4 text-sm">{error}</div>}
        <div className="flex-1 overflow-y-auto pt-0">
          <BatchApplicationForm onSubmit={handleSubmit} loading={isSubmitting} />
        </div>
      </DialogContent>
    </Dialog>
  )
} 