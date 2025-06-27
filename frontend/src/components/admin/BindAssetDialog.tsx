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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { DolphinAsset } from "@/services/supabase-service"
import useSWR from 'swr'

interface Business {
  id: string;
  name: string;
  organization_name: string;
}

interface BindAssetDialogProps {
  asset: DolphinAsset
  onSuccess: () => void
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function BindAssetDialog({ asset, onSuccess }: BindAssetDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data, error: businessesError } = useSWR<any>('/api/admin/businesses', fetcher);
  const businesses = data?.businesses;

  const handleBind = async () => {
    if (!selectedBusinessId) {
      toast.error("Please select a business to bind the asset to.");
      return;
    }
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/asset-bindings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          asset_id: asset.id,
          business_id: selectedBusinessId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to bind asset.")
      }

      toast.success("Asset bound successfully.")
      onSuccess()
      setOpen(false)
    } catch (error) {
      console.error("Binding error:", error)
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          Bind
        </Button>
      </DialogTrigger>
      <DialogContent className="dark">
        <DialogHeader>
          <DialogTitle>Bind Asset: {asset.name}</DialogTitle>
          <DialogDescription>
            Assign this asset to a specific business within an organization.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
            <Label htmlFor="business-select">Business</Label>
            <Select onValueChange={setSelectedBusinessId} disabled={!businesses}>
                <SelectTrigger id="business-select">
                    <SelectValue placeholder="Select a business..." />
                </SelectTrigger>
                <SelectContent>
                    {businessesError && <SelectItem value="error" disabled>Error loading businesses</SelectItem>}
                    {!businesses && !businessesError && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                    {businesses?.map((business) => (
                        <SelectItem key={business.id} value={business.id}>
                           {business.organization_name} &gt; {business.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleBind} disabled={isSubmitting || !selectedBusinessId}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Bind Asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 