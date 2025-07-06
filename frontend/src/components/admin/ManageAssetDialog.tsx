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
import { Loader2, AlertCircle, Building, Users } from "lucide-react"
import { toast } from "sonner"
import type { DolphinAsset } from "@/services/supabase-service"

interface ManageAssetDialogProps {
  asset: DolphinAsset
  onSuccess: () => void
}

export function ManageAssetDialog({ asset, onSuccess }: ManageAssetDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isBusinessManager = asset.type === 'business_manager'

  const handleUnbind = async () => {
    setIsSubmitting(true)
    try {
      // console.log('🔗 Starting unbind process for asset:', {
      //   name: asset.name,
      //   asset_id: asset.id,
      //   organization_id: asset.organization_id,
      //   organization_name: asset.binding_info?.organization_name,
      //   dolphin_id: asset.dolphin_id
      // })

      // Instead of trying to find the binding through the client endpoint,
      // let's use the backend's unbind-by-asset-id endpoint directly
      const response = await fetch(`/api/admin/dolphin-assets/unbind-by-asset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_id: asset.id,
          organization_id: asset.organization_id,
          cascade: isBusinessManager
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('🔗 Unbind failed:', errorData)
        throw new Error(errorData.error || errorData.detail || "Failed to unbind asset.")
      }

      const result = await response.json()
      // console.log('🔗 Unbind successful:', result)
      
      if (result.unbind_count > 1) {
        toast.success(`Successfully unbound ${result.unbind_count} assets (${isBusinessManager ? 'Business Manager + related ad accounts' : 'asset'})`)
      } else {
        toast.success(result.message || "Asset unbound successfully")
      }

      onSuccess() // Refresh the assets list
      setOpen(false) // Close the dialog
    } catch (error) {
      console.error("🔗 Unbinding error:", error)
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
          <DialogTitle className="flex items-center gap-2">
            {isBusinessManager ? <Building className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            Manage Asset: {asset.name}
          </DialogTitle>
          <DialogDescription>
            This {isBusinessManager ? 'business manager' : 'ad account'} is currently bound to{" "}
            <span className="font-semibold text-primary">
              {asset.binding_info?.organization_name}
            </span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 p-4 bg-gray-800 border border-red-500/50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-400">
                Unbind {isBusinessManager ? 'Business Manager' : 'Ad Account'}
              </h4>
              <p className="text-sm text-gray-400 mt-1">
                {isBusinessManager ? (
                  <>
                    <strong>Cascade Effect:</strong> Unbinding this business manager will also unbind all associated ad accounts. 
                    This will remove the entire business manager and its ad accounts from the client&apos;s dashboard.
                  </>
                ) : (
                  <>
                    Unbinding this ad account will remove it from the client&apos;s dashboard, but other ad accounts 
                    in the same business manager will remain bound.
                  </>
                )}
                <br /><br />
                This action cannot be undone, but assets can be reassigned later.
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
              `Unbind ${isBusinessManager ? 'Business Manager' : 'Ad Account'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 