"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { DolphinAsset } from "@/services/supabase-service"

interface ManageAssetDialogProps {
  asset: DolphinAsset
  onSuccess: () => void
}

export function ManageAssetDialog({ asset, onSuccess }: ManageAssetDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUnbind = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/asset-bindings`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          asset_id: asset.id,
          business_id: asset.binding_info?.business_id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to unbind asset.")
      }

      toast.success("Asset unbound successfully.")
      onSuccess() // Refresh the assets list
      setOpen(false) // Close the dialog
    } catch (error) {
      console.error("Unbinding error:", error)
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent className="dark">
        <DialogHeader>
          <DialogTitle>Manage Asset: {asset.name}</DialogTitle>
          <DialogDescription>
            This asset is currently bound to{" "}
            <span className="font-semibold text-primary">
              {asset.binding_info?.organization_name}
              {asset.binding_info?.business_name && ` > ${asset.binding_info.business_name}`}
            </span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 p-4 bg-gray-800 border border-red-500/50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-400">Unbind Asset</h4>
              <p className="text-sm text-gray-400 mt-1">
                Unbinding this asset will remove its association with the current business. 
                It can be reassigned later. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleUnbind} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Unbinding...
              </>
            ) : (
              "Unbind Asset"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 