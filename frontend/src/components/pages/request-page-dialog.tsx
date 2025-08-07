"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, FileText, Loader2 } from 'lucide-react'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { toast } from 'sonner'
import { mutate } from 'swr'

interface RequestPageDialogProps {
  businessManagers?: Array<{
    id: string
    name: string
  }>
}

const PAGE_CATEGORIES = [
  'Business',
  'Brand', 
  'Community',
  'Entertainment',
  'Local Business',
  'Organization',
  'Public Figure',
  'Cause',
  'Event',
  'Product/Service'
]

export function RequestPageDialog({ businessManagers = [] }: RequestPageDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { currentOrganizationId } = useOrganizationStore()

  const [formData, setFormData] = useState({
    page_name: '',
    page_category: '',
    page_description: '',
    business_manager_id: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentOrganizationId) {
      toast.error('No organization selected')
      return
    }

    if (!formData.page_name.trim()) {
      toast.error('Page name is required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/page-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: currentOrganizationId,
          ...formData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit page request')
      }

      toast.success('Page request submitted successfully!')
      
      // Reset form
      setFormData({
        page_name: '',
        page_category: '',
        page_description: '',
        business_manager_id: ''
      })

      // Refresh page requests data
      mutate(`/api/page-requests?organization_id=${currentOrganizationId}`)
      
      setOpen(false)
    } catch (error) {
      console.error('Error submitting page request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit page request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
          <Plus className="w-4 h-4 mr-2" />
          Request Page
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle>Request Facebook Page</DialogTitle>
              <DialogDescription>
                Submit a request for a new Facebook page to be created and attached to your account
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="page_name" className="text-foreground">
              Page Name *
            </Label>
            <Input
              id="page_name"
              value={formData.page_name}
              onChange={(e) => setFormData(prev => ({ ...prev, page_name: e.target.value }))}
              placeholder="Enter the Facebook page name"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="page_category" className="text-foreground">
              Page Category
            </Label>
            <Select
              value={formData.page_category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, page_category: value }))}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Select page category" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {businessManagers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="business_manager_id" className="text-foreground">
                Business Manager (Optional)
              </Label>
              <Select
                value={formData.business_manager_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, business_manager_id: value }))}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select Business Manager" />
                </SelectTrigger>
                <SelectContent>
                  {businessManagers.map((bm) => (
                    <SelectItem key={bm.id} value={bm.id}>
                      {bm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="page_description" className="text-foreground">
              Description (Optional)
            </Label>
            <Textarea
              id="page_description"
              value={formData.page_description}
              onChange={(e) => setFormData(prev => ({ ...prev, page_description: e.target.value }))}
              placeholder="Describe the purpose or content of this page..."
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              rows={3}
            />
          </div>

          <DialogFooter className="flex gap-2">
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
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}