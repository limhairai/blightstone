"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Loader2, Info, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface BusinessManager {
  asset_id: string
  name: string
  dolphin_id: string
}

interface PixelRequestDialogProps {
  businessManagers: BusinessManager[]
  onRequestSubmitted: () => void
}

export function PixelRequestDialog({ businessManagers, onRequestSubmitted }: PixelRequestDialogProps) {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    pixel_id: '',
    pixel_name: '',
    business_manager_id: ''
  })

  const selectedBM = businessManagers.find(bm => bm.dolphin_id === formData.business_manager_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.pixel_id || !formData.business_manager_id) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          type: 'pixel_connection',
          pixel_id: formData.pixel_id,
          pixel_name: formData.pixel_name || `Pixel ${formData.pixel_id}`,
          target_bm_dolphin_id: formData.business_manager_id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit pixel connection request')
      }

      const result = await response.json()
      
      toast.success('Pixel connection request submitted successfully!', {
        description: 'Your request is now under review and will be processed within 1-3 business days.'
      })
      
      // Reset form
      setFormData({
        pixel_id: '',
        pixel_name: '',
        business_manager_id: ''
      })
      
      setOpen(false)
      onRequestSubmitted()
      
    } catch (error) {
      console.error('Error submitting pixel request:', error)
      toast.error('Failed to submit request', {
        description: error instanceof Error ? error.message : 'Please try again or contact support.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm"
          className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0"
          disabled={businessManagers.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Request Pixel Connection
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pixel ID */}
          <div className="space-y-2">
            <Label htmlFor="pixel_id">
              Pixel ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pixel_id"
              type="text"
              value={formData.pixel_id}
              onChange={(e) => setFormData(prev => ({ ...prev, pixel_id: e.target.value }))}
              placeholder="Enter Facebook Pixel ID"
              required
            />
          </div>

          {/* Pixel Name (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="pixel_name">
              Pixel Name <span className="text-muted-foreground text-sm">(Optional)</span>
            </Label>
            <Input
              id="pixel_name"
              type="text"
              value={formData.pixel_name}
              onChange={(e) => setFormData(prev => ({ ...prev, pixel_name: e.target.value }))}
              placeholder="Enter a name for this pixel"
            />
          </div>

          {/* Business Manager Selection */}
          <div className="space-y-2">
            <Label htmlFor="business_manager">
              Business Manager <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.business_manager_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, business_manager_id: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a business manager" />
              </SelectTrigger>
              <SelectContent>
                {businessManagers
                  .filter(bm => bm.dolphin_id) // Only show BMs with valid IDs
                  .map((bm) => (
                    <SelectItem key={bm.dolphin_id} value={bm.dolphin_id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{bm.name}</span>
                        <span className="text-xs text-muted-foreground">ID: {bm.dolphin_id}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected BM Info */}
          {selectedBM && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Pixel will be connected to <strong>{selectedBM.name}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Info Box */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <h4 className="text-sm font-medium mb-2">What happens next?</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Your pixel connection request will be reviewed within 1-3 business days</li>
              <li>• Once approved, the pixel will be connected to your selected Business Manager</li>
              <li>• You'll be able to use the pixel for tracking and optimization</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.pixel_id || !formData.business_manager_id}
              className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 