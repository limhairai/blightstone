"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { useBusinessManagers, useAdAccounts } from '@/lib/swr-config'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { 
  X, 
  Upload, 
  AlertCircle, 
  Building2, 
  CreditCard,
  Loader2,
  Search
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { 
  CreateTicketData, 
  SupportTicket, 
  TicketCategory,
  TICKET_CATEGORIES,
  Asset
} from '@/types/support'

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTicketCreated: (ticket: SupportTicket) => void
  children?: React.ReactNode
}

export function CreateTicketDialog({ open, onOpenChange, onTicketCreated }: CreateTicketDialogProps) {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const { data: businessManagers = [] } = useBusinessManagers()
  const { data: adAccountsData } = useAdAccounts()
  
  const adAccounts = adAccountsData?.accounts || []
  
  const [formData, setFormData] = useState<CreateTicketData>({
    subject: '',
    category: 'general_inquiry',
    initialMessage: '',
    affectedAssetIds: []
  })
  const [loading, setLoading] = useState(false)
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        subject: '',
        category: 'general_inquiry',
        initialMessage: '',
        affectedAssetIds: []
      })
      setSelectedAssets([])
    }
  }, [open])

  // Handle asset selection
  const handleAssetToggle = (asset: { id: string, name: string, type: 'business_manager' | 'ad_account' }) => {
    setSelectedAssets(prev => {
      const exists = prev.find(a => a.id === asset.id)
      if (exists) {
        return prev.filter(a => a.id !== asset.id)
      } else {
        return [...prev, asset]
      }
    })
    
    setFormData(prev => ({
      ...prev,
      affectedAssetIds: selectedAssets.find(a => a.id === asset.id)
        ? (prev.affectedAssetIds || []).filter((id: string) => id !== asset.id)
        : [...(prev.affectedAssetIds || []), asset.id]
    }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.access_token) {
      toast.error('Authentication required')
      return
    }

    if (!formData.subject.trim() || !formData.initialMessage.trim()) {
      toast.error('Subject and message are required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: formData.subject.trim(),
          category: formData.category,
          affectedAssetIds: formData.affectedAssetIds,
          initialMessage: formData.initialMessage.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create ticket')
      }

      const data = await response.json()
      onTicketCreated(data.ticket)
      onOpenChange(false)
      
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Two-column grid layout for better space utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  placeholder="Brief description of the issue..."
                  value={formData.subject}
                  onChange={(e) => setFormData((prev: CreateTicketData) => ({ ...prev, subject: e.target.value }))}
                />
              </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData((prev: CreateTicketData) => ({ ...prev, category: value as TicketCategory }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TICKET_CATEGORIES).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    placeholder="Describe your issue in detail..."
                    value={formData.initialMessage}
                    onChange={(e) => setFormData((prev: CreateTicketData) => ({ ...prev, initialMessage: e.target.value }))}
                    rows={4}
                  />
              </div>
            </div>

            {/* Right Column - Assets & Attachments */}
            <div className="space-y-4">
              {/* Affected Assets */}
              <div className="space-y-2">
                <Label>Affected Assets (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Select any business managers or ad accounts related to this issue
                </p>
                
                {/* Selected Assets */}
                {selectedAssets.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedAssets.map(asset => (
                      <Badge key={asset.id} variant="secondary" className="pr-1">
                        {asset.type === 'business_manager' ? (
                          <Building2 className="h-3 w-3 mr-1" />
                        ) : (
                          <CreditCard className="h-3 w-3 mr-1" />
                        )}
                        {asset.name}
                        <button
                          type="button"
                          onClick={() => handleAssetToggle(asset)}
                          className="ml-1 hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Asset Selection Dropdown */}
                {(businessManagers.length > 0 || adAccounts.length > 0) && (
                  <Select
                    onValueChange={(value) => {
                      // Parse the value to get asset info
                      const [type, id] = value.split(':')
                      const asset = type === 'business_manager' 
                        ? businessManagers.find((bm: any) => bm.id === id)
                        : adAccounts.find((acc: any) => acc.id === id)
                      
                      if (asset) {
                        handleAssetToggle({
                          id: asset.id,
                          name: asset.name,
                          type: type as 'business_manager' | 'ad_account'
                        })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add an asset..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Business Managers Group */}
                      {businessManagers.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            Business Managers
                          </div>
                          {businessManagers.map((bm: any) => {
                            const isSelected = selectedAssets.find(a => a.id === bm.id)
                            if (isSelected) return null // Hide already selected assets
                            
                            return (
                              <SelectItem key={bm.id} value={`business_manager:${bm.id}`}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span>{bm.name}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </>
                      )}
                      
                      {/* Ad Accounts Group */}
                      {adAccounts.length > 0 && (
                        <>
                          {businessManagers.length > 0 && (
                            <div className="h-px bg-border my-1" />
                          )}
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            Ad Accounts
                          </div>
                          {adAccounts.map((account: any) => {
                            const isSelected = selectedAssets.find(a => a.id === account.id)
                            if (isSelected) return null // Hide already selected assets
                            
                            return (
                              <SelectItem key={account.id} value={`ad_account:${account.id}`}>
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                                  <span>{account.name}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* File Upload Placeholder */}
              <div className="space-y-2">
                <Label>Attachments (Coming Soon)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    File upload will be available soon
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions - Full width at bottom */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Submit Ticket'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 