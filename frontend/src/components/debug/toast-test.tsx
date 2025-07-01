"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function ToastTest() {
  const testToasts = () => {
    toast.success("Success toast test!")
    setTimeout(() => {
      toast.error("Error toast test!")
    }, 1000)
    setTimeout(() => {
      toast.info("Info toast test!")
    }, 2000)
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button onClick={testToasts} variant="outline" size="sm">
        Test Toasts
      </Button>
    </div>
  )
} 