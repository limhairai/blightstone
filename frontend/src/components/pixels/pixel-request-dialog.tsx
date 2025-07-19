"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface BusinessManager {
  asset_id: string
  name: string
  dolphin_business_manager_id: string
  status: string
  is_active: boolean
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.pixel_id || !formData.business_manager_id) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate that pixel_id is numeric
    if (!/^\d+$/.test(formData.pixel_id)) {
      toast.error('Pixel ID must contain only numbers')
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
      toast.error(error instanceof Error ? error.message : 'Failed to submit pixel connection request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Pixel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Pixel Connection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_manager">Business Manager</Label>
            <Select 
              value={formData.business_manager_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, business_manager_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a business manager" />
              </SelectTrigger>
              <SelectContent>
                {businessManagers.map((bm) => (
                  <SelectItem key={bm.asset_id} value={bm.dolphin_business_manager_id}>
                    {bm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pixel_id">Pixel ID</Label>
                  <Input
                    id="pixel_id"
                    value={formData.pixel_id}
                    onChange={(e) => {
                      // Only allow numeric characters
                      const numericValue = e.target.value.replace(/[^0-9]/g, '')
                      setFormData(prev => ({ 
                        ...prev, 
                        pixel_id: numericValue
                      }))
                    }}
                    placeholder="Enter your pixel ID (numbers only)"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pixel_name">Pixel Name (Optional)</Label>
                  <Input
                    id="pixel_name"
                    value={formData.pixel_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, pixel_name: e.target.value }))}
              placeholder="Enter pixel name (optional)"
                  />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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